#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'json';

console.log(`📊 Generating deployment report for ${environment} environment...`);

async function generateDeploymentReport() {
  try {
    const stackName = `InventoryReplenishmentStack-${environment}`;
    const timestamp = new Date().toISOString();
    
    console.log(`📋 Collecting deployment information for ${stackName}...`);
    
    // Collect deployment information
    const deploymentInfo = await collectDeploymentInfo(stackName, environment);
    
    // Generate report in requested format
    const report = {
      metadata: {
        reportGeneratedAt: timestamp,
        environment: environment,
        reportVersion: '1.0.0',
        generatedBy: process.env.USER || process.env.USERNAME || 'automated'
      },
      deployment: deploymentInfo,
      infrastructure: await collectInfrastructureInfo(stackName),
      application: await collectApplicationInfo(),
      security: await collectSecurityInfo(stackName),
      performance: await collectPerformanceInfo(stackName),
      costs: await collectCostInfo(stackName),
      recommendations: generateRecommendations(deploymentInfo)
    };
    
    // Save report in different formats
    await saveReport(report, environment, format);
    
    console.log('🎉 Deployment report generated successfully!');
    
  } catch (error) {
    console.error('❌ Failed to generate deployment report:', error.message);
    process.exit(1);
  }
}

async function collectDeploymentInfo(stackName, environment) {
  try {
    // Get stack information
    const stackInfo = JSON.parse(execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --output json`,
      { encoding: 'utf8' }
    ));
    
    const stack = stackInfo.Stacks[0];
    
    // Get deployment history
    const deploymentHistory = getDeploymentHistory(environment);
    
    // Get current commit information
    let gitInfo = {};
    try {
      gitInfo = {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
        commitMessage: execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim(),
        commitAuthor: execSync('git log -1 --pretty=%an', { encoding: 'utf8' }).trim(),
        commitDate: execSync('git log -1 --pretty=%ai', { encoding: 'utf8' }).trim()
      };
    } catch (error) {
      console.warn('⚠️  Could not retrieve git information');
    }
    
    return {
      stackName: stack.StackName,
      stackStatus: stack.StackStatus,
      creationTime: stack.CreationTime,
      lastUpdatedTime: stack.LastUpdatedTime,
      description: stack.Description,
      parameters: stack.Parameters || [],
      outputs: stack.Outputs || [],
      tags: stack.Tags || [],
      git: gitInfo,
      deploymentHistory: deploymentHistory.slice(0, 5) // Last 5 deployments
    };
  } catch (error) {
    throw new Error(`Failed to collect deployment info: ${error.message}`);
  }
}

async function collectInfrastructureInfo(stackName) {
  try {
    // Get stack resources
    const resources = JSON.parse(execSync(
      `aws cloudformation list-stack-resources --stack-name ${stackName} --output json`,
      { encoding: 'utf8' }
    ));
    
    // Group resources by type
    const resourcesByType = {};
    resources.StackResourceSummaries.forEach(resource => {
      const type = resource.ResourceType;
      if (!resourcesByType[type]) {
        resourcesByType[type] = [];
      }
      resourcesByType[type].push({
        logicalId: resource.LogicalResourceId,
        physicalId: resource.PhysicalResourceId,
        status: resource.ResourceStatus,
        lastUpdated: resource.LastUpdatedTimestamp
      });
    });
    
    // Get detailed information for key resources
    const lambdaFunctions = await getLambdaFunctionDetails(resourcesByType['AWS::Lambda::Function'] || []);
    const dynamoTables = await getDynamoTableDetails(resourcesByType['AWS::DynamoDB::Table'] || []);
    const s3Buckets = await getS3BucketDetails(resourcesByType['AWS::S3::Bucket'] || []);
    
    return {
      totalResources: resources.StackResourceSummaries.length,
      resourcesByType: Object.keys(resourcesByType).map(type => ({
        type,
        count: resourcesByType[type].length,
        resources: resourcesByType[type]
      })),
      lambdaFunctions,
      dynamoTables,
      s3Buckets
    };
  } catch (error) {
    throw new Error(`Failed to collect infrastructure info: ${error.message}`);
  }
}

async function collectApplicationInfo() {
  try {
    // Get package.json information
    const packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const frontendPackageInfo = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    // Get test results if available
    let testResults = null;
    try {
      if (fs.existsSync('test-results.json')) {
        testResults = JSON.parse(fs.readFileSync('test-results.json', 'utf8'));
      }
    } catch (error) {
      console.warn('⚠️  Could not read test results');
    }
    
    return {
      backend: {
        name: packageInfo.name,
        version: packageInfo.version,
        description: packageInfo.description,
        dependencies: Object.keys(packageInfo.dependencies || {}).length,
        devDependencies: Object.keys(packageInfo.devDependencies || {}).length
      },
      frontend: {
        name: frontendPackageInfo.name,
        version: frontendPackageInfo.version,
        dependencies: Object.keys(frontendPackageInfo.dependencies || {}).length,
        devDependencies: Object.keys(frontendPackageInfo.devDependencies || {}).length
      },
      testResults
    };
  } catch (error) {
    throw new Error(`Failed to collect application info: ${error.message}`);
  }
}

async function collectSecurityInfo(stackName) {
  try {
    // Check for security-related resources
    const securityInfo = {
      iamRoles: [],
      iamPolicies: [],
      kmsKeys: [],
      securityGroups: [],
      encryption: {
        s3: false,
        dynamodb: false,
        lambda: false
      }
    };
    
    // Get IAM roles and policies from the stack
    try {
      const iamRoles = JSON.parse(execSync(
        `aws cloudformation list-stack-resources --stack-name ${stackName} --query 'StackResourceSummaries[?ResourceType==\`AWS::IAM::Role\`]' --output json`,
        { encoding: 'utf8' }
      ));
      securityInfo.iamRoles = iamRoles.map(role => role.LogicalResourceId);
    } catch (error) {
      console.warn('⚠️  Could not retrieve IAM roles');
    }
    
    // Check for KMS keys
    try {
      const kmsKeys = JSON.parse(execSync(
        `aws cloudformation list-stack-resources --stack-name ${stackName} --query 'StackResourceSummaries[?ResourceType==\`AWS::KMS::Key\`]' --output json`,
        { encoding: 'utf8' }
      ));
      securityInfo.kmsKeys = kmsKeys.map(key => key.LogicalResourceId);
    } catch (error) {
      console.warn('⚠️  Could not retrieve KMS keys');
    }
    
    return securityInfo;
  } catch (error) {
    throw new Error(`Failed to collect security info: ${error.message}`);
  }
}

async function collectPerformanceInfo(stackName) {
  try {
    const performanceInfo = {
      lambdaMetrics: [],
      apiGatewayMetrics: null,
      dynamoMetrics: [],
      cloudFrontMetrics: null
    };
    
    // Get Lambda function performance metrics
    try {
      const lambdaFunctions = JSON.parse(execSync(
        `aws cloudformation list-stack-resources --stack-name ${stackName} --query 'StackResourceSummaries[?ResourceType==\`AWS::Lambda::Function\`].PhysicalResourceId' --output json`,
        { encoding: 'utf8' }
      ));
      
      for (const functionName of lambdaFunctions) {
        try {
          const metrics = await getLambdaMetrics(functionName);
          performanceInfo.lambdaMetrics.push({
            functionName,
            ...metrics
          });
        } catch (error) {
          console.warn(`⚠️  Could not get metrics for Lambda function ${functionName}`);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not retrieve Lambda functions for metrics');
    }
    
    return performanceInfo;
  } catch (error) {
    throw new Error(`Failed to collect performance info: ${error.message}`);
  }
}

async function collectCostInfo(stackName) {
  try {
    // Get cost information for the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const costData = JSON.parse(execSync(
        `aws ce get-cost-and-usage --time-period Start=${startDate},End=${endDate} --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE --filter '{"Dimensions":{"Key":"RESOURCE_ID","Values":["${stackName}"]}}' --output json`,
        { encoding: 'utf8', stdio: 'pipe' }
      ));
      
      return {
        period: {
          start: startDate,
          end: endDate
        },
        totalCost: costData.ResultsByTime[0]?.Total?.BlendedCost?.Amount || '0',
        currency: costData.ResultsByTime[0]?.Total?.BlendedCost?.Unit || 'USD',
        serviceBreakdown: costData.ResultsByTime[0]?.Groups || []
      };
    } catch (error) {
      console.warn('⚠️  Could not retrieve cost information');
      return {
        period: { start: startDate, end: endDate },
        totalCost: 'N/A',
        currency: 'USD',
        serviceBreakdown: [],
        error: 'Cost data not available'
      };
    }
  } catch (error) {
    throw new Error(`Failed to collect cost info: ${error.message}`);
  }
}

function generateRecommendations(deploymentInfo) {
  const recommendations = [];
  
  // Check deployment age
  const lastUpdated = new Date(deploymentInfo.lastUpdatedTime);
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysSinceUpdate > 30) {
    recommendations.push({
      type: 'maintenance',
      priority: 'medium',
      title: 'Consider updating deployment',
      description: `This deployment hasn't been updated in ${daysSinceUpdate} days. Consider reviewing for security updates and improvements.`
    });
  }
  
  // Check for missing tags
  const requiredTags = ['Environment', 'Project', 'Owner'];
  const existingTags = deploymentInfo.tags.map(tag => tag.Key);
  const missingTags = requiredTags.filter(tag => !existingTags.includes(tag));
  
  if (missingTags.length > 0) {
    recommendations.push({
      type: 'governance',
      priority: 'low',
      title: 'Add missing resource tags',
      description: `Consider adding these tags for better resource management: ${missingTags.join(', ')}`
    });
  }
  
  // Add more recommendations based on the deployment info
  recommendations.push({
    type: 'monitoring',
    priority: 'high',
    title: 'Enable detailed monitoring',
    description: 'Ensure all critical resources have detailed monitoring and alerting configured.'
  });
  
  return recommendations;
}

