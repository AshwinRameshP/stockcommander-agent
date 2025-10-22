import * as fs from 'fs';
import * as path from 'path';

export interface EnvironmentConfig {
  environment: string;
  region: string;
  stackName: string;
  domainName: string;
  certificateArn?: string;
  hostedZoneId?: string;
  enableCloudFront: boolean;
  enableWAF: boolean;
  enableXRay: boolean;
  logLevel: string;
  retentionDays: number;
  monitoring: {
    enableDetailedMetrics: boolean;
    alarmNotificationEmail: string;
    enableDashboard: boolean;
  };
  database: {
    billingMode: string;
    readCapacity?: number;
    writeCapacity?: number;
    pointInTimeRecovery: boolean;
    backupRetention: number;
  };
  lambda: {
    timeout: number;
    memorySize: number;
    reservedConcurrency: number;
  };
  s3: {
    versioning: boolean;
    mfaDelete?: boolean;
    lifecycleRules: {
      transitionToIA: number;
      transitionToGlacier: number;
      transitionToDeepArchive?: number;
      expiration: number;
    };
  };
  apiGateway: {
    throttling: {
      rateLimit: number;
      burstLimit: number;
    };
    caching: boolean;
    cacheTtl?: number;
  };
  bedrock: {
    modelId: string;
    maxTokens: number;
    temperature: number;
  };
  sagemaker: {
    instanceType: string;
    enableAutoScaling: boolean;
    minCapacity?: number;
    maxCapacity?: number;
  };
  security?: {
    enableEncryption: boolean;
    kmsKeyRotation: boolean;
    enableCloudTrail: boolean;
    enableGuardDuty: boolean;
    enableSecurityHub: boolean;
  };
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private configCache: Map<string, EnvironmentConfig> = new Map();

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public loadConfig(environment: string): EnvironmentConfig {
    // Check cache first
    if (this.configCache.has(environment)) {
      return this.configCache.get(environment)!;
    }

    // Validate environment
    const validEnvironments = ['dev', 'staging', 'production'];
    if (!validEnvironments.includes(environment)) {
      throw new Error(`Invalid environment: ${environment}. Must be one of: ${validEnvironments.join(', ')}`);
    }

    // Load configuration file
    const configPath = path.join(__dirname, '../../config/environments', `${environment}.json`);
    
    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found: ${configPath}`);
    }

    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      const config: EnvironmentConfig = JSON.parse(configData);
      
      // Validate required fields
      this.validateConfig(config);
      
      // Apply environment variable overrides
      const finalConfig = this.applyEnvironmentOverrides(config);
      
      // Cache the configuration
      this.configCache.set(environment, finalConfig);
      
      return finalConfig;
    } catch (error) {
      throw new Error(`Failed to load configuration for environment ${environment}: ${error}`);
    }
  }

  private validateConfig(config: EnvironmentConfig): void {
    const requiredFields = [
      'environment',
      'region',
      'stackName',
      'domainName',
      'logLevel',
      'retentionDays'
    ];

    for (const field of requiredFields) {
      if (!(field in config) || config[field as keyof EnvironmentConfig] === undefined) {
        throw new Error(`Missing required configuration field: ${field}`);
      }
    }

    // Validate log level
    const validLogLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    if (!validLogLevels.includes(config.logLevel)) {
      throw new Error(`Invalid log level: ${config.logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
    }

    // Validate billing mode
    const validBillingModes = ['PAY_PER_REQUEST', 'PROVISIONED'];
    if (!validBillingModes.includes(config.database.billingMode)) {
      throw new Error(`Invalid billing mode: ${config.database.billingMode}. Must be one of: ${validBillingModes.join(', ')}`);
    }

    // Validate provisioned capacity if billing mode is PROVISIONED
    if (config.database.billingMode === 'PROVISIONED') {
      if (!config.database.readCapacity || !config.database.writeCapacity) {
        throw new Error('Read and write capacity must be specified for PROVISIONED billing mode');
      }
    }
  }

  private applyEnvironmentOverrides(config: EnvironmentConfig): EnvironmentConfig {
    const overriddenConfig = { ...config };

    // Apply environment variable overrides
    const envOverrides = {
      AWS_REGION: 'region',
      DOMAIN_NAME: 'domainName',
      CERTIFICATE_ARN: 'certificateArn',
      HOSTED_ZONE_ID: 'hostedZoneId',
      LOG_LEVEL: 'logLevel',
      BEDROCK_MODEL_ID: 'bedrock.modelId',
      ALARM_EMAIL: 'monitoring.alarmNotificationEmail'
    };

    for (const [envVar, configPath] of Object.entries(envOverrides)) {
      const envValue = process.env[envVar];
      if (envValue) {
        this.setNestedProperty(overriddenConfig, configPath, envValue);
      }
    }

    // Apply boolean overrides
    const booleanOverrides = {
      ENABLE_CLOUDFRONT: 'enableCloudFront',
      ENABLE_WAF: 'enableWAF',
      ENABLE_XRAY: 'enableXRay',
      ENABLE_DETAILED_METRICS: 'monitoring.enableDetailedMetrics',
      ENABLE_DASHBOARD: 'monitoring.enableDashboard',
      POINT_IN_TIME_RECOVERY: 'database.pointInTimeRecovery',
      S3_VERSIONING: 's3.versioning',
      API_CACHING: 'apiGateway.caching',
      SAGEMAKER_AUTO_SCALING: 'sagemaker.enableAutoScaling'
    };

    for (const [envVar, configPath] of Object.entries(booleanOverrides)) {
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        this.setNestedProperty(overriddenConfig, configPath, envValue.toLowerCase() === 'true');
      }
    }

    // Apply numeric overrides
    const numericOverrides = {
      RETENTION_DAYS: 'retentionDays',
      LAMBDA_TIMEOUT: 'lambda.timeout',
      LAMBDA_MEMORY_SIZE: 'lambda.memorySize',
      LAMBDA_RESERVED_CONCURRENCY: 'lambda.reservedConcurrency',
      API_RATE_LIMIT: 'apiGateway.throttling.rateLimit',
      API_BURST_LIMIT: 'apiGateway.throttling.burstLimit',
      BEDROCK_MAX_TOKENS: 'bedrock.maxTokens',
      BEDROCK_TEMPERATURE: 'bedrock.temperature'
    };

    for (const [envVar, configPath] of Object.entries(numericOverrides)) {
      const envValue = process.env[envVar];
      if (envValue !== undefined) {
        const numValue = configPath.includes('temperature') ? parseFloat(envValue) : parseInt(envValue, 10);
        if (!isNaN(numValue)) {
          this.setNestedProperty(overriddenConfig, configPath, numValue);
        }
      }
    }

    return overriddenConfig;
  }

  private setNestedProperty(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  public getEnvironmentFromContext(): string {
    // Try to get environment from CDK context
    const environment = process.env.CDK_CONTEXT_ENVIRONMENT || 
                       process.env.ENVIRONMENT || 
                       process.env.NODE_ENV || 
                       'dev';
    
    return environment;
  }

  public clearCache(): void {
    this.configCache.clear();
  }
}

// Export singleton instance
export const configLoader = ConfigLoader.getInstance();