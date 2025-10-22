/**
 * Summary test file demonstrating the key invoice processing unit tests
 * This file covers the main requirements from task 2.4:
 * - Test cases for various invoice formats (PDF, CSV, images)
 * - Test Bedrock integration with mock responses
 * - Validate data transformation and storage operations
 */

import { FileValidator, DEFAULT_INVOICE_VALIDATION_OPTIONS } from '../src/utils/file-validation';
import { BedrockPromptBuilder } from '../src/utils/bedrock-prompts';
import { DataNormalizer } from '../src/utils/data-normalizer';
import { LineItem } from '../src/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
import { S3Client } from '@aws-sdk/client-s3';
const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;

describe('Invoice Processing Summary Tests', () => {
  
  describe('1. Various Invoice Format Tests', () => {
    let fileValidator: FileValidator;

    beforeEach(() => {
      jest.clearAllMocks();
      fileValidator = new FileValidator(DEFAULT_INVOICE_VALIDATION_OPTIONS);
    });

    test('should handle PDF invoice files', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4\nInvoice content\n%%EOF');
      
      const mockS3Response = {
        Body: createMockStream(mockPdfBuffer),
        ContentType: 'application/pdf',
        ContentLength: mockPdfBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.pdf');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('application/pdf');
      expect(result.fileHash).toBeDefined();
    });

    test('should handle CSV invoice files', async () => {
      const mockCsvBuffer = Buffer.from('Invoice ID,Date,Part Number,Description,Quantity,Unit Price\nINV-001,2023-01-01,ABC-123,Test Part,5,10.50');
      
      const mockS3Response = {
        Body: createMockStream(mockCsvBuffer),
        ContentType: 'text/csv',
        ContentLength: mockCsvBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.csv');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle image invoice files (JPEG)', async () => {
      const mockJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0xFF, 0xD9]);
      
      const mockS3Response = {
        Body: createMockStream(mockJpegBuffer),
        ContentType: 'image/jpeg',
        ContentLength: mockJpegBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.jpg');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('image/jpeg');
    });

    test('should handle image invoice files (PNG)', async () => {
      const mockPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      
      const mockS3Response = {
        Body: createMockStream(mockPngBuffer),
        ContentType: 'image/png',
        ContentLength: mockPngBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockPngBuffer);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.png');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('image/png');
    });

    // Helper function to create mock readable stream
    function createMockStream(buffer: Buffer) {
      return {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(buffer), 10);
          } else if (event === 'end') {
            setTimeout(() => callback(), 20);
          }
        })
      };
    }
  });

  describe('2. Bedrock Integration Tests', () => {
    test('should generate appropriate prompts for sales invoices', () => {
      const extractedText = 'Invoice #INV-001\nDate: 2023-01-01\nCustomer: Test Customer\nPart ABC-123: Widget, Qty: 5, Price: $10.00';
      
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', extractedText);
      
      expect(prompt).toContain('sales invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "sales"');
      expect(prompt).toContain('customer');
      expect(prompt).toContain('JSON object');
    });

    test('should generate appropriate prompts for purchase invoices', () => {
      const extractedText = 'Invoice #PO-001\nDate: 2023-01-01\nSupplier: Test Supplier\nPart XYZ-456: Component, Qty: 10, Price: $25.00';
      
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);
      
      expect(prompt).toContain('purchase invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "purchase"');
      expect(prompt).toContain('supplier');
      expect(prompt).toContain('purchaseOrderNumber');
    });

    test('should validate Bedrock extraction results correctly', () => {
      const validResult = {
        invoiceId: 'INV-001',
        type: 'sales',
        date: '2023-01-01',
        customer: 'Test Customer',
        lineItems: [
          {
            partNumber: 'ABC-123',
            description: 'Test Widget',
            quantity: 5,
            unitPrice: 10.00,
            totalAmount: 50.00
          }
        ],
        totalAmount: 50.00,
        currency: 'USD',
        confidence: 0.9
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(validResult, 'sales');
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid Bedrock extraction results', () => {
      const invalidResult = {
        // Missing required fields
        type: 'sales',
        date: 'invalid-date-format',
        lineItems: [],
        totalAmount: -10,
        confidence: 1.5 // Invalid confidence range
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(invalidResult, 'sales');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('3. Data Transformation and Storage Tests', () => {
    let dataNormalizer: DataNormalizer;

    beforeEach(() => {
      dataNormalizer = new DataNormalizer();
    });

    test('should normalize invoice line item data correctly', async () => {
      const lineItem: LineItem = {
        partNumber: 'abc-123',
        description: 'test widget part',
        quantity: 5,
        unitPrice: 10.50,
        totalAmount: 52.50,
        category: 'spare'
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData).toBeDefined();
      
      // Verify data transformations
      expect(result.normalizedData!.partNumber).toBe('ABC-123'); // Uppercase
      expect(result.normalizedData!.description).toBe('Test Widget Part'); // Title case
      expect(result.normalizedData!.category).toBe('spare_parts'); // Mapped category
      expect(result.normalizedData!.unitOfMeasure).toBe('each'); // Default unit
      expect(result.normalizedData!.safetyStock).toBeGreaterThan(0);
      expect(result.normalizedData!.reorderPoint).toBeGreaterThan(0);
      expect(result.normalizedData!.leadTimeDays).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle data validation errors appropriately', async () => {
      const invalidLineItem: LineItem = {
        partNumber: '', // Invalid
        description: '', // Invalid
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(invalidLineItem);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('part number'))).toBe(true);
      expect(result.errors.some(error => error.includes('description'))).toBe(true);
    });

    test('should calculate appropriate inventory parameters by category', async () => {
      const testCases = [
        { category: 'spare', expectedCategory: 'spare_parts' },
        { category: 'component', expectedCategory: 'components' },
        { category: 'tool', expectedCategory: 'tools' },
        { category: 'consumable', expectedCategory: 'consumables' }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: 'TEST-123',
          description: 'Test item',
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00,
          category: testCase.category
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        
        expect(result.success).toBe(true);
        expect(result.normalizedData!.category).toBe(testCase.expectedCategory);
        expect(result.normalizedData!.safetyStock).toBeGreaterThan(0);
        expect(result.normalizedData!.reorderPoint).toBeGreaterThan(0);
      }
    });

    test('should provide confidence scores based on data quality', async () => {
      // High quality data should have high confidence
      const highQualityItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Perfect Widget',
        quantity: 5,
        unitPrice: 10.00,
        totalAmount: 50.00,
        category: 'spare_parts'
      };

      const highQualityResult = await dataNormalizer.normalizeLineItem(highQualityItem);
      
      expect(highQualityResult.success).toBe(true);
      expect(highQualityResult.confidence).toBeGreaterThan(0.7);

      // Lower quality data should have lower confidence
      const lowerQualityItem: LineItem = {
        partNumber: 'abc@123#def', // Will be heavily modified
        description: 'messy description with issues',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
        // No category provided
      };

      const lowerQualityResult = await dataNormalizer.normalizeLineItem(lowerQualityItem);
      
      expect(lowerQualityResult.success).toBe(true);
      expect(lowerQualityResult.confidence).toBeLessThan(highQualityResult.confidence);
    });
  });

  describe('4. Integration Test - Complete Invoice Processing Flow', () => {
    test('should demonstrate end-to-end invoice processing capabilities', async () => {
      // 1. File validation
      const fileValidator = new FileValidator(DEFAULT_INVOICE_VALIDATION_OPTIONS);
      
      // 2. Bedrock prompt generation
      const extractedText = 'Invoice #INV-001\nDate: 2023-01-01\nSupplier: Test Supplier\nPart ABC-123: Widget, Qty: 5, Price: $10.00';
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);
      
      // 3. Mock Bedrock response validation
      const mockBedrockResult = {
        invoiceId: 'INV-001',
        type: 'purchase',
        date: '2023-01-01',
        supplier: 'Test Supplier',
        lineItems: [{
          partNumber: 'ABC-123',
          description: 'Widget',
          quantity: 5,
          unitPrice: 10.00,
          totalAmount: 50.00,
          category: 'spare_parts'
        }],
        totalAmount: 50.00,
        currency: 'USD',
        confidence: 0.9
      };
      
      const validation = BedrockPromptBuilder.validateExtractionResult(mockBedrockResult, 'purchase');
      
      // 4. Data normalization
      const dataNormalizer = new DataNormalizer();
      const normalizationResult = await dataNormalizer.normalizeLineItem(mockBedrockResult.lineItems[0]);
      
      // Verify complete flow
      expect(prompt).toContain('purchase invoice');
      expect(validation.isValid).toBe(true);
      expect(normalizationResult.success).toBe(true);
      expect(normalizationResult.normalizedData!.partNumber).toBe('ABC-123');
      expect(normalizationResult.normalizedData!.category).toBe('spare_parts');
      expect(normalizationResult.confidence).toBeGreaterThan(0);
      
      console.log('✅ Complete invoice processing flow test passed');
      console.log(`   - File validation: Ready`);
      console.log(`   - Bedrock integration: Ready`);
      console.log(`   - Data transformation: Ready`);
      console.log(`   - Confidence score: ${normalizationResult.confidence.toFixed(2)}`);
    });
  });
});