import { DynamoDBStreamEvent, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SparePart, LineItem, NormalizedInvoiceData, DataQualityMetrics, DuplicateDetectionResult } from '../types';
import { DataNormalizer, NormalizationResult } from '../utils/data-normalizer';
import { DuplicateDetector } from '../utils/duplicate-detector';
import { DataStorageService } from '../utils/data-storage-service';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

const SPARE_PARTS_TABLE = process.env.SPARE_PARTS_TABLE!;
const ALERTS_TOPIC_ARN = process.env.ALERTS_TOPIC_ARN!;

interface ProcessingResult {
  success: boolean;
  processedItems: number;
  duplicatesFound: number;
  errors: string[];
  warnings: string[];
  qualityScores: number[];
  processingTimeMs: number;
  errorTypes: Record<string, number>;
  warningTypes: Record<string, number>;
}

export const handler = async (event: DynamoDBStreamEvent, context: Context): Promise<void> => {
  console.log('Data normalization handler triggered:', JSON.stringify(event, null, 2));
  
  const startTime = Date.now();
  const normalizer = new DataNormalizer();
  const duplicateDetector = new DuplicateDetector(dynamoClient);
  const storageService = new DataStorageService(dynamoClient);
  
  let totalProcessed = 0;
  let totalDuplicates = 0;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  const qualityScores: number[] = [];
  const errorTypes: Record<string, number> = {};
  const warningTypes: Record<string, number> = {};
  const normalizedDataBatch: NormalizedInvoiceData[] = [];

  for (const record of event.Records) {
    try {
      // Only process INSERT events from InvoiceLineItems table
      if (record.eventName !== 'INSERT' || !record.dynamodb?.NewImage) {
        continue;
      }

      const newImage = record.dynamodb.NewImage;
      
      // Check if this is from the InvoiceLineItems table
      if (!newImage.invoiceId || !newImage.partNumber) {
        console.log('Skipping record - not an invoice line item');
        continue;
      }

      console.log(`Processing line item: ${newImage.partNumber?.S} from invoice ${newImage.invoiceId?.S}`);

      // Convert DynamoDB record to LineItem
      const lineItem: LineItem = {
        partNumber: newImage.partNumber?.S || '',
        description: newImage.description?.S || '',
        quantity: parseFloat(newImage.quantity?.N || '0'),
        unitPrice: parseFloat(newImage.unitPrice?.N || '0'),
        totalAmount: parseFloat(newImage.totalAmount?.N || '0'),
        category: newImage.category?.S
      };

      // Normalize the line item data
      const normalizationResult = await normalizer.normalizeLineItem(lineItem);
      
      if (!normalizationResult.success) {
        const errorMsg = `Normalization failed for ${lineItem.partNumber}: ${normalizationResult.errors.join(', ')}`;
        allErrors.push(errorMsg);
        
        // Track error types
        for (const error of normalizationResult.errors) {
          const errorType = categorizeError(error);
          errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        }
        continue;
      }

      // Track quality score
      qualityScores.push(normalizationResult.confidence);

      // Check for duplicates
      const duplicateCheck = await duplicateDetector.checkForDuplicates(normalizationResult.normalizedData!);
      
      // Store duplicate detection result
      const duplicateResult: DuplicateDetectionResult = {
        partNumber: lineItem.partNumber,
        detectionTimestamp: new Date().toISOString(),
        isDuplicate: duplicateCheck.isDuplicate,
        existingPartNumber: duplicateCheck.existingPartNumber,
        similarParts: duplicateCheck.similarParts,
        confidence: duplicateCheck.confidence,
        action: duplicateCheck.isDuplicate ? 'merged' : 'created'
      };
      
      await storageService.storeDuplicateDetectionResult(duplicateResult);
      
      if (duplicateCheck.isDuplicate) {
        console.log(`Duplicate detected for part ${lineItem.partNumber}, updating existing record`);
        await updateExistingSparePart(duplicateCheck.existingPartNumber!, normalizationResult.normalizedData!);
        totalDuplicates++;
      } else {
        console.log(`Creating new spare part record for ${lineItem.partNumber}`);
        await createNewSparePart(normalizationResult.normalizedData!);
      }

      // Create normalized invoice data record
      const normalizedInvoiceData: NormalizedInvoiceData = {
        partNumber: normalizationResult.normalizedData!.partNumber,
        invoiceDate: newImage.parsedAt?.S || new Date().toISOString().split('T')[0],
        invoiceId: newImage.invoiceId?.S || '',
        invoiceType: determineInvoiceType(newImage),
        supplierId: newImage.supplierId?.S,
        customerId: newImage.customerId?.S,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice,
        totalAmount: lineItem.totalAmount,
        currency: newImage.currency?.S || 'USD',
        normalizedDescription: normalizationResult.normalizedData!.description,
        originalDescription: lineItem.description,
        category: normalizationResult.normalizedData!.category,
        unitOfMeasure: normalizationResult.normalizedData!.unitOfMeasure,
        qualityScore: normalizationResult.confidence,
        normalizationTimestamp: new Date().toISOString(),
        dataSource: 'invoice-parsing'
      };

      normalizedDataBatch.push(normalizedInvoiceData);

      totalProcessed++;
      allWarnings.push(...normalizationResult.warnings);
      
      // Track warning types
      for (const warning of normalizationResult.warnings) {
        const warningType = categorizeWarning(warning);
        warningTypes[warningType] = (warningTypes[warningType] || 0) + 1;
      }

    } catch (error) {
      console.error('Error processing record:', error);
      allErrors.push(`Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Store normalized data in batch
  if (normalizedDataBatch.length > 0) {
    const storageResult = await storageService.storeNormalizedInvoiceData(normalizedDataBatch);
    if (!storageResult.success) {
      allErrors.push(...storageResult.errors);
    }
  }

  const processingTimeMs = Date.now() - startTime;

  // Store data quality metrics
  const qualityMetrics: DataQualityMetrics = {
    metricType: 'normalization',
    timestamp: new Date().toISOString(),
    totalRecords: event.Records.length,
    successfulRecords: totalProcessed,
    failedRecords: event.Records.length - totalProcessed,
    duplicatesFound: totalDuplicates,
    averageQualityScore: qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0,
    errorTypes,
    warningTypes,
    processingTimeMs
  };

  await storageService.storeDataQualityMetrics(qualityMetrics);

  // Send summary notification
  await sendProcessingSummary({
    success: allErrors.length === 0,
    processedItems: totalProcessed,
    duplicatesFound: totalDuplicates,
    errors: allErrors,
    warnings: allWarnings,
    qualityScores,
    processingTimeMs,
    errorTypes,
    warningTypes
  });

  console.log(`Data normalization complete. Processed: ${totalProcessed}, Duplicates: ${totalDuplicates}, Errors: ${allErrors.length}, Avg Quality: ${qualityMetrics.averageQualityScore.toFixed(2)}`);
};

async function createNewSparePart(normalizedData: SparePart): Promise<void> {
  try {
    const putCommand = new PutItemCommand({
      TableName: SPARE_PARTS_TABLE,
      Item: {
        partNumber: { S: normalizedData.partNumber },
        description: { S: normalizedData.description },
        category: { S: normalizedData.category },
        unitOfMeasure: { S: normalizedData.unitOfMeasure },
        currentStock: { N: normalizedData.currentStock.toString() },
        safetyStock: { N: normalizedData.safetyStock.toString() },
        reorderPoint: { N: normalizedData.reorderPoint.toString() },
        leadTimeDays: { N: normalizedData.leadTimeDays.toString() },
        lastUpdated: { S: normalizedData.lastUpdated.toISOString() },
        isActive: { BOOL: normalizedData.isActive },
        // Additional metadata
        createdAt: { S: new Date().toISOString() },
        createdBy: { S: 'data-normalization-system' },
        dataSource: { S: 'invoice-parsing' },
        qualityScore: { N: '0.8' } // Default quality score for new parts
      },
      ConditionExpression: 'attribute_not_exists(partNumber)' // Prevent overwriting existing parts
    });

    await dynamoClient.send(putCommand);
    console.log(`Created new spare part: ${normalizedData.partNumber}`);

  } catch (error) {
    console.error('Error creating spare part:', error);
    throw error;
  }
}

async function updateExistingSparePart(existingPartNumber: string, normalizedData: SparePart): Promise<void> {
  try {
    // Get the existing record first
    const getCommand = new GetItemCommand({
      TableName: SPARE_PARTS_TABLE,
      Key: {
        partNumber: { S: existingPartNumber }
      }
    });

    const existingRecord = await dynamoClient.send(getCommand);
    
    if (!existingRecord.Item) {
      throw new Error(`Existing part ${existingPartNumber} not found`);
    }

    // Update with new information, preserving existing stock levels
    const updateCommand = new UpdateItemCommand({
      TableName: SPARE_PARTS_TABLE,
      Key: {
        partNumber: { S: existingPartNumber }
      },
      UpdateExpression: `
        SET description = if_not_exists(description, :desc),
            category = if_not_exists(category, :cat),
            unitOfMeasure = if_not_exists(unitOfMeasure, :uom),
            lastUpdated = :updated,
            dataSource = :source,
            alternatePartNumbers = list_append(if_not_exists(alternatePartNumbers, :empty_list), :alt_parts)
      `,
      ExpressionAttributeValues: {
        ':desc': { S: normalizedData.description },
        ':cat': { S: normalizedData.category },
        ':uom': { S: normalizedData.unitOfMeasure },
        ':updated': { S: new Date().toISOString() },
        ':source': { S: 'invoice-parsing-update' },
        ':empty_list': { L: [] },
        ':alt_parts': { L: [{ S: normalizedData.partNumber }] }
      }
    });

    await dynamoClient.send(updateCommand);
    console.log(`Updated existing spare part: ${existingPartNumber} with alternate ${normalizedData.partNumber}`);

  } catch (error) {
    console.error('Error updating spare part:', error);
    throw error;
  }
}

function categorizeError(error: string): string {
  if (error.includes('part number')) return 'invalid_part_number';
  if (error.includes('description')) return 'invalid_description';
  if (error.includes('category')) return 'missing_category';
  if (error.includes('unit of measure')) return 'missing_unit_of_measure';
  if (error.includes('safety stock')) return 'invalid_safety_stock';
  return 'other_error';
}

function categorizeWarning(warning: string): string {
  if (warning.includes('reorder point')) return 'reorder_point_issue';
  if (warning.includes('lead time')) return 'lead_time_issue';
  if (warning.includes('part number')) return 'part_number_format';
  if (warning.includes('description')) return 'description_cleanup';
  return 'other_warning';
}

function determineInvoiceType(dynamoRecord: Record<string, any>): 'sales' | 'purchase' {
  // Try to determine from the record structure or metadata
  if (dynamoRecord.invoiceType?.S) {
    return dynamoRecord.invoiceType.S as 'sales' | 'purchase';
  }
  
  // Fallback logic based on presence of supplier vs customer
  if (dynamoRecord.supplierId?.S) {
    return 'purchase';
  } else if (dynamoRecord.customerId?.S) {
    return 'sales';
  }
  
  // Default to purchase if unclear
  return 'purchase';
}

async function sendProcessingSummary(result: ProcessingResult): Promise<void> {
  try {
    const subject = result.success 
      ? 'Data Normalization Completed Successfully'
      : 'Data Normalization Completed with Errors';

    const avgQuality = result.qualityScores.length > 0 
      ? (result.qualityScores.reduce((a, b) => a + b, 0) / result.qualityScores.length).toFixed(2)
      : '0.00';

    const message = {
      default: `Data normalization processed ${result.processedItems} items with ${result.duplicatesFound} duplicates found. Average quality score: ${avgQuality}`,
      email: `
Subject: ${subject}

Data Normalization Summary:
- Items Processed: ${result.processedItems}
- Duplicates Found: ${result.duplicatesFound}
- Errors: ${result.errors.length}
- Warnings: ${result.warnings.length}
- Average Quality Score: ${avgQuality}
- Processing Time: ${result.processingTimeMs}ms

${Object.keys(result.errorTypes).length > 0 ? `
Error Types:
${Object.entries(result.errorTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
` : ''}

${Object.keys(result.warningTypes).length > 0 ? `
Warning Types:
${Object.entries(result.warningTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}
` : ''}

${result.errors.length > 0 && result.errors.length <= 10 ? `
Recent Errors:
${result.errors.slice(0, 10).map(error => `- ${error}`).join('\n')}
` : ''}

Timestamp: ${new Date().toISOString()}
      `.trim()
    };

    const publishCommand = new PublishCommand({
      TopicArn: ALERTS_TOPIC_ARN,
      Message: JSON.stringify(message),
      MessageStructure: 'json',
      Subject: subject,
      MessageAttributes: {
        'notification-type': {
          DataType: 'String',
          StringValue: 'data-normalization'
        },
        'status': {
          DataType: 'String',
          StringValue: result.success ? 'success' : 'partial-failure'
        },
        'items-processed': {
          DataType: 'Number',
          StringValue: result.processedItems.toString()
        },
        'average-quality-score': {
          DataType: 'Number',
          StringValue: avgQuality
        },
        'processing-time-ms': {
          DataType: 'Number',
          StringValue: result.processingTimeMs.toString()
        }
      }
    });

    await snsClient.send(publishCommand);
    console.log('Sent data normalization summary notification');

  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notification failure shouldn't stop the process
  }
}