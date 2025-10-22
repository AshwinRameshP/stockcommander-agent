/**
 * Deployment Configuration
 * Centralized configuration for deployment pipeline
 */

const deploymentConfig = {
  // Global deployment settings
  global: {
    projectName: 'intelligent-inventory-replenishment',
    region: 'us-east-1',
    nodeVersion: '18',
    cdkVersion: '2.100.0',
    
    // Deployment timeouts (in seconds)
    timeouts: {
      deployment: 1800,      // 30 minutes
      healthCheck: 300,      // 5 minutes
      rollback: 600,         // 10 minutes
    },
    
    // Notification settings
    notifications: {
      slack: {
        enabled: true,
        channels: {
          deployments: '#deployments',
          production: '#production-deployments',
          alerts: '#alerts'
        }
      },
      email: {
        enabled: true,
        recipients: {
          dev: ['dev-team@example.com'],
          staging: ['staging-team@example.com'],
          production: ['prod-team@example.com', 'management@example.com']
        }
      }
    }
  },

  // Environment-specific configurations
  environments: {
    dev: {
      name: 'development',
      branch: 'develop',
      autoDeployment: true,
      requiresApproval: false,
      
      // Testing configuration
      testing: {
        runUnitTests: true,
        runIntegrationTests: true,
        runE2ETests: false,
        runPerformanceTests: false,
        runSecurityTests: true,
        coverageThreshold: 70
      },
      
      // Deployment strategy
      deployment: {
        strategy: 'rolling',
        rollbackOnFailure: true,
        healthCheckRetries: 3,
        healthCheckInterval: 30
      },
      
      // Resource configuration
      resources: {
        lambda: {
          timeout: 30,
          memorySize: 512,
          reservedConcurrency: 10
        },
        dynamodb: {
          billingMode: 'PAY_PER_REQUEST',
          pointInTimeRecovery: false
        },
        s3: {
          versioning: false,
          encryption: false
        }
      }
    },

    staging: {
      name: 'staging',
      branch: 'main',
      autoDeployment: true,
      requiresApproval: false,
      
      // Testing configuration
      testing: {
        runUnitTests: true,
        runIntegrationTests: true,
        runE2ETests: true,
        runPerformanceTests: true,
        runSecurityTests: true,
        coverageThreshold: 80
      },
      
      // Deployment strategy
      deployment: {
        strategy: 'blue-green',
        rollbackOnFailure: true,
        healthCheckRetries: 5,
        healthCheckInterval: 30,
        warmupPeriod: 120
      },
      
      // Resource configuration
      resources: {
        lambda: {
          timeout: 60,
          memorySize: 1024,
          reservedConcurrency: 50
        },
        dynamodb: {
          billingMode: 'PAY_PER_REQUEST',
          pointInTimeRecovery: true
        },
        s3: {
          versioning: true,
          encryption: true
        }
      }
    },

    production: {
      name: 'production',
      branch: 'main',
      autoDeployment: false,
      requiresApproval: true,
      
      // Testing configuration
      testing: {
        runUnitTests: true,
        runIntegrationTests: true,
        runE2ETests: true,
        runPerformanceTests: true,
        runSecurityTests: true,
        runLoadTests: true,
        coverageThreshold: 90
      },
      
      // Deployment strategy
      deployment: {
        strategy: 'blue-green',
        rollbackOnFailure: true,
        healthCheckRetries: 10,
        healthCheckInterval: 30,
        warmupPeriod: 300,
        canaryDeployment: {
          enabled: true,
          percentage: 10,
          duration: 600
        }
      },
      
      // Resource configuration
      resources: {
        lambda: {
          timeout: 300,
          memorySize: 2048,
          reservedConcurrency: 100
        },
        dynamodb: {
          billingMode: 'PROVISIONED',
          pointInTimeRecovery: true,
          backupRetention: 90
        },
        s3: {
          versioning: true,
          encryption: true,
          mfaDelete: true
        }
      },
      
      // Production-specific settings
      monitoring: {
        enableDetailedMetrics: true,
        enableXRay: true,
        enableCloudTrail: true,
        enableGuardDuty: true
      },
      
      // Compliance and security
      compliance: {
        enableEncryption: true,
        enableAuditLogging: true,
        enableAccessLogging: true,
        dataRetentionDays: 2555
      }
    }
  },

  // Pipeline stages configuration
  pipeline: {
    stages: [
      {
        name: 'source',
        description: 'Source code checkout',
        required: true
      },
      {
        name: 'build',
        description: 'Build and compile',
        required: true,
        parallel: false
      },
      {
        name: 'test',
        description: 'Run automated tests',
        required: true,
        parallel: true,
        substages: [
          'unit-tests',
          'integration-tests',
          'security-scan',
          'lint-check'
        ]
      },
      {
        name: 'package',
        description: 'Package artifacts',
        required: true,
        parallel: false
      },
      {
        name: 'deploy-dev',
        description: 'Deploy to development',
        required: false,
        condition: 'branch == develop'
      },
      {
        name: 'deploy-staging',
        description: 'Deploy to staging',
        required: false,
        condition: 'branch == main'
      },
      {
        name: 'approval',
        description: 'Manual approval for production',
        required: true,
        condition: 'environment == production',
        approvers: ['devops-team', 'tech-lead']
      },
      {
        name: 'deploy-production',
        description: 'Deploy to production',
        required: false,
        condition: 'approved && branch == main'
      },
      {
        name: 'post-deployment',
        description: 'Post-deployment verification',
        required: true,
        substages: [
          'health-check',
          'smoke-tests',
          'monitoring-setup'
        ]
      }
    ]
  },

  // Quality gates
  qualityGates: {
    unitTests: {
      enabled: true,
      coverageThreshold: 80,
      failOnError: true
    },
    integrationTests: {
      enabled: true,
      failOnError: true
    },
    securityScan: {
      enabled: true,
      severityThreshold: 'high',
      failOnError: true
    },
    performanceTests: {
      enabled: true,
      responseTimeThreshold: 2000,
      failOnError: false
    },
    codeQuality: {
      enabled: true,
      sonarQualityGate: true,
      failOnError: true
    }
  },

  // Rollback configuration
  rollback: {
    enabled: true,
    automatic: {
      enabled: true,
      triggers: [
        'health-check-failure',
        'high-error-rate',
        'performance-degradation'
      ],
      thresholds: {
        errorRate: 5,        // 5% error rate
        responseTime: 5000,  // 5 seconds
        availability: 95     // 95% availability
      }
    },
    manual: {
      enabled: true,
      requiresApproval: true,
      retainBackups: 5
    }
  },

  // Monitoring and alerting
  monitoring: {
    healthChecks: {
      enabled: true,
      endpoints: [
        '/health',
        '/api/health',
        '/api/status'
      ],
      interval: 30,
      timeout: 10,
      retries: 3
    },
    
    metrics: {
      enabled: true,
      customMetrics: [
        'deployment-duration',
        'deployment-success-rate',
        'rollback-frequency',
        'test-execution-time'
      ]
    },
    
    alerts: {
      enabled: true,
      channels: ['slack', 'email', 'pagerduty'],
      conditions: [
        'deployment-failure',
        'rollback-triggered',
        'security-vulnerability',
        'performance-degradation'
      ]
    }
  },

  // Feature flags
  featureFlags: {
    enabled: true,
    provider: 'aws-appconfig',
    flags: {
      'canary-deployment': {
        enabled: false,
        environments: ['production']
      },
      'blue-green-deployment': {
        enabled: true,
        environments: ['staging', 'production']
      },
      'automated-rollback': {
        enabled: true,
        environments: ['dev', 'staging', 'production']
      }
    }
  }
};

module.exports = deploymentConfig;