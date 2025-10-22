#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const environment = args.find(arg => arg.startsWith('--env='))?.split('=')[1] || 'production';
const targetVersion = args.find(arg => arg.startsWith('--version='))?.split('=')[1];

console.log(`🔄 Starting frontend rollback for ${environment} environment...`);

async function rollbackFrontend() {
  try {
    // Get S3 bucket name from CloudFormation outputs
    const stackName = `InventoryReplenishmentStack-${environment}`;
    
    console.log(`📋 Getting S3 bucket information for ${stackName}...`);
    
    const bucketName = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query 'Stacks[0].Outputs[?OutputKey==\`FrontendBucketName\`].OutputValue' --output text`,
      { encoding: 'utf8' }
    ).trim();
    
    if (!bucketName) {
      throw new Error('Could not find frontend bucket name from CloudFormation outputs');
    }
    
    console.log(`📦 Frontend bucket: ${bucketName}`);
    
    // Get CloudFront distribution ID
    const distributionId = execSync(
      `aws cloudformation describe-stacks --stack-name ${stackName} --query 'Stacks[0].Outputs[?OutputKey==\`CloudFrontDistributionId\`].OutputValue' --output text`,
      { encoding: 'utf8' }
    ).trim();
    
    if (targetVersion) {
      console.log(`🎯 Rolling back frontend to specific version: ${targetVersion}`);
      
      // Check if the target version backup exists in S3
      const backupKey = `backups/frontend-${targetVersion}.tar.gz`;
      
      try {
        execSync(`aws s3 ls s3://${bucketName}/${backupKey}`, { stdio: 'pipe' });
        console.log(`✅ Found backup for version ${targetVersion}`);
      } catch (error) {
        throw new Error(`Backup for version ${targetVersion} not found in S3`);
      }
      
      // Download and extract the backup
      console.log('📥 Downloading backup...');
      execSync(`aws s3 cp s3://${bucketName}/${backupKey} /tmp/frontend-backup.tar.gz`);
      execSync(`cd /tmp && tar -xzf frontend-backup.tar.gz`);
      
      // Upload the backup to the frontend bucket
      console.log('📤 Restoring frontend from backup...');
      execSync(`aws s3 sync /tmp/frontend-backup/ s3://${bucketName}/ --delete`);
      
    } else {
      console.log('🔙 Rolling back to previous frontend deployment...');
      
      // List available backups
      const backups = execSync(
        `aws s3 ls s3://${bucketName}/backups/ --recursive | grep frontend- | sort -r`,
        { encoding: 'utf8' }
      );
      
      const backupLines = backups.trim().split('\n').filter(line => line.trim());
      
      if (backupLines.length < 2) {
        throw new Error('No previous frontend backup found to rollback to');
      }
      
      // Get the second most recent backup (previous deployment)
      const previousBackupLine = backupLines[1];
      const previousBackupKey = previousBackupLine.split(/\s+/).pop();
      
      console.log(`📦 Rolling back to: ${previousBackupKey}`);
      
      // Download and extract the previous backup
      console.log('📥 Downloading previous backup...');
      execSync(`aws s3 cp s3://${bucketName}/${previousBackupKey} /tmp/frontend-backup.tar.gz`);
      execSync(`cd /tmp && tar -xzf frontend-backup.tar.gz`);
      
      // Upload the backup to the frontend bucket
      console.log('📤 Restoring frontend from backup...');
      execSync(`aws s3 sync /tmp/frontend-backup/ s3://${bucketName}/ --delete`);
    }
    
    // Invalidate CloudFront cache if distribution exists
    if (distributionId && distributionId !== 'None') {
      console.log(`🔄 Invalidating CloudFront cache for distribution ${distributionId}...`);
      const invalidationId = execSync(
        `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "/*" --query 'Invalidation.Id' --output text`,
        { encoding: 'utf8' }
      ).trim();
      
      console.log(`⏳ CloudFront invalidation created: ${invalidationId}`);
      
      // Wait for invalidation to complete (optional)
      console.log('⏳ Waiting for CloudFront invalidation to complete...');
      execSync(`aws cloudfront wait invalidation-completed --distribution-id ${distributionId} --id ${invalidationId}`, {
        stdio: 'inherit'
      });
    }
    
    // Verify rollback
    console.log('✅ Verifying frontend rollback...');
    
    // Simple health check - try to fetch the index.html
    const websiteUrl = distributionId && distributionId !== 'None' 
      ? `https://${distributionId}.cloudfront.net`
      : `http://${bucketName}.s3-website-us-east-1.amazonaws.com`;
    
    try {
      execSync(`curl -f -s ${websiteUrl} > /dev/null`, { stdio: 'pipe' });
      console.log('✅ Frontend health check passed');
    } catch (error) {
      console.warn('⚠️  Frontend health check failed, but rollback may still be successful');
    }
    
    console.log('🎉 Frontend rollback completed successfully!');
    
    // Log rollback event
    logFrontendRollbackEvent(environment, targetVersion);
    
    // Clean up temporary files
    execSync('rm -rf /tmp/frontend-backup*', { stdio: 'pipe' });
    
  } catch (error) {
    console.error('❌ Frontend rollback failed:', error.message);
    
    // Clean up temporary files on error
    execSync('rm -rf /tmp/frontend-backup*', { stdio: 'pipe' });
    
    process.exit(1);
  }
}

function logFrontendRollbackEvent(environment, targetVersion) {
  const rollbackEvent = {
    timestamp: new Date().toISOString(),
    environment,
    component: 'frontend',
    targetVersion: targetVersion || 'previous',
    rollbackBy: process.env.USER || process.env.USERNAME || 'unknown',
    reason: 'Manual frontend rollback'
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
  console.log(`📝 Frontend rollback event logged to ${rollbackLogFile}`);
}

// Run rollback
rollbackFrontend();