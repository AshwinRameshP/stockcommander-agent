import { S3Client } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BedrockClient } from '@aws-sdk/client-bedrock';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { SageMakerClient } from '@aws-sdk/client-sagemaker';
import { SNSClient } from '@aws-sdk/client-sns';
import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
import { SQSClient } from '@aws-sdk/client-sqs';

// AWS Region configuration
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients with proper configuration
export const s3Client = new S3Client({
  region: AWS_REGION,
});

export const dynamoDBClient = new DynamoDBClient({
  region: AWS_REGION,
});

export const bedrockClient = new BedrockClient({
  region: AWS_REGION,
});

export const bedrockRuntimeClient = new BedrockRuntimeClient({
  region: AWS_REGION,
});

export const sageMakerClient = new SageMakerClient({
  region: AWS_REGION,
});

export const snsClient = new SNSClient({
  region: AWS_REGION,
});

export const eventBridgeClient = new EventBridgeClient({
  region: AWS_REGION,
});

export const sqsClient = new SQSClient({
  region: AWS_REGION,
});

// Configuration object for easy access to environment variables
export const awsConfig = {
  region: AWS_REGION,
  invoiceBucket: process.env.INVOICE_BUCKET || '',
  processedDataBucket: process.env.PROCESSED_DATA_BUCKET || '',
  sparePartsTable: process.env.SPARE_PARTS_TABLE || '',
  demandForecastTable: process.env.DEMAND_FORECAST_TABLE || '',
  recommendationsTable: process.env.RECOMMENDATIONS_TABLE || '',
  supplierMetricsTable: process.env.SUPPLIER_METRICS_TABLE || '',
  normalizedInvoiceDataTable: process.env.NORMALIZED_INVOICE_DATA_TABLE || '',
};

// Bedrock model configuration
export const bedrockConfig = {
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0', // Claude 3 Sonnet
  maxTokens: 4000,
  temperature: 0.1,
  region: AWS_REGION,
};

// Validate that required environment variables are set
export function validateAWSConfig(): void {
  const requiredVars = [
    'INVOICE_BUCKET',
    'PROCESSED_DATA_BUCKET',
    'SPARE_PARTS_TABLE',
    'DEMAND_FORECAST_TABLE',
    'RECOMMENDATIONS_TABLE',
    'SUPPLIER_METRICS_TABLE',
    'NORMALIZED_INVOICE_DATA_TABLE',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}