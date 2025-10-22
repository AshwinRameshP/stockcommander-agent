#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating deployment configuration...');

const validationResults = {
    passed: [],
    failed: [],
    warnings: []
};

function validateFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        validationResults.passed.push(`✅ ${description}: ${filePath}`);
        return true;
    } else {
        validationResults.failed.push(`❌ ${description}: ${filePath} not found`);
        return false;
    }
}

function validateJsonFile(filePath, description) {
    if (!validateFile(filePath, description)) {
        return false;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        JSON.parse(content);
        validationResults.passed.push(`✅ ${description}: Valid JSON format`);
        return true;
    } catch (error) {
        validationResults.failed.push(`❌ ${description}: Invalid JSON format - ${error.message}`);
        return false;
    }
}

function validateNpmScript(scriptName, description) {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (packageJson.scripts && packageJson.scripts[scriptName]) {
            validationResults.passed.push(`✅ ${description}: npm script '${scriptName}' exists`);
            return true;
        } else {
            validationResults.failed.push(`❌ ${description}: npm script '${scriptName}' not found`);
            return false;
        }
    } catch (error) {
        validationResults.failed.push(`❌ ${description}: Error reading package.json - ${error.message}`);
        return false;
    }
}

function validateAwsCredentials() {
    try {
        execSync('aws sts get-caller-identity', { stdio: 'pipe' });
        validationResults.passed.push('✅ AWS credentials are configured');
        return true;
    } catch (error) {
        validationResults.warnings.push('⚠️  AWS credentials not configured (required for deployment)');
        return false;
    }
}

function validateNodeVersion() {
    try {
        const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
        const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);

        if (majorVersion >= 18) {
            validationResults.passed.push(`✅ Node.js version: ${nodeVersion} (>= 18)`);
            return true;
        } else {
            validationResults.failed.push(`❌ Node.js version: ${nodeVersion} (requires >= 18)`);
            return false;
        }
    } catch (error) {
        validationResults.failed.push('❌ Node.js not found');
        return false;
    }
}

function validateCdkInstallation() {
    try {
        const cdkVersion = execSync('cdk --version', { encoding: 'utf8' }).trim();
        validationResults.passed.push(`✅ AWS CDK installed: ${cdkVersion}`);
        return true;
    } catch (error) {
        validationResults.failed.push('❌ AWS CDK not installed');
        return false;
    }
}

function validateEnvironmentConfigs() {
    const environments = ['dev', 'staging', 'production'];
    let allValid = true;

    environments.forEach(env => {
        const configPath = `config/environments/${env}.json`;
        if (!validateJsonFile(configPath, `${env.toUpperCase()} environment config`)) {
            allValid = false;
        }
    });

    return allValid;
}

function validateGitHubWorkflows() {
    const workflows = [
        '.github/workflows/ci-cd-pipeline.yml',
        '.github/workflows/security-scan.yml',
        '.github/workflows/dependency-update.yml'
    ];

    let allValid = true;

    workflows.forEach(workflow => {
        if (!validateFile(workflow, 'GitHub workflow')) {
            allValid = false;
        }
    });

    return allValid;
}

function validateDeploymentScripts() {
    const scripts = [
        'scripts/deploy.sh',
        'scripts/generate-deployment-report.js',
        'scripts/monitor-deployment.js',
        'scripts/rollback-frontend.js',
        'scripts/rollback-infrastructure.js'
    ];

    let allValid = true;

    scripts.forEach(script => {
        if (!validateFile(script, 'Deployment script')) {
            allValid = false;
        } else {
            // Check if script is executable
            try {
                const stats = fs.statSync(script);
                if (stats.mode & parseInt('111', 8)) {
                    validationResults.passed.push(`✅ Script is executable: ${script}`);
                } else {
                    validationResults.warnings.push(`⚠️  Script may not be executable: ${script}`);
                }
            } catch (error) {
                validationResults.warnings.push(`⚠️  Could not check permissions for: ${script}`);
            }
        }
    });

    return allValid;
}

function validateNpmScripts() {
    const requiredScripts = [
        'build',
        'test',
        'test:integration',
        'test:e2e',
        'test:smoke',
        'test:performance',
        'lint',
        'cdk:deploy',
        'cdk:diff',
        'cdk:synth'
    ];

    let allValid = true;

    requiredScripts.forEach(script => {
        if (!validateNpmScript(script, 'Required npm script')) {
            allValid = false;
        }
    });

    return allValid;
}

