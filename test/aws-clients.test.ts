import { awsConfig, validateAWSConfig, bedrockConfig } from '../src/utils/aws-clients';

describe('AWS Configuration', () => {
  test('should have all required environment variables set', () => {
    expect(() => validateAWSConfig()).not.toThrow();
  });

  test('should have correct AWS region configuration', () => {
    expect(awsConfig.region).toBe('us-east-1');
  });

  test('should have all required table names configured', () => {
    expect(awsConfig.sparePartsTable).toBe('test-spare-parts-table');
    expect(awsConfig.demandForecastTable).toBe('test-demand-forecast-table');
    expect(awsConfig.recommendationsTable).toBe('test-recommendations-table');
    expect(awsConfig.supplierMetricsTable).toBe('test-supplier-metrics-table');
  });

  test('should have correct Bedrock configuration', () => {
    expect(bedrockConfig.modelId).toBe('anthropic.claude-3-sonnet-20240229-v1:0');
    expect(bedrockConfig.maxTokens).toBe(4000);
    expect(bedrockConfig.temperature).toBe(0.1);
  });
});