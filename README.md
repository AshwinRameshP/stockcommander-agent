# Intelligent Inventory Replenishment Agent

An AI-powered inventory management system that analyzes sales and purchase invoices to generate optimized replenishment recommendations using Amazon Bedrock, SageMaker, and other AWS services.

## Architecture Overview

This system leverages:
- **Amazon Bedrock** for AI-powered invoice parsing and reasoning
- **Amazon SageMaker** for demand forecasting and anomaly detection
- **AWS Lambda** for serverless compute
- **Amazon DynamoDB** for real-time data storage
- **Amazon S3** for invoice and data storage
- **API Gateway** for REST API endpoints
- **Amazon SNS/SQS** for notifications and messaging

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate permissions
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- TypeScript installed (`npm install -g typescript`)

## Required AWS Permissions

Your AWS account/role needs permissions for:
- S3 (bucket creation and management)
- DynamoDB (table creation and management)
- Lambda (function creation and execution)
- API Gateway (API creation and management)
- IAM (role and policy management)
- Bedrock (model access and invocation)
- SageMaker (endpoint creation and invocation)
- SNS/SQS (topic and queue management)
- EventBridge (event bus management)

## Setup Instructions

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

3. **Bootstrap CDK (first time only):**
   ```bash
   npx cdk bootstrap
   ```

4. **Deploy the infrastructure:**
   ```bash
   npm run deploy
   ```

5. **Verify deployment:**
   ```bash
   npx cdk synth
   ```

## Project Structure

```
├── src/
│   ├── app.ts                 # CDK application entry point
│   ├── stacks/
│   │   └── inventory-replenishment-stack.ts  # Main infrastructure stack
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces and types
│   └── utils/
│       └── aws-clients.ts     # AWS SDK client configuration
├── test/
│   └── setup.ts               # Jest test configuration
├── cdk.json                   # CDK configuration
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Jest testing configuration
└── package.json               # Node.js dependencies and scripts
```

## Available Scripts

- `npm run build` - Compile TypeScript code
- `npm run watch` - Watch for changes and recompile
- `npm test` - Run Jest tests
- `npm run cdk` - Run CDK commands
- `npm run deploy` - Deploy the stack to AWS
- `npm run destroy` - Destroy the stack (cleanup)
- `npm run synth` - Synthesize CloudFormation template
- `npm run diff` - Show differences between deployed and local stack

## Environment Variables

The following environment variables are automatically set by the CDK deployment:

- `INVOICE_BUCKET` - S3 bucket for invoice storage
- `PROCESSED_DATA_BUCKET` - S3 bucket for processed data
- `SPARE_PARTS_TABLE` - DynamoDB table for spare parts data
- `DEMAND_FORECAST_TABLE` - DynamoDB table for demand forecasts
- `RECOMMENDATIONS_TABLE` - DynamoDB table for replenishment recommendations
- `SUPPLIER_METRICS_TABLE` - DynamoDB table for supplier performance metrics

## API Endpoints

After deployment, the following endpoints will be available:

- `POST /invoices/upload` - Upload invoice files for processing
- `GET /recommendations` - Retrieve replenishment recommendations
- `POST /recommendations` - Generate new recommendations

## Next Steps

1. Implement invoice processing logic in Lambda functions
2. Integrate Amazon Bedrock for AI-powered document parsing
3. Set up SageMaker models for demand forecasting
4. Build the React dashboard for user interface
5. Configure notification and alerting systems

## Security Considerations

- All S3 buckets are configured with encryption and block public access
- DynamoDB tables use AWS managed encryption
- Lambda functions have minimal IAM permissions
- API Gateway endpoints can be secured with API keys or Cognito authentication

## Cost Optimization

- DynamoDB tables use on-demand billing
- Lambda functions are configured with appropriate memory and timeout settings
- S3 lifecycle policies automatically manage object retention
- All resources are tagged for cost tracking

## Troubleshooting

1. **CDK Bootstrap Issues**: Ensure your AWS account is bootstrapped for CDK
2. **Permission Errors**: Verify your AWS credentials have the required permissions
3. **Region Issues**: Ensure you're deploying to a region that supports all required services
4. **Bedrock Access**: Some regions may require requesting access to Bedrock models

For more detailed troubleshooting, check the CloudWatch logs for Lambda functions and CDK deployment logs.