function validateFrontendConfiguration() {
    const frontendFiles = [
        'frontend/package.json',
        'frontend/src/index.tsx',
        'frontend/src/App.tsx'
    ];

    let allValid = true;

    frontendFiles.forEach(file => {
        if (!validateFile(file, 'Frontend file')) {
            allValid = false;
        }
    });

    // Validate frontend npm scripts
    try {
        const frontendPackageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
        const requiredFrontendScripts = ['build', 'build:staging', 'build:production', 'test'];

        requiredFrontendScripts.forEach(script => {
            if (frontendPackageJson.scripts && frontendPackageJson.scripts[script]) {
                validationResults.passed.push(`✅ Frontend script '${script}' exists`);
            } else {
                validationResults.failed.push(`❌ Frontend script '${script}' not found`);
                allValid = false;
            }
        });
    } catch (error) {
        validationResults.failed.push('❌ Error reading frontend/package.json');
        allValid = false;
    }

    return allValid;
}

function validateSecurityConfiguration() {
    const securityFiles = [
        'src/utils/security-config.ts',
        'src/utils/data-encryption.ts',
        'src/utils/audit-logger.ts'
    ];

    let allValid = true;

    securityFiles.forEach(file => {
        if (!validateFile(file, 'Security configuration')) {
            allValid = false;
        }
    });

    return allValid;
}

function validateMonitoringConfiguration() {
    const monitoringFiles = [
        'src/utils/monitoring-config.ts',
        'src/utils/performance-metrics.ts',
        'src/utils/distributed-tracing.ts'
    ];

    let allValid = true;

    monitoringFiles.forEach(file => {
        if (!validateFile(file, 'Monitoring configuration')) {
            allValid = false;
        }
    });

    return allValid;
}

// Run all validations
async function runValidation() {
    console.log('\n📋 Running deployment validation checks...\n');

    // Core validations
    validateNodeVersion();
    validateCdkInstallation();
    validateAwsCredentials();

    // Configuration validations
    validateFile('package.json', 'Root package.json');
    validateFile('cdk.json', 'CDK configuration');
    validateFile('tsconfig.json', 'TypeScript configuration');
    validateEnvironmentConfigs();

    // Pipeline validations
    validateGitHubWorkflows();
    validateDeploymentScripts();
    validateNpmScripts();

    // Application validations
    validateFrontendConfiguration();
    validateSecurityConfiguration();
    validateMonitoringConfiguration();

    // Additional validations
    validateFile('.github/CODEOWNERS', 'Code owners file');
    validateFile('.github/pull_request_template.md', 'PR template');
    validateFile('deployment.config.js', 'Deployment configuration');

    // Print results
    console.log('\n📊 Validation Results:\n');

    if (validationResults.passed.length > 0) {
        console.log('✅ PASSED CHECKS:');
        validationResults.passed.forEach(result => console.log(`   ${result}`));
        console.log('');
    }

    if (validationResults.warnings.length > 0) {
        console.log('⚠️  WARNINGS:');
        validationResults.warnings.forEach(result => console.log(`   ${result}`));
        console.log('');
    }

    if (validationResults.failed.length > 0) {
        console.log('❌ FAILED CHECKS:');
        validationResults.failed.forEach(result => console.log(`   ${result}`));
        console.log('');
    }

    // Summary
    const totalChecks = validationResults.passed.length + validationResults.failed.length + validationResults.warnings.length;
    const passRate = Math.round((validationResults.passed.length / totalChecks) * 100);

    console.log(`📈 Summary: ${validationResults.passed.length}/${totalChecks} checks passed (${passRate}%)`);

    if (validationResults.failed.length > 0) {
        console.log('\n❌ Deployment validation failed. Please fix the issues above before deploying.');
        process.exit(1);
    } else if (validationResults.warnings.length > 0) {
        console.log('\n⚠️  Deployment validation passed with warnings. Review warnings before deploying.');
        process.exit(0);
    } else {
        console.log('\n🎉 All deployment validation checks passed! Ready to deploy.');
        process.exit(0);
    }
}

// Run the validation
runValidation().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
});