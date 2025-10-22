import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import { InvoiceData, APIResponse } from '../types';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

interface UploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  invoiceType: 'sales' | 'purchase';
}

interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  uploadId: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Invoice upload handler triggered:', JSON.stringify(event, null, 2));

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    if (event.httpMethod === 'POST') {
      return await handleUploadRequest(event, headers);
    }

    if (event.httpMethod === 'GET') {
      return await handleUploadStatus(event, headers);
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error in invoice upload handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

async function handleUploadRequest(
  event: APIGatewayProxyEvent, 
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Request body is required' })
    };
  }

  const uploadRequest: UploadRequest = JSON.parse(event.body);
  
  // Validate request
  const validation = validateUploadRequest(uploadRequest);
  if (!validation.isValid) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: validation.error })
    };
  }

  // Generate unique file key
  const uploadId = crypto.randomUUID();
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedFileName = sanitizeFileName(uploadRequest.fileName);
  const fileKey = `invoices/${uploadRequest.invoiceType}/${timestamp}/${uploadId}/${sanitizedFileName}`;

  try {
    // Create presigned URL for upload
    const putObjectCommand = new PutObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: fileKey,
      ContentType: uploadRequest.mimeType,
      ContentLength: uploadRequest.fileSize,
      Metadata: {
        'upload-id': uploadId,
        'invoice-type': uploadRequest.invoiceType,
        'original-filename': uploadRequest.fileName,
        'upload-timestamp': new Date().toISOString()
      },
      ServerSideEncryption: 'AES256'
    });

    const uploadUrl = await getSignedUrl(s3Client, putObjectCommand, { 
      expiresIn: 3600 // 1 hour
    });

    const response: PresignedUrlResponse = {
      uploadUrl,
      fileKey,
      uploadId
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error creating presigned URL:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create upload URL' })
    };
  }
}

async function handleUploadStatus(
  event: APIGatewayProxyEvent,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  const uploadId = event.queryStringParameters?.uploadId;
  const fileKey = event.queryStringParameters?.fileKey;

  if (!uploadId || !fileKey) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'uploadId and fileKey are required' })
    };
  }

  try {
    // Check if file exists in S3
    const headCommand = new HeadObjectCommand({
      Bucket: INVOICE_BUCKET,
      Key: fileKey
    });

    const response = await s3Client.send(headCommand);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'uploaded',
        fileSize: response.ContentLength,
        lastModified: response.LastModified,
        uploadId
      })
    };

  } catch (error: any) {
    if (error.name === 'NotFound') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'pending',
          uploadId
        })
      };
    }

    console.error('Error checking upload status:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to check upload status' })
    };
  }
}

function validateUploadRequest(request: UploadRequest): { isValid: boolean; error?: string } {
  if (!request.fileName || !request.fileSize || !request.mimeType || !request.invoiceType) {
    return { isValid: false, error: 'Missing required fields: fileName, fileSize, mimeType, invoiceType' };
  }

  if (request.fileSize > MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  if (request.fileSize <= 0) {
    return { isValid: false, error: 'File size must be greater than 0' };
  }

  if (!ALLOWED_MIME_TYPES.includes(request.mimeType)) {
    return { isValid: false, error: `Unsupported file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  if (!['sales', 'purchase'].includes(request.invoiceType)) {
    return { isValid: false, error: 'Invoice type must be either "sales" or "purchase"' };
  }

  return { isValid: true };
}

function sanitizeFileName(fileName: string): string {
  // Remove or replace unsafe characters
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100); // Limit length
}

// Virus scanning placeholder - in production, integrate with AWS GuardDuty or third-party service
function performVirusScan(fileKey: string): Promise<boolean> {
  // Placeholder implementation
  // In production, this would integrate with:
  // - AWS GuardDuty Malware Protection
  // - ClamAV Lambda layer
  // - Third-party scanning service
  console.log(`Virus scan placeholder for file: ${fileKey}`);
  return Promise.resolve(true);
}