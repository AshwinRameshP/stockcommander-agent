import { SageMakerService, DemandForecastingConfig, ForecastRequest } from '../src/utils/sagemaker-service';
import { MLDataPreprocessor, DemandDataPoint } from '../src/utils/ml-data-preprocessor';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-sagemaker');
jest.mock('@aws-sdk/client-sagemaker-runtime');
jest.mock('@aws-sdk/client-s3');

describe('ML Pipeline Components', () => {
  describe('SageMakerService', () => {
    let sagemakerService: SageMakerService;
    let mockConfig: DemandForecastingConfig;

    beforeEach(() => {
      sagemakerService = new SageMakerService('us-east-1');
      mockConfig = {
        trainingJobName: 'test-training-job',
        modelName: 'test-model',
        endpointConfigName: 'test-endpoint-config',
        endpointName: 'test-endpoint',
        roleArn: 'arn:aws:iam::123456789012:role/SageMakerRole',
        trainingImage: '522234722520.dkr.ecr.us-east-1.amazonaws.com/forecasting-deepar:latest',
        instanceType: 'ml.m5.large' as any,
        instanceCount: 1,
        volumeSizeInGB: 30,
        maxRuntimeInSeconds: 3600
      };
    });

    test('should create training job with correct parameters', async () => {
      const trainingData = {
        s3InputPath: 's3://test-bucket/training-data/',
        s3OutputPath: 's3://test-bucket/model-artifacts/',
        contentType: 'application/jsonlines'
      };

      // Mock the SageMaker client response
      const mockSend = jest.fn().mockResolvedValue({
        TrainingJobArn: 'arn:aws:sagemaker:us-east-1:123456789012:training-job/test-training-job'
      });

      (sagemakerService as any).sagemakerClient = { send: mockSend };

      const result = await sagemakerService.createTrainingJob(mockConfig, trainingData);

      expect(result).toBe('arn:aws:sagemaker:us-east-1:123456789012:training-job/test-training-job');
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        resolveMiddleware: expect.any(Function)
      }));
    });

    test('should generate forecast with correct format', async () => {
      const mockForecastRequest: ForecastRequest = {
        partNumber: 'PART-001',
        historicalData: [
          { timestamp: '2024-01-01T00:00:00Z', demand: 10 },
          { timestamp: '2024-01-02T00:00:00Z', demand: 15 },
          { timestamp: '2024-01-03T00:00:00Z', demand: 12 }
        ],
        forecastHorizon: 7
      };

      const mockResponse = {
        Body: new TextEncoder().encode(JSON.stringify({
          predictions: [{
            mean: [13, 14, 15, 16, 17, 18, 19],
            quantiles: {
              '0.1': [10, 11, 12, 13, 14, 15, 16],
              '0.5': [13, 14, 15, 16, 17, 18, 19],
              '0.9': [16, 17, 18, 19, 20, 21, 22]
            }
          }]
        }))
      };

      const mockSend = jest.fn().mockResolvedValue(mockResponse);
      (sagemakerService as any).runtimeClient = { send: mockSend };

      const result = await sagemakerService.generateForecast('test-endpoint', mockForecastRequest);

      expect(result.partNumber).toBe('PART-001');
      expect(result.predictions).toHaveLength(7);
      expect(result.predictions[0]).toMatchObject({
        timestamp: expect.any(String),
        mean: 13,
        p10: 10,
        p50: 13,
        p90: 16
      });
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    test('should calculate confidence score correctly', () => {
      const predictions = {
        mean: [10, 15, 20],
        quantiles: {
          '0.1': [8, 12, 16],
          '0.9': [12, 18, 24]
        }
      };

      const confidence = (sagemakerService as any).calculateConfidence(predictions);
      
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('MLDataPreprocessor', () => {
    let preprocessor: MLDataPreprocessor;
    let mockDemandData: DemandDataPoint[];

    beforeEach(() => {
      preprocessor = new MLDataPreprocessor('us-east-1');
      mockDemandData = [
        {
          partNumber: 'PART-001',
          timestamp: '2024-01-01T00:00:00Z',
          demand: 10,
          category: 'electronics'
        },
        {
          partNumber: 'PART-001',
          timestamp: '2024-01-02T00:00:00Z',
          demand: 15,
          category: 'electronics'
        },
        {
          partNumber: 'PART-002',
          timestamp: '2024-01-01T00:00:00Z',
          demand: 5,
          category: 'mechanical'
        },
        {
          partNumber: 'PART-002',
          timestamp: '2024-01-02T00:00:00Z',
          demand: 8,
          category: 'mechanical'
        }
      ];
    });

    test('should preprocess demand data correctly', async () => {
      const options = {
        minTimeSeriesLength: 2,
        trainValidationSplit: 0.8,
        aggregationPeriod: 'daily' as const
      };

      const result = await preprocessor.preprocessDemandData(mockDemandData, options);

      expect(result.trainingData).toBeDefined();
      expect(result.validationData).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      expect(result.metadata.totalRecords).toBe(4);
      expect(result.metadata.categories).toContain('electronics');
      expect(result.metadata.categories).toContain('mechanical');
    });

    test('should group data by part number correctly', () => {
      const grouped = (preprocessor as any).groupByPartNumber(mockDemandData);
      
      expect(grouped.size).toBe(2);
      expect(grouped.get('PART-001')).toHaveLength(2);
      expect(grouped.get('PART-002')).toHaveLength(2);
    });

    test('should filter short time series', () => {
      const grouped = new Map([
        ['PART-001', mockDemandData.slice(0, 2)],
        ['PART-002', mockDemandData.slice(2, 3)] // Only 1 data point
      ]);

      const filtered = (preprocessor as any).filterShortTimeSeries(grouped, 2);
      
      expect(filtered.size).toBe(1);
      expect(filtered.has('PART-001')).toBe(true);
      expect(filtered.has('PART-002')).toBe(false);
    });

    test('should aggregate data by period correctly', () => {
      const grouped = new Map([
        ['PART-001', [
          {
            partNumber: 'PART-001',
            timestamp: '2024-01-01T10:00:00Z',
            demand: 5,
            category: 'electronics'
          },
          {
            partNumber: 'PART-001',
            timestamp: '2024-01-01T14:00:00Z',
            demand: 10,
            category: 'electronics'
          }
        ]]
      ]);

      const aggregated = (preprocessor as any).aggregateByPeriod(grouped, 'daily');
      const part001Data = aggregated.get('PART-001');
      
      expect(part001Data).toHaveLength(1);
      expect(part001Data[0].demand).toBe(15); // 5 + 10
      expect(part001Data[0].timestamp).toBe('2024-01-01');
    });

    test('should convert to DeepAR format correctly', () => {
      const grouped = new Map([
        ['PART-001', mockDemandData.slice(0, 2)]
      ]);
      const categoryMapping = new Map([['electronics', 0]]);

      const deepARRecords = (preprocessor as any).convertToDeepARFormat(grouped, categoryMapping);
      
      expect(deepARRecords).toHaveLength(1);
      expect(deepARRecords[0]).toMatchObject({
        start: '2024-01-01T00:00:00Z',
        target: [10, 15],
        cat: [0]
      });
    });

    test('should split train/validation data correctly', () => {
      const records = [
        { start: '2024-01-01', target: [1, 2, 3] },
        { start: '2024-01-02', target: [4, 5, 6] },
        { start: '2024-01-03', target: [7, 8, 9] },
        { start: '2024-01-04', target: [10, 11, 12] }
      ];

      const { trainingData, validationData } = (preprocessor as any).splitTrainValidation(records, 0.75);
      
      expect(trainingData.length + validationData.length).toBe(4);
      expect(trainingData.length).toBe(3); // 75% of 4
      expect(validationData.length).toBe(1); // 25% of 4
    });

    test('should generate metadata correctly', () => {
      const trainingData = [
        { start: '2024-01-01', target: [1, 2, 3] },
        { start: '2024-01-02', target: [4, 5] }
      ];
      const validationData = [
        { start: '2024-01-03', target: [7, 8, 9, 10] }
      ];
      const categoryMapping = new Map([['electronics', 0], ['mechanical', 1]]);

      const metadata = (preprocessor as any).generateMetadata(
        mockDemandData,
        trainingData,
        validationData,
        categoryMapping
      );

      expect(metadata.totalRecords).toBe(4);
      expect(metadata.trainingRecords).toBe(2);
      expect(metadata.validationRecords).toBe(1);
      expect(metadata.timeSeriesLength).toBe(3); // Average of [3, 2, 4]
      expect(metadata.categories).toEqual(['electronics', 'mechanical']);
      expect(metadata.dateRange.start).toBeDefined();
      expect(metadata.dateRange.end).toBeDefined();
    });

    test('should upload training data to S3', async () => {
      const mockDataset = {
        trainingData: [
          { start: '2024-01-01', target: [1, 2, 3] }
        ],
        validationData: [
          { start: '2024-01-02', target: [4, 5, 6] }
        ],
        metadata: {
          totalRecords: 2,
          trainingRecords: 1,
          validationRecords: 1,
          timeSeriesLength: 3,
          categories: ['test'],
          dateRange: { start: '2024-01-01', end: '2024-01-02' }
        }
      };

      const mockSend = jest.fn().mockResolvedValue({});
      (preprocessor as any).s3Client = { send: mockSend };

      const result = await preprocessor.uploadTrainingData(
        'test-bucket',
        'test-prefix',
        mockDataset
      );

      expect(result.trainingDataS3Uri).toBe('s3://test-bucket/test-prefix/train/train.jsonl');
      expect(result.validationDataS3Uri).toBe('s3://test-bucket/test-prefix/validation/validation.jsonl');
      expect(result.metadataS3Uri).toBe('s3://test-bucket/test-prefix/metadata.json');
      expect(mockSend).toHaveBeenCalledTimes(3); // Training, validation, and metadata uploads
    });
  });

  describe('Integration Tests', () => {
    test('should handle end-to-end ML pipeline flow', async () => {
      // This would be an integration test that combines all components
      // For now, we'll just verify the components can be instantiated together
      const sagemakerService = new SageMakerService();
      const preprocessor = new MLDataPreprocessor();

      expect(sagemakerService).toBeDefined();
      expect(preprocessor).toBeDefined();
    });
  });
});