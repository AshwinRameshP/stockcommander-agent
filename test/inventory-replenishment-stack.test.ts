import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { InventoryReplenishmentStack } from '../src/stacks/inventory-replenishment-stack';

describe('InventoryReplenishmentStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new InventoryReplenishmentStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  test('should create S3 buckets for invoice and processed data storage', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [{
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }]
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });

  test('should create DynamoDB tables with encryption', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      SSESpecification: {
        SSEEnabled: true
      }
    });
  });

  test('should create Lambda functions with proper configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Timeout: 900 // 15 minutes
    });
  });

  test('should create API Gateway with CORS configuration', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Inventory Replenishment API'
    });
  });

  test('should create SNS topic for notifications', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'inventory-alerts'
    });
  });

  test('should create SQS queue for message processing', () => {
    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'inventory-processing-queue'
    });
  });

  test('should create EventBridge event bus', () => {
    template.hasResourceProperties('AWS::Events::EventBus', {
      Name: 'inventory-replenishment-events'
    });
  });

  test('should create IAM role with Bedrock permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }]
      }
    });
  });
});