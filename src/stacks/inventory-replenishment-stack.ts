import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';
import { SecurityConfig } from '../utils/security-config';
import { MonitoringConfig } from '../utils/monitoring-config';

export class InventoryReplenishmentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Initialize security configuration
    const securityConfig = new SecurityConfig(this, {
      stackName: id,
      environment: this.node.tryGetContext('environment') || 'dev',
    });

    // S3 Buckets for invoice storage and processed data with KMS encryption
    const invoiceBucket = new s3.Bucket(this, 'InvoiceBucket', {
      bucketName: `inventory-invoices-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityConfig.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development
      enforceSSL: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
      notificationsHandlerRole: securityConfig.createSecureLambdaRole(this, 'S3NotificationRole'),
    });

    const processedDataBucket = new s3.Bucket(this, 'ProcessedDataBucket', {
      bucketName: `inventory-processed-data-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityConfig.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for ML training data and model artifacts
    const mlDataBucket = new s3.Bucket(this, 'MLDataBucket', {
      bucketName: `inventory-ml-data-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: securityConfig.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [{
        id: 'DeleteOldTrainingData',
        prefix: 'training-data/',
        expiration: cdk.Duration.days(90),
      }]
    });

    // DynamoDB Tables with customer-managed KMS encryption
    const sparePartsTable = new dynamodb.Table(this, 'SparePartsTable', {
      tableName: 'SpareParts',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: securityConfig.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    const demandForecastTable = new dynamodb.Table(this, 'DemandForecastTable', {
      tableName: 'DemandForecasts',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'forecastDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    const recommendationsTable = new dynamodb.Table(this, 'RecommendationsTable', {
      tableName: 'ReplenishmentRecommendations',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'recommendationId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const supplierMetricsTable = new dynamodb.Table(this, 'SupplierMetricsTable', {
      tableName: 'SupplierMetrics',
      partitionKey: { name: 'supplierId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB table for file validation records
    const fileValidationTable = new dynamodb.Table(this, 'FileValidationTable', {
      tableName: 'FileValidationRecords',
      partitionKey: { name: 'uploadId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for parsed invoices
    const parsedInvoicesTable = new dynamodb.Table(this, 'ParsedInvoicesTable', {
      tableName: 'ParsedInvoices',
      partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for invoice line items with stream enabled
    const invoiceLineItemsTable = new dynamodb.Table(this, 'InvoiceLineItemsTable', {
      tableName: 'InvoiceLineItems',
      partitionKey: { name: 'invoiceId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'lineItemIndex', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE, // Enable stream for data normalization
    });

    // Add GSI for querying by part number
    invoiceLineItemsTable.addGlobalSecondaryIndex({
      indexName: 'PartNumberIndex',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'parsedAt', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for normalized invoice data
    const normalizedInvoiceDataTable = new dynamodb.Table(this, 'NormalizedInvoiceDataTable', {
      tableName: 'NormalizedInvoiceData',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by invoice type and date
    normalizedInvoiceDataTable.addGlobalSecondaryIndex({
      indexName: 'InvoiceTypeIndex',
      partitionKey: { name: 'invoiceType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
    });

    // Add GSI for querying by supplier
    normalizedInvoiceDataTable.addGlobalSecondaryIndex({
      indexName: 'SupplierIndex',
      partitionKey: { name: 'supplierId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'invoiceDate', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for data quality metrics
    const dataQualityTable = new dynamodb.Table(this, 'DataQualityTable', {
      tableName: 'DataQualityMetrics',
      partitionKey: { name: 'metricType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for duplicate detection results
    const duplicateDetectionTable = new dynamodb.Table(this, 'DuplicateDetectionTable', {
      tableName: 'DuplicateDetectionResults',
      partitionKey: { name: 'partNumber', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'detectionTimestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // DynamoDB table for notification preferences
    const notificationPreferencesTable = new dynamodb.Table(this, 'NotificationPreferencesTable', {
      tableName: 'NotificationPreferences',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add GSI for querying by notification type
    notificationPreferencesTable.addGlobalSecondaryIndex({
      indexName: 'NotificationTypeIndex',
      partitionKey: { name: 'notificationType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
    });

    // DynamoDB table for notification history
    const notificationHistoryTable = new dynamodb.Table(this, 'NotificationHistoryTable', {
      tableName: 'NotificationHistory',
      partitionKey: { name: 'notificationId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      timeToLiveAttribute: 'ttl',
    });

    // Add GSI for querying by user and status
    notificationHistoryTable.addGlobalSecondaryIndex({
      indexName: 'UserStatusIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    });

    // SNS Topics for different notification types
    const alertsTopic = new sns.Topic(this, 'AlertsTopic', {
      topicName: 'inventory-alerts',
      displayName: 'Inventory Replenishment Alerts',
    });

    const stockoutAlertsTopic = new sns.Topic(this, 'StockoutAlertsTopic', {
      topicName: 'inventory-stockout-alerts',
      displayName: 'Inventory Stockout Alerts',
    });

    const costOptimizationTopic = new sns.Topic(this, 'CostOptimizationTopic', {
      topicName: 'inventory-cost-optimization',
      displayName: 'Cost Optimization Opportunities',
    });

    const predictiveAlertsTopic = new sns.Topic(this, 'PredictiveAlertsTopic', {
      topicName: 'inventory-predictive-alerts',
      displayName: 'Predictive Inventory Alerts',
    });

    const systemAlertsTopic = new sns.Topic(this, 'SystemAlertsTopic', {
      topicName: 'inventory-system-alerts',
      displayName: 'System Health Alerts',
    });

    // Initialize monitoring configuration after SNS topics are created
    const monitoringConfig = new MonitoringConfig(this, {
      stackName: id,
      environment: this.node.tryGetContext('environment') || 'dev',
      alertingTopic: systemAlertsTopic,
    });

    // IAM Role for SageMaker execution
    const sagemakerExecutionRole = new iam.Role(this, 'SageMakerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                mlDataBucket.bucketArn,
                mlDataBucket.bucketArn + '/*',
              ],
            }),
          ],
        }),
      },
    });

    // IAM Role for Lambda functions with Bedrock access
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
                'bedrock:ListFoundationModels',
                'bedrock:GetFoundationModel',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [
                invoiceBucket.bucketArn + '/*',
                processedDataBucket.bucketArn + '/*',
                mlDataBucket.bucketArn + '/*',
                invoiceBucket.bucketArn,
                processedDataBucket.bucketArn,
                mlDataBucket.bucketArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              resources: [
                sparePartsTable.tableArn,
                demandForecastTable.tableArn,
                recommendationsTable.tableArn,
                supplierMetricsTable.tableArn,
                fileValidationTable.tableArn,
                parsedInvoicesTable.tableArn,
                invoiceLineItemsTable.tableArn,
                normalizedInvoiceDataTable.tableArn,
                dataQualityTable.tableArn,
                duplicateDetectionTable.tableArn,
                notificationPreferencesTable.tableArn,
                notificationHistoryTable.tableArn,
                // Include GSI ARNs
                `${normalizedInvoiceDataTable.tableArn}/index/*`,
                `${invoiceLineItemsTable.tableArn}/index/*`,
                `${notificationPreferencesTable.tableArn}/index/*`,
                `${notificationHistoryTable.tableArn}/index/*`,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sns:Publish',
                'sns:Subscribe',
                'sns:Unsubscribe',
                'sns:ListSubscriptionsByTopic',
                'sns:GetTopicAttributes',
              ],
              resources: [
                alertsTopic.topicArn,
                stockoutAlertsTopic.topicArn,
                costOptimizationTopic.topicArn,
                predictiveAlertsTopic.topicArn,
                systemAlertsTopic.topicArn,
              ],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'sagemaker:InvokeEndpoint',
                'sagemaker:DescribeEndpoint',
                'sagemaker:CreateTrainingJob',
                'sagemaker:DescribeTrainingJob',
                'sagemaker:CreateModel',
                'sagemaker:CreateEndpointConfig',
                'sagemaker:CreateEndpoint',
                'sagemaker:DescribeModel',
                'sagemaker:DescribeEndpointConfig',
                'sagemaker:ListEndpoints',
                'sagemaker:ListModels',
                'sagemaker:ListTrainingJobs',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'iam:PassRole',
              ],
              resources: [sagemakerExecutionRole.roleArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'events:PutEvents',
                'events:DescribeRule',
                'events:ListTargetsByRule',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Lambda Functions
    const invoiceUploadFunction = new lambda.Function(this, 'InvoiceUploadFunction', {
      functionName: 'invoice-upload-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'invoice-upload-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      environment: {
        INVOICE_BUCKET: invoiceBucket.bucketName,
        AUDIT_LOG_GROUP: securityConfig.auditLogGroup.logGroupName,
        KMS_KEY_ID: securityConfig.kmsKey.keyId,
      },
    });

    // Add monitoring for invoice upload function
    monitoringConfig.addLambdaMonitoring(this, 'InvoiceUpload', invoiceUploadFunction);

    const invoiceValidationFunction = new lambda.Function(this, 'InvoiceValidationFunction', {
      functionName: 'invoice-validation-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'invoice-validation-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        INVOICE_BUCKET: invoiceBucket.bucketName,
        PROCESSED_DATA_BUCKET: processedDataBucket.bucketName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
      },
    });

    const invoiceParserFunction = new lambda.Function(this, 'InvoiceParserFunction', {
      functionName: 'invoice-parser-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'invoice-parser-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      environment: {
        INVOICE_BUCKET: invoiceBucket.bucketName,
        PROCESSED_DATA_BUCKET: processedDataBucket.bucketName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
    });

    const dataNormalizationFunction = new lambda.Function(this, 'DataNormalizationFunction', {
      functionName: 'data-normalization-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'data-normalization-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        SPARE_PARTS_TABLE: sparePartsTable.tableName,
        NORMALIZED_INVOICE_DATA_TABLE: normalizedInvoiceDataTable.tableName,
        DATA_QUALITY_TABLE: dataQualityTable.tableName,
        DUPLICATE_DETECTION_TABLE: duplicateDetectionTable.tableName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
      },
    });

    const invoiceProcessorFunction = new lambda.Function(this, 'InvoiceProcessorFunction', {
      functionName: 'invoice-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Invoice processor triggered:', JSON.stringify(event, null, 2));
          // Placeholder for invoice processing logic
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Invoice processing initiated' })
          };
        };
      `),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
      environment: {
        INVOICE_BUCKET: invoiceBucket.bucketName,
        PROCESSED_DATA_BUCKET: processedDataBucket.bucketName,
        SPARE_PARTS_TABLE: sparePartsTable.tableName,
        DEMAND_FORECAST_TABLE: demandForecastTable.tableName,
      },
    });

    const aiReasoningFunction = new lambda.Function(this, 'AIReasoningFunction', {
      functionName: 'ai-reasoning-engine',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'ai-reasoning-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      tracing: lambda.Tracing.ACTIVE, // Enable X-Ray tracing
      environment: {
        SPARE_PARTS_TABLE: sparePartsTable.tableName,
        DEMAND_FORECAST_TABLE: demandForecastTable.tableName,
        RECOMMENDATIONS_TABLE: recommendationsTable.tableName,
        SUPPLIER_METRICS_TABLE: supplierMetricsTable.tableName,
        NORMALIZED_INVOICE_DATA_TABLE: normalizedInvoiceDataTable.tableName,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
        AUDIT_LOG_GROUP: securityConfig.auditLogGroup.logGroupName,
        KMS_KEY_ID: securityConfig.kmsKey.keyId,
      },
    });

    // Add monitoring for AI reasoning function
    monitoringConfig.addLambdaMonitoring(this, 'AIReasoning', aiReasoningFunction);

    // Add monitoring for DynamoDB tables
    monitoringConfig.addDynamoDBMonitoring(this, 'SpareParts', sparePartsTable);
    monitoringConfig.addDynamoDBMonitoring(this, 'DemandForecasts', demandForecastTable);
    monitoringConfig.addDynamoDBMonitoring(this, 'Recommendations', recommendationsTable);

    // Add monitoring for S3 buckets
    monitoringConfig.addS3Monitoring(this, 'InvoiceBucket', invoiceBucket);
    monitoringConfig.addS3Monitoring(this, 'ProcessedDataBucket', processedDataBucket);
    monitoringConfig.addS3Monitoring(this, 'MLDataBucket', mlDataBucket);

    const erpConnectorFunction = new lambda.Function(this, 'ERPConnectorFunction', {
      functionName: 'erp-connector',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('ERP connector triggered:', JSON.stringify(event, null, 2));
          // Placeholder for ERP integration logic
          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'ERP integration completed' })
          };
        };
      `),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 512,
    });

    const mlPipelineFunction = new lambda.Function(this, 'MLPipelineFunction', {
      functionName: 'ml-pipeline-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'ml-pipeline-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      environment: {
        SAGEMAKER_EXECUTION_ROLE_ARN: sagemakerExecutionRole.roleArn,
        ML_DATA_BUCKET_NAME: mlDataBucket.bucketName,
        SPARE_PARTS_TABLE: sparePartsTable.tableName,
        DEMAND_FORECAST_TABLE: demandForecastTable.tableName,
        NORMALIZED_INVOICE_DATA_TABLE: normalizedInvoiceDataTable.tableName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
      },
    });

    const notificationHandlerFunction = new lambda.Function(this, 'NotificationHandlerFunction', {
      functionName: 'notification-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'notification-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        NOTIFICATION_PREFERENCES_TABLE: notificationPreferencesTable.tableName,
        NOTIFICATION_HISTORY_TABLE: notificationHistoryTable.tableName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
        STOCKOUT_ALERTS_TOPIC_ARN: stockoutAlertsTopic.topicArn,
        COST_OPTIMIZATION_TOPIC_ARN: costOptimizationTopic.topicArn,
        PREDICTIVE_ALERTS_TOPIC_ARN: predictiveAlertsTopic.topicArn,
        SYSTEM_ALERTS_TOPIC_ARN: systemAlertsTopic.topicArn,
      },
    });

    const alertingLogicFunction = new lambda.Function(this, 'AlertingLogicFunction', {
      functionName: 'alerting-logic-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'alerting-logic-handler.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      role: lambdaExecutionRole,
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        SPARE_PARTS_TABLE: sparePartsTable.tableName,
        DEMAND_FORECAST_TABLE: demandForecastTable.tableName,
        RECOMMENDATIONS_TABLE: recommendationsTable.tableName,
        SUPPLIER_METRICS_TABLE: supplierMetricsTable.tableName,
        NOTIFICATION_PREFERENCES_TABLE: notificationPreferencesTable.tableName,
        NOTIFICATION_HISTORY_TABLE: notificationHistoryTable.tableName,
        ALERTS_TOPIC_ARN: alertsTopic.topicArn,
        STOCKOUT_ALERTS_TOPIC_ARN: stockoutAlertsTopic.topicArn,
        COST_OPTIMIZATION_TOPIC_ARN: costOptimizationTopic.topicArn,
        PREDICTIVE_ALERTS_TOPIC_ARN: predictiveAlertsTopic.topicArn,
        SYSTEM_ALERTS_TOPIC_ARN: systemAlertsTopic.topicArn,
        BEDROCK_MODEL_ID: 'anthropic.claude-3-sonnet-20240229-v1:0',
      },
    });

    // S3 Event Notifications
    // Trigger validation when files are uploaded to invoices/ folder
    invoiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(invoiceValidationFunction),
      { prefix: 'invoices/', suffix: '' }
    );

    // Trigger parsing when files are moved to validated/ folder
    invoiceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(invoiceParserFunction),
      { prefix: 'invoices/validated/' }
    );

    // Trigger data normalization when line items are added
    dataNormalizationFunction.addEventSource(
      new eventsources.DynamoEventSource(invoiceLineItemsTable, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        maxBatchingWindow: cdk.Duration.seconds(5),
        retryAttempts: 3,
      })
    );

    // API Gateway for REST endpoints
    const api = new apigateway.RestApi(this, 'InventoryAPI', {
      restApiName: 'Inventory Replenishment API',
      description: 'API for intelligent inventory replenishment system',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // API Gateway Resources and Methods
    const invoicesResource = api.root.addResource('invoices');
    const uploadResource = invoicesResource.addResource('upload');
    
    // Upload endpoint for getting presigned URLs
    uploadResource.addMethod('POST', new apigateway.LambdaIntegration(invoiceUploadFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Upload status endpoint
    uploadResource.addMethod('GET', new apigateway.LambdaIntegration(invoiceUploadFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // AI Reasoning Engine endpoints
    const aiResource = api.root.addResource('ai');
    
    // Reasoning endpoint for demand analysis, supplier evaluation, etc.
    const reasoningResource = aiResource.addResource('reasoning');
    reasoningResource.addMethod('POST', new apigateway.LambdaIntegration(aiReasoningFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // Plan execution endpoint for AgentCore planning
    const planResource = aiResource.addResource('plan');
    planResource.addMethod('POST', new apigateway.LambdaIntegration(aiReasoningFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // Memory retrieval endpoint
    const memoryResource = aiResource.addResource('memory');
    memoryResource.addMethod('GET', new apigateway.LambdaIntegration(aiReasoningFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Legacy recommendations endpoint (for backward compatibility)
    const recommendationsResource = api.root.addResource('recommendations');
    recommendationsResource.addMethod('GET', new apigateway.LambdaIntegration(aiReasoningFunction));
    recommendationsResource.addMethod('POST', new apigateway.LambdaIntegration(aiReasoningFunction));

    // ML Pipeline endpoints
    const mlResource = api.root.addResource('ml');
    
    // Training endpoints
    const trainingResource = mlResource.addResource('training');
    trainingResource.addResource('start').addMethod('POST', new apigateway.LambdaIntegration(mlPipelineFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    trainingResource.addResource('status').addMethod('GET', new apigateway.LambdaIntegration(mlPipelineFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // Model deployment endpoint
    const modelResource = mlResource.addResource('model');
    modelResource.addResource('deploy').addMethod('POST', new apigateway.LambdaIntegration(mlPipelineFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // Forecasting endpoint
    mlResource.addResource('forecast').addMethod('POST', new apigateway.LambdaIntegration(mlPipelineFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // Endpoints listing
    mlResource.addResource('endpoints').addMethod('GET', new apigateway.LambdaIntegration(mlPipelineFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Notification management endpoints
    const notificationsResource = api.root.addResource('notifications');
    
    // Preferences management
    const preferencesResource = notificationsResource.addResource('preferences');
    preferencesResource.addMethod('GET', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    preferencesResource.addMethod('POST', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    preferencesResource.addMethod('PUT', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Notification history
    const historyResource = notificationsResource.addResource('history');
    historyResource.addMethod('GET', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Subscribe/unsubscribe endpoints
    const subscriptionsResource = notificationsResource.addResource('subscriptions');
    subscriptionsResource.addMethod('POST', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    subscriptionsResource.addMethod('DELETE', new apigateway.LambdaIntegration(notificationHandlerFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // Alerting endpoints
    const alertingResource = api.root.addResource('alerting');
    alertingResource.addResource('trigger').addMethod('POST', new apigateway.LambdaIntegration(alertingLogicFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    alertingResource.addResource('evaluate').addMethod('POST', new apigateway.LambdaIntegration(alertingLogicFunction), {
      apiKeyRequired: false,
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // SQS Queue for message processing
    const processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: 'inventory-processing-queue',
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(14),
    });

    // EventBridge for event orchestration
    const eventBus = new events.EventBus(this, 'InventoryEventBus', {
      eventBusName: 'inventory-replenishment-events',
    });

    // CloudWatch Events Rule for periodic alert evaluation
    const alertEvaluationRule = new events.Rule(this, 'AlertEvaluationRule', {
      ruleName: 'inventory-alert-evaluation',
      description: 'Triggers alert evaluation every 15 minutes',
      schedule: events.Schedule.rate(cdk.Duration.minutes(15)),
      enabled: true,
    });

    // Add the alerting logic function as a target
    alertEvaluationRule.addTarget(new targets.LambdaFunction(alertingLogicFunction));

    // Output important resource information
    new cdk.CfnOutput(this, 'InvoiceBucketName', {
      value: invoiceBucket.bucketName,
      description: 'S3 bucket for invoice storage',
    });

    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'SparePartsTableName', {
      value: sparePartsTable.tableName,
      description: 'DynamoDB table for spare parts data',
    });

    new cdk.CfnOutput(this, 'AlertsTopicArn', {
      value: alertsTopic.topicArn,
      description: 'SNS topic for inventory alerts',
    });

    new cdk.CfnOutput(this, 'MLDataBucketName', {
      value: mlDataBucket.bucketName,
      description: 'S3 bucket for ML training data and model artifacts',
    });

    new cdk.CfnOutput(this, 'SageMakerExecutionRoleArn', {
      value: sagemakerExecutionRole.roleArn,
      description: 'IAM role for SageMaker training jobs and endpoints',
    });

    new cdk.CfnOutput(this, 'StockoutAlertsTopicArn', {
      value: stockoutAlertsTopic.topicArn,
      description: 'SNS topic for stockout alerts',
    });

    new cdk.CfnOutput(this, 'CostOptimizationTopicArn', {
      value: costOptimizationTopic.topicArn,
      description: 'SNS topic for cost optimization alerts',
    });

    new cdk.CfnOutput(this, 'PredictiveAlertsTopicArn', {
      value: predictiveAlertsTopic.topicArn,
      description: 'SNS topic for predictive alerts',
    });

    new cdk.CfnOutput(this, 'SystemAlertsTopicArn', {
      value: systemAlertsTopic.topicArn,
      description: 'SNS topic for system alerts',
    });

    new cdk.CfnOutput(this, 'NotificationPreferencesTableName', {
      value: notificationPreferencesTable.tableName,
      description: 'DynamoDB table for notification preferences',
    });
  }
}