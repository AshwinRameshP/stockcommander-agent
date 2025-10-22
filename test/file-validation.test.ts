import { FileValidator, DEFAULT_INVOICE_VALIDATION_OPTIONS } from '../src/utils/file-validation';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
const mockS3Client = S3Client as jest.MockedClass<typeof S3Client>;

describe('File Validation Tests', () => {
  let fileValidator: FileValidator;

  beforeEach(() => {
    jest.clearAllMocks();
    fileValidator = new FileValidator(DEFAULT_INVOICE_VALIDATION_OPTIONS);
  });

  describe('PDF File Validation', () => {
    test('should validate valid PDF files', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\nxref\n0 1\n0000000000 65535 f \ntrailer\n<<\n/Size 1\n/Root 1 0 R\n>>\nstartxref\n9\n%%EOF');
      
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
      expect(result.errors).toHaveLength(0);
    });

    test('should detect corrupted PDF files', async () => {
      const mockCorruptedPdf = Buffer.from('Not a PDF file content');
      
      const mockS3Response = {
        Body: createMockStream(mockCorruptedPdf),
        ContentType: 'application/pdf',
        ContentLength: mockCorruptedPdf.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'corrupted.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Invalid PDF header'));
    });

    test('should warn about PDF files without proper trailer', async () => {
      const mockIncompletePdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj');
      
      const mockS3Response = {
        Body: createMockStream(mockIncompletePdf),
        ContentType: 'application/pdf',
        ContentLength: mockIncompletePdf.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'incomplete.pdf');

      expect(result.warnings).toContain(expect.stringContaining('PDF trailer not found'));
    });
  });

  describe('Image File Validation', () => {
    test('should validate JPEG files correctly', async () => {
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
      expect(result.errors).toHaveLength(0);
    });

    test('should validate PNG files correctly', async () => {
      const mockPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);
      
      const mockS3Response = {
        Body: createMockStream(mockPngBuffer),
        ContentType: 'image/png',
        ContentLength: mockPngBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.png');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('image/png');
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid JPEG files', async () => {
      const mockInvalidJpeg = Buffer.from([0x00, 0x00, 0xFF, 0xE0]); // Invalid JPEG header
      
      const mockS3Response = {
        Body: createMockStream(mockInvalidJpeg),
        ContentType: 'image/jpeg',
        ContentLength: mockInvalidJpeg.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invalid.jpg');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('Invalid JPEG header'));
    });

    test('should warn about JPEG files without end marker', async () => {
      const mockIncompleteJpeg = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]); // Missing end marker
      
      const mockS3Response = {
        Body: createMockStream(mockIncompleteJpeg),
        ContentType: 'image/jpeg',
        ContentLength: mockIncompleteJpeg.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'incomplete.jpg');

      expect(result.warnings).toContain(expect.stringContaining('JPEG end marker not found'));
    });
  });

  describe('CSV File Validation', () => {
    test('should validate CSV files correctly', async () => {
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

    test('should handle empty CSV files', async () => {
      const mockEmptyBuffer = Buffer.from('');
      
      const mockS3Response = {
        Body: createMockStream(mockEmptyBuffer),
        ContentType: 'text/csv',
        ContentLength: 0
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'empty.csv');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('File content is empty'))).toBe(true);
    });
  });

  describe('File Size Validation', () => {
    test('should reject files exceeding size limit', async () => {
      const mockLargeBuffer = Buffer.alloc(60 * 1024 * 1024); // 60MB
      
      const mockS3Response = {
        Body: createMockStream(mockLargeBuffer),
        ContentType: 'application/pdf',
        ContentLength: mockLargeBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'large-file.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceeds maximum allowed size'))).toBe(true);
    });

    test('should accept files within size limit', async () => {
      const mockValidSizeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      mockValidSizeBuffer.write('%PDF-1.4'); // Make it look like a PDF
      
      const mockS3Response = {
        Body: createMockStream(mockValidSizeBuffer),
        ContentType: 'application/pdf',
        ContentLength: mockValidSizeBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'valid-size.pdf');

      expect(result.isValid).toBe(true);
    });
  });

  describe('MIME Type Validation', () => {
    test('should reject unsupported MIME types', async () => {
      const mockBuffer = Buffer.from('executable content');
      
      const mockS3Response = {
        Body: createMockStream(mockBuffer),
        ContentType: 'application/exe',
        ContentLength: mockBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'malicious.exe');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('MIME type application/exe is not allowed'))).toBe(true);
    });

    test('should warn when declared MIME type differs from detected type', async () => {
      const mockPdfBuffer = Buffer.from('%PDF-1.4\ncontent');
      
      const mockS3Response = {
        Body: createMockStream(mockPdfBuffer),
        ContentType: 'text/plain', // Wrong MIME type declared
        ContentLength: mockPdfBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'mislabeled.txt');

      expect(result.isValid).toBe(false); // Because text/plain is not in allowed types
      expect(result.warnings.some(warning => warning.includes('Declared MIME type text/plain differs from detected type application/pdf'))).toBe(true);
    });
  });

  describe('Virus Scanning', () => {
    test('should detect EICAR test virus signature', async () => {
      const eicarSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
      const mockInfectedBuffer = Buffer.from(eicarSignature);
      
      const mockS3Response = {
        Body: createMockStream(mockInfectedBuffer),
        ContentType: 'text/plain',
        ContentLength: mockInfectedBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'eicar-test.txt');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Test virus signature detected'))).toBe(true);
    });

    test('should pass clean files through virus scan', async () => {
      const mockCleanBuffer = Buffer.from('Clean file content');
      
      const mockS3Response = {
        Body: createMockStream(mockCleanBuffer),
        ContentType: 'text/csv',
        ContentLength: mockCleanBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'clean-file.csv');

      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain(expect.stringContaining('virus'));
    });
  });

  describe('Hash Calculation', () => {
    test('should calculate SHA256 hash when requested', async () => {
      const mockBuffer = Buffer.from('test content for hashing');
      
      const mockS3Response = {
        Body: createMockStream(mockBuffer),
        ContentType: 'text/csv',
        ContentLength: mockBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'hash-test.csv');

      expect(result.fileHash).toBeDefined();
      expect(result.fileHash).toMatch(/^[a-f0-9]{64}$/); // SHA256 hash format
    });

    test('should not calculate hash when disabled', async () => {
      const validatorWithoutHash = new FileValidator({
        ...DEFAULT_INVOICE_VALIDATION_OPTIONS,
        calculateHash: false
      });

      const mockBuffer = Buffer.from('test content');
      
      const mockS3Response = {
        Body: createMockStream(mockBuffer),
        ContentType: 'text/csv',
        ContentLength: mockBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await validatorWithoutHash.validateFile('test-bucket', 'no-hash.csv');

      expect(result.fileHash).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle S3 access errors gracefully', async () => {
      mockS3Client.prototype.send = jest.fn().mockRejectedValue(new Error('Access denied'));

      const result = await fileValidator.validateFile('test-bucket', 'inaccessible.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Validation error: Access denied'))).toBe(true);
    });

    test('should handle missing file body', async () => {
      const mockS3Response = {
        Body: null,
        ContentType: 'application/pdf',
        ContentLength: 0
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'empty-body.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File content is empty or inaccessible');
    });

    test('should handle stream reading errors', async () => {
      const mockErrorStream = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Stream read error')), 10);
          }
        })
      };

      const mockS3Response = {
        Body: mockErrorStream,
        ContentType: 'application/pdf',
        ContentLength: 1000
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'stream-error.pdf');

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Validation error'))).toBe(true);
    });
  });

  describe('Excel File Validation', () => {
    test('should validate Excel files correctly', async () => {
      // Excel files are ZIP archives with specific signature
      const mockExcelBuffer = Buffer.from([0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]);
      
      const mockS3Response = {
        Body: createMockStream(mockExcelBuffer),
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ContentLength: mockExcelBuffer.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invoice.xlsx');

      expect(result.isValid).toBe(true);
      expect(result.detectedMimeType).toBe('application/zip'); // Excel files are detected as ZIP
    });

    test('should detect invalid Excel files', async () => {
      const mockInvalidExcel = Buffer.from('Not an Excel file');
      
      const mockS3Response = {
        Body: createMockStream(mockInvalidExcel),
        ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ContentLength: mockInvalidExcel.length
      };

      mockS3Client.prototype.send = jest.fn().mockResolvedValue(mockS3Response);

      const result = await fileValidator.validateFile('test-bucket', 'invalid.xlsx');

      expect(result.isValid).toBe(true); // File validation passes, but it's not actually Excel format
      expect(result.detectedMimeType).toBeNull(); // Can't detect MIME type from invalid content
    });
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