async function saveReport(report, environment, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFilename = `deployment-report-${environment}-${timestamp}`;
  
  // Save JSON format
  const jsonFile = path.join(__dirname, `../${baseFilename}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
  console.log(`📄 JSON report saved: ${jsonFile}`);
  
  // Save HTML format if requested
  if (format === 'html' || format === 'both') {
    const htmlFile = path.join(__dirname, `../${baseFilename}.html`);
    const htmlContent = generateHtmlReport(report);
    fs.writeFileSync(htmlFile, htmlContent);
    console.log(`📄 HTML report saved: ${htmlFile}`);
  }
  
  // Update deployment history
  updateDeploymentHistory(environment, report);
}

function generateHtmlReport(report) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deployment Report - ${report.metadata.environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #007acc; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #f8f9fa; border-radius: 4px; min-width: 150px; text-align: center; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007acc; }
        .metric .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .recommendation { padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; background: #fff3cd; }
        .recommendation.high { border-left-color: #dc3545; background: #f8d7da; }
        .recommendation.medium { border-left-color: #fd7e14; background: #ffeaa7; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .table th { background-color: #f8f9fa; font-weight: bold; }
        .status-healthy { color: #28a745; font-weight: bold; }
        .status-unhealthy { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Deployment Report</h1>
            <p><strong>Environment:</strong> ${report.metadata.environment}</p>
            <p><strong>Generated:</strong> ${report.metadata.reportGeneratedAt}</p>
            <p><strong>Generated By:</strong> ${report.metadata.generatedBy}</p>
        </div>
        
        <div class="section">
            <h2>Deployment Overview</h2>
            <div class="metric">
                <div class="value">${report.deployment.stackStatus}</div>
                <div class="label">Stack Status</div>
            </div>
            <div class="metric">
                <div class="value">${report.infrastructure.totalResources}</div>
                <div class="label">Total Resources</div>
            </div>
            <div class="metric">
                <div class="value">${report.costs.totalCost} ${report.costs.currency}</div>
                <div class="label">Monthly Cost</div>
            </div>
        </div>
        
        <div class="section">
            <h2>Infrastructure Resources</h2>
            <table class="table">
                <thead>
                    <tr>
                        <th>Resource Type</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.infrastructure.resourcesByType.map(resource => `
                        <tr>
                            <td>${resource.type}</td>
                            <td>${resource.count}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                    <small><strong>Priority:</strong> ${rec.priority.toUpperCase()} | <strong>Type:</strong> ${rec.type}</small>
                </div>
            `).join('')}
        </div>
        
        <div class="section">
            <h2>Git Information</h2>
            <table class="table">
                <tr><td><strong>Commit:</strong></td><td>${report.deployment.git.commit || 'N/A'}</td></tr>
                <tr><td><strong>Branch:</strong></td><td>${report.deployment.git.branch || 'N/A'}</td></tr>
                <tr><td><strong>Author:</strong></td><td>${report.deployment.git.commitAuthor || 'N/A'}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${report.deployment.git.commitDate || 'N/A'}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
  `.trim();
}

// Helper functions
async function getLambdaFunctionDetails(functions) {
  const details = [];
  for (const func of functions) {
    try {
      const config = JSON.parse(execSync(
        `aws lambda get-function-configuration --function-name ${func.physicalId} --output json`,
        { encoding: 'utf8', stdio: 'pipe' }
      ));
      details.push({
        name: func.physicalId,
        runtime: config.Runtime,
        memorySize: config.MemorySize,
        timeout: config.Timeout,
        lastModified: config.LastModified
      });
    } catch (error) {
      details.push({
        name: func.physicalId,
        error: 'Could not retrieve details'
      });
    }
  }
  return details;
}

async function getDynamoTableDetails(tables) {
  const details = [];
  for (const table of tables) {
    try {
      const tableInfo = JSON.parse(execSync(
        `aws dynamodb describe-table --table-name ${table.physicalId} --output json`,
        { encoding: 'utf8', stdio: 'pipe' }
      ));
      details.push({
        name: table.physicalId,
        status: tableInfo.Table.TableStatus,
        itemCount: tableInfo.Table.ItemCount,
        billingMode: tableInfo.Table.BillingModeSummary?.BillingMode || 'PROVISIONED'
      });
    } catch (error) {
      details.push({
        name: table.physicalId,
        error: 'Could not retrieve details'
      });
    }
  }
  return details;
}

async function getS3BucketDetails(buckets) {
  const details = [];
  for (const bucket of buckets) {
    try {
      const bucketInfo = execSync(
        `aws s3api head-bucket --bucket ${bucket.physicalId}`,
        { encoding: 'utf8', stdio: 'pipe' }
      );
      details.push({
        name: bucket.physicalId,
        status: 'accessible'
      });
    } catch (error) {
      details.push({
        name: bucket.physicalId,
        status: 'inaccessible'
      });
    }
  }
  return details;
}

async function getLambdaMetrics(functionName) {
  try {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const metrics = JSON.parse(execSync(
      `aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Duration --dimensions Name=FunctionName,Value=${functionName} --start-time ${startTime} --end-time ${endTime} --period 3600 --statistics Average,Maximum --output json`,
      { encoding: 'utf8', stdio: 'pipe' }
    ));
    
    return {
      averageDuration: metrics.Datapoints.length > 0 ? Math.round(metrics.Datapoints.reduce((sum, dp) => sum + dp.Average, 0) / metrics.Datapoints.length) : 0,
      maxDuration: metrics.Datapoints.length > 0 ? Math.max(...metrics.Datapoints.map(dp => dp.Maximum)) : 0,
      dataPoints: metrics.Datapoints.length
    };
  } catch (error) {
    return {
      error: 'Could not retrieve metrics'
    };
  }
}

function getDeploymentHistory(environment) {
  const historyFile = path.join(__dirname, `../deployment-history-${environment}.json`);
  
  if (!fs.existsSync(historyFile)) {
    return [];
  }
  
  try {
    const historyData = fs.readFileSync(historyFile, 'utf8');
    return JSON.parse(historyData).deployments || [];
  } catch (error) {
    console.warn('⚠️  Failed to read deployment history');
    return [];
  }
}

function updateDeploymentHistory(environment, report) {
  const historyFile = path.join(__dirname, `../deployment-history-${environment}.json`);
  let history = { deployments: [] };
  
  if (fs.existsSync(historyFile)) {
    try {
      history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Failed to read deployment history, creating new one');
    }
  }
  
  // Add current deployment to history
  const deploymentRecord = {
    timestamp: report.metadata.reportGeneratedAt,
    environment: report.metadata.environment,
    stackStatus: report.deployment.stackStatus,
    commit: report.deployment.git.commit,
    branch: report.deployment.git.branch,
    version: report.application.backend.version,
    totalResources: report.infrastructure.totalResources,
    monthlyCost: report.costs.totalCost,
    recommendations: report.recommendations.length
  };
  
  history.deployments.unshift(deploymentRecord);
  
  // Keep only last 50 deployments
  history.deployments = history.deployments.slice(0, 50);
  
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
}

// Run report generation
generateDeploymentReport();