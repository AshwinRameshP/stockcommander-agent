import { S3Event, Context } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { InvoiceData, LineItem } from '../types';
import { BedrockPromptBuilder } from '../utils/bedrock-prompts';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const INVOICE_BUCKET = process.env.INVOICE_BUCKET!;
const PROCESSED_DATA_BUCKET = process.env.PROCESSED_DATA_BUCKET!;
const ALERTS_TOPIC_ARN = process.env.ALERTS_TOPIC_ARN!;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-sonnet-20240229-v1:0';

interface ParsedInvoiceData {
  invoiceId: string;
  type: 'sales' | 'purchase';
  date: string;
  supplier?: string;
  customer?: string;
  lineItems: LineItem[];
  totalAmount: number;
  currency: string;
  confidence: number;
  extractedText: string;
}

interface ParsingResult {
  success: boolean;
  data?: ParsedInvoiceData;
  error?: string;
  confidence: number;
}

export const handler = async (event: S3Event, context: Context): Promise<void> => {
  console.log('Invoice parser handler triggered:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing validated invoice: ${key} from bucket: ${bucket}`);

    try {
      // Skip if not a validated invoice file
      if (!key.startsWith('invoices/validated/')) {
        console.log(`Skipping non-validated invoice file: ${key}`);
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
      const invoiceType = metadata['invoice-type'] as 'sales' | 'purchase';
      const originalFileName = metadata['original-filename'];

      if (!uploadId || !invoiceType) {
        console.error(`Missing required metadata for file: ${key}`);
        await handleParsingFailure(key, 'Missing required metadata', uploadId);
        continue;
      }

      // Parse the invoice using Bedrock
      console.log(`Parsing invoice: ${key}`);
      const parsingResult = await parseInvoiceWithBedrock(bucket, key, invoiceType);

      if (parsingResult.success && parsingResult.data) {
        console.log(`Invoice parsing successful for: ${key}`);
        await handleParsingSuccess(key, parsingResult.data, uploadId, originalFileName);
      } else {
        console.log(`Invoice parsing failed for: ${key}`, parsingResult.error);
        await handleParsingFailure(key, parsingResult.error || 'Unknown parsing error', uploadId);
      }

    } catch (error) {
      console.error(`Error processing invoice ${key}:`, error);
      await handleParsingFailure(key, `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'unknown');
    }
  }
};

async function parseInvoiceWithBedrock(bucket: string, key: string, invoiceType: 'sales' | 'purchase'): Promise<ParsingResult> {
  try {
    // Get the file content
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });

    const response = await s3Client.send(getObjectCommand);
    
    if (!response.Body) {
      return { success: false, error: 'File content is empty', confidence: 0 };
    }

    // For now, we'll handle text-based files (CSV, etc.) directly
    // For PDFs and images, you would need to use Amazon Textract first
    const contentType = response.ContentType || '';
    let extractedText = '';

    if (contentType.includes('text/') || contentType.includes('csv')) {
      const buffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);
      extractedText = buffer.toString('utf-8');
    } else {
      // For PDF/image files, integrate with Amazon Textract
      extractedText = await extractTextWithTextract(bucket, key);
    }

    // Create the prompt for Bedrock using the prompt builder
    const prompt = BedrockPromptBuilder.getPromptForInvoiceType(invoiceType, extractedText);

    // Call Bedrock Claude model
    const invokeCommand = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const bedrockResponse = await bedrockClient.send(invokeCommand);
    const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));

    // Parse the response
    const parsedData = parseBedrockResponse(responseBody.content[0].text, invoiceType, extractedText);
    
    return {
      success: true,
      data: parsedData,
      confidence: parsedData.confidence
    };

  } catch (error) {
    console.error('Error parsing invoice with Bedrock:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      confidence: 0
    };
  }
}



function parseBedrockResponse(responseText: string, invoiceType: 'sales' | 'purchase', extractedText: string): ParsedInvoiceData {
  try {
    // Clean the response text to extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Bedrock response');
    }

    const parsedJson = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize the data
    const invoiceData: ParsedInvoiceData = {
      invoiceId: parsedJson.invoiceId || `INV-${Date.now()}`,
      type: invoiceType,
      date: parsedJson.date || new Date().toISOString().split('T')[0],
      supplier: invoiceType === 'purchase' ? parsedJson.supplier : undefined,
      customer: invoiceType === 'sales' ? parsedJson.customer : undefined,
      lineItems: validateLineItems(parsedJson.lineItems || []),
      totalAmount: parseFloat(parsedJson.totalAmount) || 0,
      currency: parsedJson.currency || 'USD',
      confidence: Math.min(Math.max(parseFloat(parsedJson.confidence) || 0.5, 0), 1),
      extractedText: extractedText.substring(0, 5000) // Limit size for storage
    };

    // Validate that we have at least some meaningful data
    if (!invoiceData.lineItems.length && invoiceData.totalAmount === 0) {
      invoiceData.confidence = Math.min(invoiceData.confidence, 0.3);
    }

    return invoiceData;

  } catch (error) {
    console.error('Error parsing Bedrock response:', error);
    
    // Return a minimal structure with low confidence
    return {
      invoiceId: `INV-${Date.now()}`,
      type: invoiceType,
      date: new Date().toISOString().split('T')[0],
      supplier: invoiceType === 'purchase' ? 'Unknown' : undefined,
      customer: invoiceType === 'sales' ? 'Unknown' : undefined,
      lineItems: [],
      totalAmount: 0,
      currency: 'USD',
      confidence: 0.1,
      extractedText: extractedText.substring(0, 5000)
    };
  }
}

function validateLineItems(items: any[]): LineItem[] {
  return items
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      partNumber: String(item.partNumber || item.sku || item.itemNumber || 'UNKNOWN'),
      description: String(item.description || item.name || 'No description'),
      quantity: Math.max(parseFloat(item.quantity) || 0, 0),
      unitPrice: Math.max(parseFloat(item.unitPrice) || 0, 0),
      totalAmount: Math.max(parseFloat(item.totalAmount) || (parseFloat(item.quantity) * parseFloat(item.unitPrice)) || 0, 0),
      category: item.category ? String(item.category) : undefined
    }))
    .filter(item => item.quantity > 0 || item.totalAmount > 0); // Keep items with meaningful data
}

async function extractTextWithTextract(bucket: string, key: string): Promise<string> {
  // Placeholder for Amazon Textract integration
  // In production, you would use Amazon Textract to extract text from PDFs and images
  console.log(`Textract extraction placeholder for: ${key}`);
  
  // For now, return a placeholder message
  return `[Textract extraction would be performed here for file: ${key}]`;
  
  // Example Textract integration:
  /*
  const textractClient = new TextractClient({ region: process.env.AWS_REGION });
  
  const command = new DetectDocumentTextCommand({
    Document: {
      S3Object: {
        Bucket: bucket,
        Name: key
      }
    }
  });
  
  const response = await textractClient.send(command);
  
  return response.Blocks
    ?.filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .join('\n') || '';
  */
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk) => chunks.push(new Uint8Array(chunk)));
    stream.on('error', (err) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

async function handleParsingSuccess(
  fileKey: string, 
  parsedData: ParsedInvoiceData, 
  uploadId: string, 
  originalFileName?: string
): Promise<void> {
  try {
    // Store parsed data in DynamoDB
    await storeParsedInvoiceData(parsedData, fileKey, uploadId);

    // Send success notification
    await sendNotification({
      subject: 'Invoice Parsing Successful',
      message: `Invoice ${parsedData.invoiceId} has been successfully parsed. Found ${parsedData.lineItems.length} line items with confidence ${(parsedData.confidence * 100).toFixed(1)}%.`,
      fileKey,
      uploadId,
      status: 'success',
      invoiceId: parsedData.invoiceId,
      confidence: parsedData.confidence
    });

    console.log(`Successfully parsed invoice: ${fileKey} -> ${parsedData.invoiceId}`);

  } catch (error) {
    console.error('Error handling parsing success:', error);
    throw error;
  }
}

async function handleParsingFailure(fileKey: string, errorMessage: string, uploadId: string): Promise<void> {
  try {
    // Send failure notification
    await sendNotification({
      subject: 'Invoice Parsing Failed',
      message: `Invoice parsing failed for upload ${uploadId}. Error: ${errorMessage}`,
      fileKey,
      uploadId,
      status: 'failed',
      error: errorMessage
    });

    console.log(`Invoice parsing failed: ${fileKey} - ${errorMessage}`);

  } catch (error) {
    console.error('Error handling parsing failure:', error);
    throw error;
  }
}

async function storeParsedInvoiceData(
  parsedData: ParsedInvoiceData, 
  fileKey: string, 
  uploadId: string
): Promise<void> {
  try {
    const item: Record<string, any> = {
      invoiceId: { S: parsedData.invoiceId },
      uploadId: { S: uploadId },
      fileKey: { S: fileKey },
      type: { S: parsedData.type },
      date: { S: parsedData.date },
      totalAmount: { N: parsedData.totalAmount.toString() },
      currency: { S: parsedData.currency },
      confidence: { N: parsedData.confidence.toString() },
      lineItemsCount: { N: parsedData.lineItems.length.toString() },
      status: { S: 'parsed' },
      parsedAt: { S: new Date().toISOString() },
      ttl: { N: Math.floor((Date.now() + (365 * 24 * 60 * 60 * 1000)) / 1000).toString() } // 1 year TTL
    };

    // Add optional fields only if they exist
    if (parsedData.supplier) {
      item.supplier = { S: parsedData.supplier };
    }
    if (parsedData.customer) {
      item.customer = { S: parsedData.customer };
    }

    const putCommand = new PutItemCommand({
      TableName: 'ParsedInvoices',
      Item: item
    });

    await dynamoClient.send(putCommand);

    // Store line items separately for better querying
    for (let i = 0; i < parsedData.lineItems.length; i++) {
      const lineItem = parsedData.lineItems[i];
      const lineItemData: Record<string, any> = {
        invoiceId: { S: parsedData.invoiceId },
        lineItemIndex: { N: i.toString() },
        partNumber: { S: lineItem.partNumber },
        description: { S: lineItem.description },
        quantity: { N: lineItem.quantity.toString() },
        unitPrice: { N: lineItem.unitPrice.toString() },
        totalAmount: { N: lineItem.totalAmount.toString() },
        parsedAt: { S: new Date().toISOString() }
      };

      // Add optional category if it exists
      if (lineItem.category) {
        lineItemData.category = { S: lineItem.category };
      }

      const lineItemCommand = new PutItemCommand({
        TableName: 'InvoiceLineItems',
        Item: lineItemData
      });

      await dynamoClient.send(lineItemCommand);
    }

    console.log(`Stored parsed invoice data: ${parsedData.invoiceId}`);

  } catch (error) {
    console.error('Error storing parsed invoice data:', error);
    throw error;
  }
}

async function sendNotification(notification: {
  subject: string;
  message: string;
  fileKey: string;
  uploadId: string;
  status: 'success' | 'failed';
  error?: string;
  invoiceId?: string;
  confidence?: number;
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
${notification.invoiceId ? `- Invoice ID: ${notification.invoiceId}` : ''}
${notification.confidence ? `- Confidence: ${(notification.confidence * 100).toFixed(1)}%` : ''}
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
          StringValue: 'invoice-parsing'
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
    console.log(`Sent parsing notification for upload: ${notification.uploadId}`);

  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notification failure shouldn't stop the process
  }
}