#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
const timeout = parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1] || '300');

console.log(`🔍 Starting deployment health monitoring for ${environment} environment...`);
console.log(`⏱️  Monitoring timeout: ${timeout} seconds`);

async function monitorDeployment() {
  const startTime = Date.now();
  const endTime = startTime + (timeout * 1000);
  
  const stackName = `InventoryReplenishmentStack-${environment}`;
  const healthChecks = [];
  
  try {
    console.log(`📋 Getting deployment information for ${stackName}...`);
    
    // Get stack outputs
    const stackOutputs = JSON.parse(execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query 'Stacks[0].Outputs' --output json`,
      { encoding: 'utf8' }
    ));
    
    const outputs = {};
    stackOutputs.forEach(output => {
      outputs[output.OutputKey] = output.OutputValue;
    });
    
    console.log('📊 Stack outputs retrieved:', Object.keys(outputs));
    
    // Monitor different components
    const monitoringTasks = [
      () => monitorApiGateway(outputs.ApiGatewayUrl),
      () => monitorLambdaFunctions(stackName),
      () => monitorDynamoDBTables(stackName),
      () => monitorS3Buckets(outputs.FrontendBucketName),
      () => monitorCloudFront(outputs.CloudFrontDistributionId),
    ];
    
    let allHealthy = false;
    let attempts = 0;
    const maxAttempts = Math.floor(timeout / 30); // Check every 30 seconds
    
    while (!allHealthy && Date.now() < endTime) {
      attempts++;
      console.log(`\n🔄 Health check attempt ${attempts}/${maxAttempts}...`);
      
      const results = [];
      
      for (const task of monitoringTasks) {
        try {
          const result = await task();
          results.push(result);
          healthChecks.push(result);
        } catch (error) {
          const errorResult = {
            component: 'unknown',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
          };
          results.push(errorResult);
          healthChecks.push(errorResult);
        }
      }
      
      // Check if all components are healthy
      allHealthy = results.every(result => result.status === 'healthy');
      
      if (allHealthy) {
        console.log('✅ All components are healthy!');
        break;
      }
      
      // Show current status
      results.forEach(result => {
        const icon = result.status === 'healthy' ? '✅' : '❌';
        console.log(`${icon} ${result.component}: ${result.status}`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      });
      
      if (Date.now() < endTime) {
        console.log('⏳ Waiting 30 seconds before next check...');
        await sleep(30000);
      }
    }
    
    if (!allHealthy) {
      throw new Error(`Deployment health monitoring timed out after ${timeout} seconds`);
    }
    
    // Generate health report
    generateHealthReport(environment, healthChecks, startTime);
    
    console.log('🎉 Deployment health monitoring completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment health monitoring failed:', error.message);
    
    // Generate failure report
    generateHealthReport(environment, healthChecks, startTime, error.message);
    
    process.exit(1);
  }
}

async function monitorApiGateway(apiUrl) {
  if (!apiUrl) {
    return {
      component: 'API Gateway',
      status: 'skipped',
      message: 'No API Gateway URL found',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    // Test health endpoint
    const healthEndpoint = `${apiUrl}/health`;
    execSync(`curl -f -s --max-time 10 ${healthEndpoint}`, { stdio: 'pipe' });
    
    return {
      component: 'API Gateway',
      status: 'healthy',
      url: apiUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'API Gateway',
      status: 'unhealthy',
      url: apiUrl,
      error: 'Health endpoint not responding',
      timestamp: new Date().toISOString()
    };
  }
}

async function monitorLambdaFunctions(stackName) {
  try {
    // Get Lambda functions from the stack
    const functions = JSON.parse(execSync(
      `aws cloudformation list-stack-resources --stack-name ${stackName} --query 'StackResourceSummaries[?ResourceType==\`AWS::Lambda::Function\`].PhysicalResourceId' --output json`,
      { encoding: 'utf8' }
    ));
    
    if (functions.length === 0) {
      return {
        component: 'Lambda Functions',
        status: 'skipped',
        message: 'No Lambda functions found',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check each function's recent invocations and errors
    let allHealthy = true;
    const functionStatuses = [];
    
    for (const functionName of functions) {
      try {
        // Get recent error metrics
        const errorMetrics = execSync(
          `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors --dimensions Name=FunctionName,Value=${functionName} --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Sum --output json`,
          { encoding: 'utf8', stdio: 'pipe' }
        );
        
        const metrics = JSON.parse(errorMetrics);
        const recentErrors = metrics.Datapoints.reduce((sum, dp) => sum + dp.Sum, 0);
        
        if (recentErrors > 0) {
          allHealthy = false;
          functionStatuses.push(`${functionName}: ${recentErrors} errors`);
        }
      } catch (error) {
        // If we can't get metrics, assume function is healthy
        // (might be a new function with no invocations yet)
      }
    }
    
    return {
      component: 'Lambda Functions',
      status: allHealthy ? 'healthy' : 'unhealthy',
      functionsCount: functions.length,
      issues: functionStatuses,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'Lambda Functions',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function monitorDynamoDBTables(stackName) {
  try {
    // Get DynamoDB tables from the stack
    const tables = JSON.parse(execSync(
      `aws cloudformation list-stack-resources --stack-name ${stackName} --query 'StackResourceSummaries[?ResourceType==\`AWS::DynamoDB::Table\`].PhysicalResourceId' --output json`,
      { encoding: 'utf8' }
    ));
    
    if (tables.length === 0) {
      return {
        component: 'DynamoDB Tables',
        status: 'skipped',
        message: 'No DynamoDB tables found',
        timestamp: new Date().toISOString()
      };
    }
    
    // Check each table status
    let allHealthy = true;
    const tableStatuses = [];
    
    for (const tableName of tables) {
      try {
        const tableInfo = JSON.parse(execSync(
          `aws dynamodb describe-table --table-name ${tableName} --query 'Table.{Status:TableStatus,ItemCount:ItemCount}' --output json`,
          { encoding: 'utf8' }
        ));
        
        if (tableInfo.Status !== 'ACTIVE') {
          allHealthy = false;
          tableStatuses.push(`${tableName}: ${tableInfo.Status}`);
        }
      } catch (error) {
        allHealthy = false;
        tableStatuses.push(`${tableName}: Error checking status`);
      }
    }
    
    return {
      component: 'DynamoDB Tables',
      status: allHealthy ? 'healthy' : 'unhealthy',
      tablesCount: tables.length,
      issues: tableStatuses,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'DynamoDB Tables',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function monitorS3Buckets(bucketName) {
  if (!bucketName) {
    return {
      component: 'S3 Buckets',
      status: 'skipped',
      message: 'No S3 bucket name provided',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    // Check if bucket exists and is accessible
    execSync(`aws s3 ls s3://${bucketName}/ --max-items 1`, { stdio: 'pipe' });
    
    return {
      component: 'S3 Buckets',
      status: 'healthy',
      bucketName: bucketName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'S3 Buckets',
      status: 'unhealthy',
      bucketName: bucketName,
      error: 'Bucket not accessible',
      timestamp: new Date().toISOString()
    };
  }
}

async function monitorCloudFront(distributionId) {
  if (!distributionId || distributionId === 'None') {
    return {
      component: 'CloudFront',
      status: 'skipped',
      message: 'No CloudFront distribution found',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    // Check distribution status
    const distributionInfo = JSON.parse(execSync(
      `aws cloudfront get-distribution --id ${distributionId} --query 'Distribution.{Status:Status,DomainName:DomainName}' --output json`,
      { encoding: 'utf8' }
    ));
    
    const isHealthy = distributionInfo.Status === 'Deployed';
    
    return {
      component: 'CloudFront',
      status: isHealthy ? 'healthy' : 'unhealthy',
      distributionId: distributionId,
      distributionStatus: distributionInfo.Status,
      domainName: distributionInfo.DomainName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'CloudFront',
      status: 'unhealthy',
      distributionId: distributionId,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

function generateHealthReport(environment, healthChecks, startTime, error = null) {
  const report = {
    environment,
    monitoringStartTime: new Date(startTime).toISOString(),
    monitoringEndTime: new Date().toISOString(),
    monitoringDuration: Math.round((Date.now() - startTime) / 1000),
    status: error ? 'failed' : 'success',
    error: error || null,
    healthChecks: healthChecks,
    summary: {
      totalChecks: healthChecks.length,
      healthyComponents: healthChecks.filter(check => check.status === 'healthy').length,
      unhealthyComponents: healthChecks.filter(check => check.status === 'unhealthy').length,
      skippedComponents: healthChecks.filter(check => check.status === 'skipped').length
    }
  };
  
  const reportFile = path.join(__dirname, `../health-report-${environment}-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  console.log(`📝 Health report generated: ${reportFile}`);
  
  // Also log to deployment history
  updateDeploymentHistory(environment, report);
}

function updateDeploymentHistory(environment, healthReport) {
  const historyFile = path.join(__dirname, `../deployment-history-${environment}.json`);
  let history = { deployments: [] };
  
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Failed to read deployment history');
    }
  }
  
  // Update the most recent deployment with health monitoring results
  if (history.deployments.length > 0) {
    history.deployments[0].healthMonitoring = healthReport;
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run monitoring
monitorDeployment();