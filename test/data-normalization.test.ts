import { DataNormalizer } from '../src/utils/data-normalizer';
import { DuplicateDetector } from '../src/utils/duplicate-detector';
import { DataStorageService } from '../src/utils/data-storage-service';
import { DataQualityValidator } from '../src/utils/data-quality-validator';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LineItem, SparePart, NormalizedInvoiceData } from '../src/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');

describe('Data Normalization and Storage Layer', () => {
  let mockDynamoClient: jest.Mocked<DynamoDBClient>;
  let dataNormalizer: DataNormalizer;
  let duplicateDetector: DuplicateDetector;
  let storageService: DataStorageService;
  let qualityValidator: DataQualityValidator;

  beforeEach(() => {
    mockDynamoClient = new DynamoDBClient({}) as jest.Mocked<DynamoDBClient>;
    dataNormalizer = new DataNormalizer();
    duplicateDetector = new DuplicateDetector(mockDynamoClient);
    storageService = new DataStorageService(mockDynamoClient);
    qualityValidator = new DataQualityValidator();

    // Set up environment variables
    process.env.SPARE_PARTS_TABLE = 'test-spare-parts';
    process.env.NORMALIZED_INVOICE_DATA_TABLE = 'test-normalized-data';
    process.env.DATA_QUALITY_TABLE = 'test-data-quality';
    process.env.DUPLICATE_DETECTION_TABLE = 'test-duplicate-detection';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('DataNormalizer', () => {
    it('should normalize a valid line item successfully', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'High Quality Bearing Assembly',
        quantity: 5,
        unitPrice: 25.50,
        totalAmount: 127.50,
        category: 'spare_parts'
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData).toBeDefined();
      expect(result.normalizedData?.partNumber).toBe('ABC-123');
      expect(result.normalizedData?.category).toBe('spare_parts');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid part numbers', async () => {
      const lineItem: LineItem = {
        partNumber: '',
        description: 'Some part',
        quantity: 1,
        unitPrice: 10,
        totalAmount: 10
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid or empty part number');
    });
  });

  describe('DataQualityValidator', () => {
    it('should validate high-quality line items', () => {
      const lineItem: LineItem = {
        partNumber: 'QUAL-001',
        description: 'High Quality Precision Bearing Assembly',
        quantity: 5,
        unitPrice: 125.50,
        totalAmount: 627.50,
        category: 'spare_parts'
      };

      const result = qualityValidator.validateLineItem(lineItem);

      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0.8);
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    it('should detect quality issues in line items', () => {
      const lineItem: LineItem = {
        partNumber: 'X', // Too short
        description: 'Bad', // Too short
        quantity: -1, // Invalid
        unitPrice: -10, // Invalid
        totalAmount: 100 // Inconsistent with unit price * quantity
      };

      const result = qualityValidator.validateLineItem(lineItem);

      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(0.5);
      expect(result.issues.filter(i => i.severity === 'error').length).toBeGreaterThan(0);
    });
  });

  describe('DataStorageService', () => {
    it('should store normalized invoice data successfully', async () => {
      const normalizedData: NormalizedInvoiceData[] = [{
        partNumber: 'TEST-789',
        invoiceDate: '2024-01-15',
        invoiceId: 'INV-001',
        invoiceType: 'purchase',
        quantity: 10,
        unitPrice: 50.00,
        totalAmount: 500.00,
        currency: 'USD',
        normalizedDescription: 'Test Component',
        originalDescription: 'test component (used)',
        category: 'components',
        unitOfMeasure: 'each',
        qualityScore: 0.85,
        normalizationTimestamp: new Date().toISOString(),
        dataSource: 'test'
      }];

      // Mock successful batch write
      mockDynamoClient.send = jest.fn().mockResolvedValue({});

      const result = await storageService.storeNormalizedInvoiceData(normalizedData);

      expect(result.success).toBe(true);
      expect(result.recordsStored).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete normalization workflow', async () => {
      const lineItem: LineItem = {
        partNumber: 'WORKFLOW-001',
        description: 'Complete workflow test bearing',
        quantity: 3,
        unitPrice: 75.00,
        totalAmount: 225.00,
        category: 'spare_parts'
      };

      // Step 1: Validate input quality
      const qualityResult = qualityValidator.validateLineItem(lineItem);
      expect(qualityResult.isValid).toBe(true);

      // Step 2: Normalize the data
      const normalizationResult = await dataNormalizer.normalizeLineItem(lineItem);
      expect(normalizationResult.success).toBe(true);

      // Step 3: Check for duplicates
      mockDynamoClient.send = jest.fn().mockResolvedValue({ Items: [] });
      const duplicateResult = await duplicateDetector.checkForDuplicates(normalizationResult.normalizedData!);
      expect(duplicateResult.isDuplicate).toBe(false);

      // This integration test demonstrates the complete flow from raw line item
      // to normalized, validated, and storage-ready data
    });
  });
});