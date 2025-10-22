import { S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { FileValidator, DEFAULT_INVOICE_VALIDATION_OPTIONS, FileValidationResult } from '../utils/file-validation';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
const PROCESSED_DATA_BUCKET = process.env.PROCESSED_DATA_BUCKET!;
const ALERTS_TOPIC_ARN = process.env.ALERTS_TOPIC_ARN!;

interface ValidationRecord {
  fileKey: string;
  uploadId: string;
  validationStatus: 'pending' | 'passed' | 'failed';
  validationResults: FileValidationResult;
  timestamp: string;
  invoiceType: string;
  originalFileName: string;
}

export const handler = async (event: S3Event, context: Context): Promise<void> => {
  console.log('Invoice validation handler triggered:', JSON.stringify(event, null, 2));

  const validator = new FileValidator(DEFAULT_INVOICE_VALIDATION_OPTIONS);

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing file: ${key} from bucket: ${bucket}`);

    try {
      // Skip if not an invoice file
      if (!key.startsWith('invoices/')) {
        console.log(`Skipping non-invoice file: ${key}`);
        continue;
      }

      // Get file metadata
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: key
      });

      const response = await s3Client.send(getObjectCommand);
      const metadata = response.Metadata || {};

      const uploadId = metadata['upload-id'];
      const invoiceType = metadata['invoice-type'];
      const originalFileName = metadata['original-filename'];

      if (!uploadId || !invoiceType) {
        console.error(`Missing required metadata for file: ${key}`);
        await handleValidationFailure(key, 'Missing required metadata', uploadId);
        continue;
      }

      // Perform file validation
      console.log(`Validating file: ${key}`);
      const validationResult = await validator.validateFile(bucket, key);

      // Create validation record
      const validationRecord: ValidationRecord = {
        fileKey: key,
        uploadId,
        validationStatus: validationResult.isValid ? 'passed' : 'failed',
        validationResults: validationResult,
        timestamp: new Date().toISOString(),
        invoiceType,
        originalFileName: originalFileName || 'unknown'
      };

      // Store validation results
      await storeValidationRecord(validationRecord);

      if (validationResult.isValid) {
        console.log(`File validation passed for: ${key}`);
        await handleValidationSuccess(key, validationRecord);
      } else {
        console.log(`File validation failed for: ${key}`, validationResult.errors);
        await handleValidationFailure(key, validationResult.errors.join('; '), uploadId);
      }

    } catch (error) {
      console.error(`Error processing file ${key}:`, error);
      await handleValidationFailure(key, `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'unknown');
    }
  }
};

async function handleValidationSuccess(fileKey: string, validationRecord: ValidationRecord): Promise<void> {
  try {
    // Move file to validated folder
    const validatedKey = fileKey.replace('invoices/', 'invoices/validated/');
    
    // Copy to validated location
    const copyCommand = new CopyObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: validatedKey,
      CopySource: `${INVOICE_BUCKET}/${fileKey}`,
      Metadata: {
        'validation-status': 'passed',
        'validation-timestamp': new Date().toISOString(),
        'file-hash': validationRecord.validationResults.fileHash || '',
        'upload-id': validationRecord.uploadId,
        'invoice-type': validationRecord.invoiceType,
        'original-filename': validationRecord.originalFileName
      },
      MetadataDirective: 'REPLACE',
      ServerSideEncryption: 'AES256'
    });

    await s3Client.send(copyCommand);

    // Delete original file
    await s3Client.send(new DeleteObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: fileKey
    }));

    // Send success notification
    await sendNotification({
      subject: 'Invoice File Validation Successful',
      message: `File ${validationRecord.originalFileName} has been successfully validated and is ready for processing.`,
      fileKey: validatedKey,
      uploadId: validationRecord.uploadId,
      status: 'success'
    });

    console.log(`Successfully validated and moved file: ${fileKey} -> ${validatedKey}`);

  } catch (error) {
    console.error('Error handling validation success:', error);
    throw error;
  }
}

async function handleValidationFailure(fileKey: string, errorMessage: string, uploadId: string): Promise<void> {
  try {
    // Move file to quarantine folder
    const quarantineKey = fileKey.replace('invoices/', 'invoices/quarantine/');
    
    // Copy to quarantine location
    const copyCommand = new CopyObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: quarantineKey,
      CopySource: `${INVOICE_BUCKET}/${fileKey}`,
      Metadata: {
        'validation-status': 'failed',
        'validation-error': errorMessage,
        'validation-timestamp': new Date().toISOString(),
        'upload-id': uploadId
      },
      MetadataDirective: 'REPLACE',
      ServerSideEncryption: 'AES256'
    });

    await s3Client.send(copyCommand);

    // Delete original file
    await s3Client.send(new DeleteObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: fileKey
    }));

    // Send failure notification
    await sendNotification({
      subject: 'Invoice File Validation Failed',
      message: `File validation failed for upload ${uploadId}. Error: ${errorMessage}`,
      fileKey: quarantineKey,
      uploadId,
      status: 'failed',
      error: errorMessage
    });

    console.log(`File moved to quarantine: ${fileKey} -> ${quarantineKey}`);

  } catch (error) {
    console.error('Error handling validation failure:', error);
    throw error;
  }
}

async function storeValidationRecord(record: ValidationRecord): Promise<void> {
  try {
    // Store in DynamoDB for audit trail
    const putCommand = new PutItemCommand({
      TableName: 'FileValidationRecords',
      Item: {
        uploadId: { S: record.uploadId },
        fileKey: { S: record.fileKey },
        validationStatus: { S: record.validationStatus },
        timestamp: { S: record.timestamp },
        invoiceType: { S: record.invoiceType },
        originalFileName: { S: record.originalFileName },
        validationErrors: { SS: record.validationResults.errors.length > 0 ? record.validationResults.errors : ['none'] },
        validationWarnings: { SS: record.validationResults.warnings.length > 0 ? record.validationResults.warnings : ['none'] },
        fileHash: { S: record.validationResults.fileHash || '' },
        detectedMimeType: { S: record.validationResults.detectedMimeType || '' }
      }
    });

    await dynamoClient.send(putCommand);
    console.log(`Stored validation record for upload: ${record.uploadId}`);

  } catch (error) {
    console.error('Error storing validation record:', error);
    // Don't throw - validation record storage failure shouldn't stop the process
  }
}

async function sendNotification(notification: {
  subject: string;
  message: string;
  fileKey: string;
  uploadId: string;
  status: 'success' | 'failed';
  error?: string;
}): Promise<void> {
  try {
    const message = {
      default: notification.message,
      email: `
Subject: ${notification.subject}

${notification.message}

Details:
- Upload ID: ${notification.uploadId}
- File Location: ${notification.fileKey}
- Status: ${notification.status}
${notification.error ? `- Error: ${notification.error}` : ''}
- Timestamp: ${new Date().toISOString()}
      `.trim()
    };

    const publishCommand = new PublishCommand({
      TopicArn: ALERTS_TOPIC_ARN,
      Message: JSON.stringify(message),
      MessageStructure: 'json',
      Subject: notification.subject,
      MessageAttributes: {
        'notification-type': {
          DataType: 'String',
          StringValue: 'file-validation'
        },
        'status': {
          DataType: 'String',
          StringValue: notification.status
        },
        'upload-id': {
          DataType: 'String',
          StringValue: notification.uploadId
        }
      }
    });

    await snsClient.send(publishCommand);
    console.log(`Sent notification for upload: ${notification.uploadId}`);

  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notification failure shouldn't stop the process
  }
}