import { handler as notificationHandler } from '../src/lambda/notification-handler';
import { handler as alertingHandler } from '../src/lambda/alerting-logic-handler';
import { AlertThresholdManager } from '../src/lambda/alert-threshold-manager';
import { AlertSuppressionService } from '../src/lambda/alert-suppression-service';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-bedrock-runtime');

describe('Notification System Tests', () => {
  beforeEach(() => {
    // Set up environment variables
    process.env.NOTIFICATION_PREFERENCES_TABLE = 'test-preferences';
    process.env.NOTIFICATION_HISTORY_TABLE = 'test-history';
    process.env.ALERTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:alerts';
    process.env.STOCKOUT_ALERTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:stockout';
    process.env.COST_OPTIMIZATION_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:cost';
    process.env.PREDICTIVE_ALERTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:predictive';
    process.env.SYSTEM_ALERTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:system';
    process.env.SPARE_PARTS_TABLE = 'test-spare-parts';
    process.env.DEMAND_FORECAST_TABLE = 'test-forecasts';
    process.env.RECOMMENDATIONS_TABLE = 'test-recommendations';
    process.env.SUPPLIER_METRICS_TABLE = 'test-suppliers';
    process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
  });

  describe('Notification Handler', () => {
    it('should handle GET preferences request', async () => {
      const event = {
        httpMethod: 'GET',
        resource: '/notifications/preferences',
        headers: { 'x-user-id': 'test-user' },
        pathParameters: null,
        queryStringParameters: null,
        body: null,
      } as any;

      // Mock DynamoDB response
      const mockSend = jest.fn().mockResolvedValue({
        Item: null, // No existing preferences
      });

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        GetCommand: jest.fn(),
      }));

      const result = await notificationHandler(event);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toHaveProperty('userId', 'test-user');
      expect(JSON.parse(result.body)).toHaveProperty('enabled', true);
    });

    it('should handle POST preferences request', async () => {
      const preferences = {
        notificationType: 'stockout',
        enabled: true,
        channels: ['email'],
        email: 'test@example.com',
        thresholds: {
          stockLevel: 5,
          urgencyLevel: 'high',
        },
      };

      const event = {
        httpMethod: 'POST',
        resource: '/notifications/preferences',
        headers: { 'x-user-id': 'test-user' },
        pathParameters: null,
        queryStringParameters: null,
        body: JSON.stringify(preferences),
      } as any;

      const mockSend = jest.fn().mockResolvedValue({});

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        PutCommand: jest.fn(),
      }));

      const result = await notificationHandler(event);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toHaveProperty('message', 'Preferences created successfully');
    });

    it('should validate preferences correctly', async () => {
      const invalidPreferences = {
        notificationType: 'stockout',
        enabled: true,
        channels: ['invalid-channel'],
      };

      const event = {
        httpMethod: 'POST',
        resource: '/notifications/preferences',
        headers: { 'x-user-id': 'test-user' },
        pathParameters: null,
        queryStringParameters: null,
        body: JSON.stringify(invalidPreferences),
      } as any;

      const result = await notificationHandler(event);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toHaveProperty('error');
    });
  });

  describe('Alert Threshold Manager', () => {
    let thresholdManager: AlertThresholdManager;

    beforeEach(() => {
      thresholdManager = new AlertThresholdManager();
    });

    it('should create threshold manager instance', () => {
      expect(thresholdManager).toBeInstanceOf(AlertThresholdManager);
    });

    it('should have evaluation methods', () => {
      expect(typeof thresholdManager.evaluateInventoryThresholds).toBe('function');
      expect(typeof thresholdManager.evaluatePredictiveThresholds).toBe('function');
      expect(typeof thresholdManager.evaluateCostOptimizationThresholds).toBe('function');
    });
  });

  describe('Alert Suppression Service', () => {
    let suppressionService: AlertSuppressionService;

    beforeEach(() => {
      suppressionService = new AlertSuppressionService();
    });

    it('should create suppression service instance', () => {
      expect(suppressionService).toBeInstanceOf(AlertSuppressionService);
    });

    it('should have suppression check methods', () => {
      expect(typeof suppressionService.shouldSuppressAlert).toBe('function');
      expect(typeof suppressionService.isManuallySupressed).toBe('function');
      expect(typeof suppressionService.createSuppressionRule).toBe('function');
    });

    it('should not suppress critical alerts during quiet hours', async () => {
      const mockSend = jest.fn().mockResolvedValue({
        Item: {
          quietHours: {
            enabled: true,
            start: '22:00',
            end: '08:00',
            timezone: 'UTC',
          },
        },
      });

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        GetCommand: jest.fn(),
      }));

      const result = await suppressionService.shouldSuppressAlert(
        'stockout',
        'TEST-PART-001',
        'critical',
        'test-user'
      );

      // Critical alerts should not be suppressed even during quiet hours
      expect(result.suppress).toBe(false);
    });
  });

  describe('Alerting Logic Handler', () => {
    it('should handle trigger alert request', async () => {
      const event = {
        httpMethod: 'POST',
        resource: '/alerting/trigger',
        body: JSON.stringify({
          alertType: 'stockout',
          partNumber: 'TEST-PART-001',
          context: {
            currentValue: 0,
            threshold: 5,
            urgencyLevel: 'critical',
          },
        }),
      } as any;

      // Mock SNS and DynamoDB
      const mockSNSSend = jest.fn().mockResolvedValue({});
      const mockDynamoSend = jest.fn().mockResolvedValue({});

      jest.doMock('@aws-sdk/client-sns', () => ({
        SNSClient: jest.fn(() => ({ send: mockSNSSend })),
        PublishCommand: jest.fn(),
      }));

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockDynamoSend })),
        },
        PutCommand: jest.fn(),
      }));

      const result = await alertingHandler(event) as any;

      expect(result?.statusCode).toBe(200);
      if (result?.body) {
        expect(JSON.parse(result.body)).toHaveProperty('message', 'Alert triggered successfully');
      }
    });

    it('should handle evaluate alerts request', async () => {
      const event = {
        httpMethod: 'POST',
        resource: '/alerting/evaluate',
        body: '{}',
      } as any;

      // Mock DynamoDB responses
      const mockSend = jest.fn()
        .mockResolvedValueOnce({ Items: [] }) // Spare parts scan
        .mockResolvedValueOnce({ Items: [] }) // Forecasts scan
        .mockResolvedValueOnce({ Items: [] }) // Suppliers scan
        .mockResolvedValueOnce({ Items: [] }); // Recommendations scan

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        ScanCommand: jest.fn(),
      }));

      const result = await alertingHandler(event) as any;

      expect(result?.statusCode).toBe(200);
      if (result?.body) {
        expect(JSON.parse(result.body)).toHaveProperty('message', 'Alert evaluation completed');
      }
    });
  });

  describe('Integration Tests', () => {
    it('should handle scheduled alert evaluation', async () => {
      const scheduledEvent = {
        source: 'aws.events',
        'detail-type': 'Scheduled Event',
        detail: {},
      } as any;

      // Mock all required services
      const mockSend = jest.fn().mockResolvedValue({ Items: [] });

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        ScanCommand: jest.fn(),
      }));

      // Should not throw error for scheduled events
      await expect(alertingHandler(scheduledEvent)).resolves.not.toThrow();
    });

    it('should create notification preferences with default values', async () => {
      const thresholdManager = new AlertThresholdManager();
      
      // Test that getUserThresholds returns defaults when no preferences exist
      const mockSend = jest.fn().mockResolvedValue({ Item: null });

      jest.doMock('@aws-sdk/lib-dynamodb', () => ({
        DynamoDBDocumentClient: {
          from: jest.fn(() => ({ send: mockSend })),
        },
        GetCommand: jest.fn(),
      }));

      const thresholds = await thresholdManager.getUserThresholds('test-user');

      expect(thresholds).toHaveProperty('stockLevel', 10);
      expect(thresholds).toHaveProperty('costSavings', 100);
      expect(thresholds).toHaveProperty('urgencyLevel', 'medium');
    });
  });
});