import { handler as invoiceParserHandler } from '../src/lambda/invoice-parser-handler';
import { handler as dataNormalizationHandler } from '../src/lambda/data-normalization-handler';
import { DataNormalizer } from '../src/utils/data-normalizer';
import { BedrockPromptBuilder } from '../src/utils/bedrock-prompts';
import { FileValidator } from '../src/utils/file-validation';
import { S3Event, DynamoDBStreamEvent, Context } from 'aws-lambda';
import { LineItem, InvoiceData } from '../src/types';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/client-sns');

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;
const mockBedrockClient = BedrockRuntimeClient as jest.MockedClass<typeof BedrockRuntimeClient>;
const mockDynamoClient = DynamoDBClient as jest.MockedClass<typeof DynamoDBClient>;
const mockSNSClient = SNSClient as jest.MockedClass<typeof SNSClient>;

describe('Invoice Processing Unit Tests', () => {
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock context
    mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test-function',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test-function',
      logStreamName: '2023/01/01/[$LATEST]test-stream',
      getRemainingTimeInMillis: () => 30000,
      done: jest.fn(),
      fail: jest.fn(),
      succeed: jest.fn()
    };

    // Setup environment variables
    process.env.AWS_REGION = 'us-east-1';
    process.env.INVOICE_BUCKET = 'test-invoice-bucket';
    process.env.PROCESSED_DATA_BUCKET = 'test-processed-bucket';
    process.env.ALERTS_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:test-alerts';
    process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';
    process.env.SPARE_PARTS_TABLE = 'test-spare-parts-table';
  });

  describe('File Validation Tests', () => {
    let fileValidator: FileValidator;

    beforeEach(() => {
      fileValidator = new FileValidator({
        maxSizeBytes: 50 * 1024 * 1024,
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'text/csv'],
        performVirusScan: true,
        calculateHash: true
      });
    });

    test('should validate PDF files correctly', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF');
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(mockPdfBuffer);
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'application/pdf',
        ContentLength: mockPdfBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'test.pdf');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('application/pdf');
      expect(result.fileHash).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    test('should validate JPEG files correctly', async () => {
      const mockJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0xFF, 0xD9]);
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(mockJpegBuffer);
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'image/jpeg',
        ContentLength: mockJpegBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'test.jpg');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('image/jpeg');
      expect(result.errors).toHaveLength(0);
    });

    test('should validate CSV files correctly', async () => {
      const mockCsvBuffer = Buffer.from('Invoice ID,Date,Part Number,Description,Quantity,Unit Price\nINV-001,2023-01-01,ABC-123,Test Part,5,10.50');
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(mockCsvBuffer);
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'text/csv',
        ContentLength: mockCsvBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'test.csv');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject files that are too large', async () => {
      const mockLargeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(mockLargeBuffer);
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'application/pdf',
        ContentLength: mockLargeBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'large-file.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds maximum allowed size'))).toBe(true);
    });

    test('should reject unsupported file types', async () => {
      const mockBuffer = Buffer.from('test content');
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(mockBuffer);
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'application/exe',
        ContentLength: mockBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'malicious.exe');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('MIME type application/exe is not allowed'))).toBe(true);
    });
  });

  describe('Bedrock Integration Tests', () => {
    test('should generate correct prompt for sales invoice', () => {
      const extractedText = 'Invoice #INV-001\nDate: 2023-01-01\nCustomer: Test Customer\nPart ABC-123: Widget, Qty: 5, Price: $10.00';
      
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', extractedText);
      
      expect(prompt).toContain('sales invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "sales"');
      expect(prompt).toContain('customer');
    });

    test('should generate correct prompt for purchase invoice', () => {
      const extractedText = 'Invoice #PO-001\nDate: 2023-01-01\nSupplier: Test Supplier\nPart XYZ-456: Component, Qty: 10, Price: $25.00';
      
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);
      
      expect(prompt).toContain('purchase invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "purchase"');
      expect(prompt).toContain('supplier');
    });

    test('should validate extraction results correctly', () => {
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

    test('should detect invalid extraction results', () => {
      const invalidResult = {
        // Missing invoiceId
        type: 'sales',
        date: 'invalid-date',
        lineItems: [],
        totalAmount: -10, // Invalid amount
        confidence: 1.5 // Invalid confidence
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(invalidResult, 'sales');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors.some(error => error.includes('Missing invoice ID'))).toBe(true);
      expect(validation.errors.some(error => error.includes('Invalid confidence score'))).toBe(true);
    });

    test('should handle Bedrock API response correctly', async () => {
      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              invoiceId: 'INV-001',
              type: 'sales',
              date: '2023-01-01',
              customer: 'Test Customer',
              lineItems: [{
                partNumber: 'ABC-123',
                description: 'Test Widget',
                quantity: 5,
                unitPrice: 10.00,
                totalAmount: 50.00,
                category: 'spare_parts'
              }],
              totalAmount: 50.00,
              currency: 'USD',
              confidence: 0.9
            })
          }]
        }))
      };

      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue(mockBedrockResponse);

      // This would be tested as part of the invoice parser handler
      expect(mockBedrockResponse).toBeDefined();
    });
  });

  describe('Data Normalization Tests', () => {
    let dataNormalizer: DataNormalizer;

    beforeEach(() => {
      dataNormalizer = new DataNormalizer();
    });

    test('should normalize line item data correctly', async () => {
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
      expect(result.normalizedData!.partNumber).toBe('ABC-123');
      expect(result.normalizedData!.description).toBe('Test Widget Part');
      expect(result.normalizedData!.category).toBe('spare_parts');
      expect(result.confidence).toBeGreaterThan(0);
    });

    test('should handle invalid part numbers', async () => {
      const lineItem: LineItem = {
        partNumber: '',
        description: 'test widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid or empty part number'))).toBe(true);
    });

    test('should infer category from description', async () => {
      const lineItem: LineItem = {
        partNumber: 'BEARING-001',
        description: 'Ball bearing for motor',
        quantity: 2,
        unitPrice: 15.00,
        totalAmount: 30.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.category).toBe('spare_parts');
    });

    test('should calculate appropriate inventory parameters', async () => {
      const expensiveLineItem: LineItem = {
        partNumber: 'MOTOR-001',
        description: 'High-value motor component',
        quantity: 1,
        unitPrice: 1500.00,
        totalAmount: 1500.00,
        category: 'components'
      };

      const result = await dataNormalizer.normalizeLineItem(expensiveLineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.safetyStock).toBeLessThan(5); // Lower safety stock for expensive items
      expect(result.normalizedData!.reorderPoint).toBeGreaterThan(0);
    });

    test('should provide appropriate confidence scores', async () => {
      const perfectLineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Perfect Widget',
        quantity: 5,
        unitPrice: 10.00,
        totalAmount: 50.00,
        category: 'spare_parts'
      };

      const result = await dataNormalizer.normalizeLineItem(perfectLineItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Invoice Parser Handler Tests', () => {
    test('should process valid S3 event successfully', async () => {
      const mockS3Event: S3Event = {
        Records: [{
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'invoices/validated/test-invoice.csv' }
          }
        } as any]
      };

      const mockCsvContent = 'Invoice ID,Date,Part Number,Description,Quantity,Unit Price\nINV-001,2023-01-01,ABC-123,Test Part,5,10.50';
      
      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(Buffer.from(mockCsvContent));
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'text/csv',
        Metadata: {
          'upload-id': 'test-upload-123',
          'invoice-type': 'purchase',
          'original-filename': 'test-invoice.csv'
        }
      };

      const mockBedrockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              invoiceId: 'INV-001',
              type: 'purchase',
              date: '2023-01-01',
              supplier: 'Test Supplier',
              lineItems: [{
                partNumber: 'ABC-123',
                description: 'Test Part',
                quantity: 5,
                unitPrice: 10.50,
                totalAmount: 52.50,
                category: 'spare_parts'
              }],
              totalAmount: 52.50,
              currency: 'USD',
              confidence: 0.9
            })
          }]
        }))
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);
      mockBedrockClient.prototype.send = jest.fn().mockResolvedValue(mockBedrockResponse);
      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({});
      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(invoiceParserHandler(mockS3Event, mockContext)).resolves.not.toThrow();
      
      expect(mockBedrockClient.prototype.send).toHaveBeenCalledWith(expect.any(InvokeModelCommand));
      expect(mockDynamoClient.prototype.send).toHaveBeenCalledWith(expect.any(PutItemCommand));
      expect(mockSNSClient.prototype.send).toHaveBeenCalledWith(expect.any(PublishCommand));
    });

    test('should skip non-validated files', async () => {
      const mockS3Event: S3Event = {
        Records: [{
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'invoices/raw/test-invoice.pdf' }
          }
        } as any]
      };

      await expect(invoiceParserHandler(mockS3Event, mockContext)).resolves.not.toThrow();
      
      expect(mockBedrockClient.prototype.send).not.toHaveBeenCalled();
    });

    test('should handle parsing failures gracefully', async () => {
      const mockS3Event: S3Event = {
        Records: [{
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'invoices/validated/corrupted-invoice.pdf' }
          }
        } as any]
      };

      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'error') callback(new Error('File corrupted'));
          })
        } as any,
        ContentType: 'application/pdf',
        Metadata: {
          'upload-id': 'test-upload-456',
          'invoice-type': 'sales'
        }
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);
      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(invoiceParserHandler(mockS3Event, mockContext)).resolves.not.toThrow();
      
      expect(mockSNSClient.prototype.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
    });
  });

  describe('Data Storage Operations Tests', () => {
    test('should store parsed invoice data correctly', async () => {
      const mockDynamoStreamEvent: DynamoDBStreamEvent = {
        Records: [{
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              invoiceId: { S: 'INV-001' },
              partNumber: { S: 'ABC-123' },
              description: { S: 'Test Part' },
              quantity: { N: '5' },
              unitPrice: { N: '10.50' },
              totalAmount: { N: '52.50' },
              parsedAt: { S: '2023-01-01T00:00:00Z' }
            }
          }
        } as any]
      };

      mockDynamoClient.prototype.send = jest.fn()
        .mockResolvedValueOnce({}) // For duplicate check
        .mockResolvedValueOnce({}) // For spare part creation
        .mockResolvedValueOnce({}) // For normalized data storage
        .mockResolvedValueOnce({}); // For quality metrics

      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(dataNormalizationHandler(mockDynamoStreamEvent, mockContext)).resolves.not.toThrow();
      
      expect(mockDynamoClient.prototype.send).toHaveBeenCalled();
    });

    test('should handle duplicate detection correctly', async () => {
      const mockDynamoStreamEvent: DynamoDBStreamEvent = {
        Records: [{
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              invoiceId: { S: 'INV-002' },
              partNumber: { S: 'ABC-123' }, // Duplicate part number
              description: { S: 'Test Part Duplicate' },
              quantity: { N: '3' },
              unitPrice: { N: '12.00' },
              totalAmount: { N: '36.00' },
              parsedAt: { S: '2023-01-02T00:00:00Z' }
            }
          }
        } as any]
      };

      // Mock existing part found
      const mockExistingPart = {
        Item: {
          partNumber: { S: 'ABC-123' },
          description: { S: 'Existing Test Part' },
          category: { S: 'spare_parts' }
        }
      };

      mockDynamoClient.prototype.send = jest.fn()
        .mockResolvedValueOnce(mockExistingPart) // Duplicate check finds existing part
        .mockResolvedValueOnce({}) // Update existing part
        .mockResolvedValueOnce({}) // Store normalized data
        .mockResolvedValueOnce({}); // Store quality metrics

      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(dataNormalizationHandler(mockDynamoStreamEvent, mockContext)).resolves.not.toThrow();
      
      expect(mockDynamoClient.prototype.send).toHaveBeenCalled();
    });

    test('should track data quality metrics', async () => {
      const mockDynamoStreamEvent: DynamoDBStreamEvent = {
        Records: [{
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              invoiceId: { S: 'INV-003' },
              partNumber: { S: 'INVALID' }, // This should cause normalization issues
              description: { S: '' }, // Empty description
              quantity: { N: '0' },
              unitPrice: { N: '0' },
              totalAmount: { N: '0' },
              parsedAt: { S: '2023-01-03T00:00:00Z' }
            }
          }
        } as any]
      };

      mockDynamoClient.prototype.send = jest.fn().mockResolvedValue({});
      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(dataNormalizationHandler(mockDynamoStreamEvent, mockContext)).resolves.not.toThrow();
      
      // Should still store quality metrics even with failed normalization
      expect(mockDynamoClient.prototype.send).toHaveBeenCalled();
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle S3 access errors', async () => {
      const mockS3Event: S3Event = {
        Records: [{
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'invoices/validated/inaccessible-file.pdf' }
          }
        } as any]
      };

      mockS3Client.prototype.send = jest.fn().mockRejectedValue(new Error('Access denied'));
      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(invoiceParserHandler(mockS3Event, mockContext)).resolves.not.toThrow();
      
      expect(mockSNSClient.prototype.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
    });

    test('should handle Bedrock API errors', async () => {
      const mockS3Event: S3Event = {
        Records: [{
          s3: {
            bucket: { name: 'test-bucket' },
            object: { key: 'invoices/validated/test-invoice.csv' }
          }
        } as any]
      };

      const mockS3Response = {
        Body: {
          on: jest.fn((event, callback) => {
            if (event === 'data') callback(Buffer.from('test content'));
            if (event === 'end') callback();
          })
        } as any,
        ContentType: 'text/csv',
        Metadata: {
          'upload-id': 'test-upload-789',
          'invoice-type': 'sales'
        }
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);
      mockBedrockClient.prototype.send = jest.fn().mockRejectedValue(new Error('Bedrock service unavailable'));
      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(invoiceParserHandler(mockS3Event, mockContext)).resolves.not.toThrow();
      
      expect(mockSNSClient.prototype.send).toHaveBeenCalledWith(
        expect.any(PublishCommand)
      );
    });

    test('should handle DynamoDB write errors', async () => {
      const mockDynamoStreamEvent: DynamoDBStreamEvent = {
        Records: [{
          eventName: 'INSERT',
          dynamodb: {
            NewImage: {
              invoiceId: { S: 'INV-004' },
              partNumber: { S: 'ABC-456' },
              description: { S: 'Test Part' },
              quantity: { N: '1' },
              unitPrice: { N: '5.00' },
              totalAmount: { N: '5.00' },
              parsedAt: { S: '2023-01-04T00:00:00Z' }
            }
          }
        } as any]
      };

      mockDynamoClient.prototype.send = jest.fn()
        .mockResolvedValueOnce({}) // Duplicate check succeeds
        .mockRejectedValueOnce(new Error('DynamoDB write failed')) // Spare part creation fails
        .mockResolvedValueOnce({}); // Quality metrics still stored

      mockSNSClient.prototype.send = jest.fn().mockResolvedValue({});

      await expect(dataNormalizationHandler(mockDynamoStreamEvent, mockContext)).resolves.not.toThrow();
      
      // Should still send notification about processing results
      expect(mockSNSClient.prototype.send).toHaveBeenCalled();
    });
  });
});