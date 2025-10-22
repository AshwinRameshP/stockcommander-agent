// Jest setup file for test configuration

// Mock AWS SDK clients for testing
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-bedrock');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-sagemaker');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-eventbridge');
jest.mock('@aws-sdk/client-sqs');

// Set test environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.INVOICE_BUCKET = 'test-invoice-bucket';
process.env.PROCESSED_DATA_BUCKET = 'test-processed-data-bucket';
process.env.SPARE_PARTS_TABLE = 'test-spare-parts-table';
process.env.DEMAND_FORECAST_TABLE = 'test-demand-forecast-table';
process.env.RECOMMENDATIONS_TABLE = 'test-recommendations-table';
process.env.SUPPLIER_METRICS_TABLE = 'test-supplier-metrics-table';
process.env.NORMALIZED_INVOICE_DATA_TABLE = 'test-normalized-invoice-data-table';