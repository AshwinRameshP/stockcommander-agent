import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fileHash?: string;
  detectedMimeType?: string;
}

export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  performVirusScan: boolean;
  calculateHash: boolean;
}

export class FileValidator {
  private options: FileValidationOptions;

  constructor(options: FileValidationOptions) {
    this.options = options;
  }

  async validateFile(bucket: string, key: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Get file metadata and content
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(getObjectCommand);
      
      if (!response.Body) {
        result.isValid = false;
        result.errors.push('File content is empty or inaccessible');
        return result;
      }

      // Validate file size
      const fileSize = response.ContentLength || 0;
      if (fileSize > this.options.maxSizeBytes) {
        result.isValid = false;
        result.errors.push(`File size ${fileSize} exceeds maximum allowed size ${this.options.maxSizeBytes}`);
      }

      // Validate MIME type
      const contentType = response.ContentType || '';
      if (!this.options.allowedMimeTypes.includes(contentType)) {
        result.isValid = false;
        result.errors.push(`MIME type ${contentType} is not allowed`);
      }

      // Read file content for further validation
      const fileBuffer = await this.streamToBuffer(response.Body as NodeJS.ReadableStream);

      // Detect actual MIME type from file content
      const detectedMimeType = this.detectMimeType(fileBuffer);
      result.detectedMimeType = detectedMimeType || undefined;

      // Check if declared MIME type matches detected type
      if (detectedMimeType && detectedMimeType !== contentType) {
        result.warnings.push(`Declared MIME type ${contentType} differs from detected type ${detectedMimeType}`);
      }

      // Calculate file hash if requested
      if (this.options.calculateHash) {
        result.fileHash = this.calculateSHA256(fileBuffer);
      }

      // Perform virus scan if requested
      if (this.options.performVirusScan) {
        const scanResult = await this.performVirusScan(fileBuffer, key);
        if (!scanResult.isClean) {
          result.isValid = false;
          result.errors.push(`Virus scan failed: ${scanResult.threat || 'Unknown threat detected'}`);
        }
      }

      // Additional file format validation
      const formatValidation = this.validateFileFormat(fileBuffer, detectedMimeType);
      if (!formatValidation.isValid) {
        result.errors.push(...formatValidation.errors);
        result.warnings.push(...formatValidation.warnings);
      }

    } catch (error) {
      console.error('Error validating file:', error);
      result.isValid = false;
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(new Uint8Array(chunk)));
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private detectMimeType(buffer: Buffer): string | null {
    // Check file signatures (magic numbers)
    const signatures: { [key: string]: string } = {
      'application/pdf': '25504446', // %PDF
      'image/jpeg': 'FFD8FF',
      'image/png': '89504E47',
      'image/tiff': '49492A00', // TIFF little-endian
      'application/zip': '504B0304', // ZIP (includes Excel files)
    };

    const header = buffer.subarray(0, 8).toString('hex').toUpperCase();
    
    for (const [mimeType, signature] of Object.entries(signatures)) {
      if (header.startsWith(signature)) {
        return mimeType;
      }
    }

    // Check for Excel files (which are ZIP-based)
    if (header.startsWith('504B0304')) {
      // Additional checks for Excel files could be added here
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    return null;
  }

  private calculateSHA256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(new Uint8Array(buffer)).digest('hex');
  }

  private async performVirusScan(buffer: Buffer, fileKey: string): Promise<{ isClean: boolean; threat?: string }> {
    // Placeholder implementation for virus scanning
    // In production, this would integrate with:
    // 1. AWS GuardDuty Malware Protection
    // 2. ClamAV Lambda layer
    // 3. Third-party scanning service API
    
    console.log(`Performing virus scan for file: ${fileKey}`);
    
    // Simple heuristic checks (not a real antivirus)
    const suspiciousPatterns = [
      Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'), // EICAR test string
    ];

    for (const pattern of suspiciousPatterns) {
      if (buffer.includes(pattern)) {
        return { isClean: false, threat: 'Test virus signature detected' };
      }
    }

    // In production, you would call an actual antivirus service here
    // Example with ClamAV:
    // const clamAV = new ClamAVService();
    // return await clamAV.scanBuffer(buffer);

    return { isClean: true };
  }

  private validateFileFormat(buffer: Buffer, mimeType: string | null): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };

    if (!mimeType) {
      result.warnings.push('Could not detect file format');
      return result;
    }

    try {
      switch (mimeType) {
        case 'application/pdf':
          return this.validatePDF(buffer);
        case 'image/jpeg':
          return this.validateJPEG(buffer);
        case 'image/png':
          return this.validatePNG(buffer);
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
          return this.validateExcel(buffer);
        default:
          result.warnings.push(`No specific validation available for ${mimeType}`);
      }
    } catch (error) {
      result.errors.push(`Format validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.isValid = false;
    }

    return result;
  }

  private validatePDF(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };
    
    // Check PDF header
    if (!buffer.subarray(0, 4).equals(new Uint8Array(Buffer.from('%PDF')))) {
      result.isValid = false;
      result.errors.push('Invalid PDF header');
    }

    // Check for PDF trailer
    const trailer = buffer.subarray(-1024).toString('ascii');
    if (!trailer.includes('%%EOF')) {
      result.warnings.push('PDF trailer not found - file may be corrupted');
    }

    return result;
  }

  private validateJPEG(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };
    
    // Check JPEG markers
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      result.isValid = false;
      result.errors.push('Invalid JPEG header');
    }

    // Check for end marker
    const end = buffer.subarray(-2);
    if (end[0] !== 0xFF || end[1] !== 0xD9) {
      result.warnings.push('JPEG end marker not found - file may be corrupted');
    }

    return result;
  }

  private validatePNG(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };
    
    // Check PNG signature
    const pngSignature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    if (!buffer.subarray(0, 8).equals(pngSignature)) {
      result.isValid = false;
      result.errors.push('Invalid PNG signature');
    }

    return result;
  }

  private validateExcel(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
    const result: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };
    
    // Excel files are ZIP archives, so check ZIP signature
    if (!buffer.subarray(0, 4).equals(new Uint8Array([0x50, 0x4B, 0x03, 0x04]))) {
      result.isValid = false;
      result.errors.push('Invalid Excel file format (not a valid ZIP archive)');
    }

    return result;
  }
}

// Default validation options for invoice files
export const DEFAULT_INVOICE_VALIDATION_OPTIONS: FileValidationOptions = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  performVirusScan: true,
  calculateHash: true
};