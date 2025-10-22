#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
const targetVersion = args.find(arg => arg.startsWith('--version='))?.split('=')[1];

console.log(`🔄 Starting infrastructure rollback for ${environment} environment...`);

async function rollbackInfrastructure() {
  try {
    // Get current stack information
    const stackName = `InventoryReplenishmentStack-${environment}`;
    
    console.log(`📋 Getting stack information for ${stackName}...`);
    
    // Get stack events to find the last successful deployment
    const stackEvents = execSync(
      `aws cloudformation describe-stack-events --stack-name ${stackName} --query "StackEvents[?ResourceStatus=='UPDATE_COMPLETE' || ResourceStatus=='CREATE_COMPLETE'].{Timestamp:Timestamp,LogicalResourceId:LogicalResourceId}" --output json`,
      { encoding: 'utf8' }
    );
    
    const events = JSON.parse(stackEvents);
    console.log(`📊 Found ${events.length} successful deployment events`);
    
    if (targetVersion) {
      console.log(`🎯 Rolling back to specific version: ${targetVersion}`);
      
      // Check if the target version exists in deployment history
      const deploymentHistory = getDeploymentHistory(environment);
      const targetDeployment = deploymentHistory.find(d => d.version === targetVersion);
      
      if (!targetDeployment) {
        throw new Error(`Target version ${targetVersion} not found in deployment history`);
      }
      
      // Checkout the specific commit
      execSync(`git checkout ${targetDeployment.commit}`, { stdio: 'inherit' });
      
      // Deploy the previous version
      execSync(`npm run cdk:deploy -- --context environment=${environment} --require-approval never`, {
        stdio: 'inherit'
      });
      
    } else {
      console.log('🔙 Rolling back to previous deployment...');
      
      // Get the previous deployment from history
      const deploymentHistory = getDeploymentHistory(environment);
      
      if (deploymentHistory.length < 2) {
        throw new Error('No previous deployment found to rollback to');
      }
      
      const previousDeployment = deploymentHistory[1]; // Second most recent
      console.log(`📦 Rolling back to version ${previousDeployment.version} (${previousDeployment.commit})`);
      
      // Checkout the previous commit
      execSync(`git checkout ${previousDeployment.commit}`, { stdio: 'inherit' });
      
      // Deploy the previous version
      execSync(`npm run cdk:deploy -- --context environment=${environment} --require-approval never`, {
        stdio: 'inherit'
      });
    }
    
    // Verify rollback
    console.log('✅ Verifying rollback...');
    const healthCheck = execSync(`npm run test:smoke -- --env=${environment}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('🎉 Infrastructure rollback completed successfully!');
    
    // Log rollback event
    logRollbackEvent(environment, targetVersion);
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

function getDeploymentHistory(environment) {
  const historyFile = path.join(__dirname, `../deployment-history-${environment}.json`);
  
  if (!fs.existsSync(historyFile)) {
    console.warn('⚠️  No deployment history found');
    return [];
  }
  
  try {
    const historyData = fs.readFileSync(historyFile, 'utf8');
    return JSON.parse(historyData).deployments || [];
  } catch (error) {
    console.warn('⚠️  Failed to read deployment history:', error.message);
    return [];
  }
}

function logRollbackEvent(environment, targetVersion) {
  const rollbackEvent = {
    timestamp: new Date().toISOString(),
    environment,
    targetVersion: targetVersion || 'previous',
    rollbackBy: process.env.USER || process.env.USERNAME || 'unknown',
    reason: 'Manual rollback'
  };
  
  const rollbackLogFile = path.join(__dirname, `../rollback-log-${environment}.json`);
  let rollbackLog = { rollbacks: [] };
  
  if (fs.existsSync(rollbackLogFile)) {
    try {
      rollbackLog = JSON.parse(fs.readFileSync(rollbackLogFile, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Failed to read rollback log, creating new one');
    }
  }
  
  rollbackLog.rollbacks.unshift(rollbackEvent);
  
  // Keep only last 50 rollback events
  rollbackLog.rollbacks = rollbackLog.rollbacks.slice(0, 50);
  
  fs.writeFileSync(rollbackLogFile, JSON.stringify(rollbackLog, null, 2));
  console.log(`📝 Rollback event logged to ${rollbackLogFile}`);
}

// Run rollback
rollbackInfrastructure();