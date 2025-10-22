import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand, UpdateItemCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { NormalizedInvoiceData, DataQualityMetrics, DuplicateDetectionResult, SparePart } from '../types';

export interface StorageResult {
  success: boolean;
  recordsStored: number;
  errors: string[];
  warnings: string[];
}

export interface QueryOptions {
  partNumber?: string;
  invoiceType?: 'sales' | 'purchase';
  supplierId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  lastEvaluatedKey?: Record<string, any>;
}

export class DataStorageService {
  private dynamoClient: DynamoDBClient;
  private normalizedDataTable: string;
  private dataQualityTable: string;
  private duplicateDetectionTable: string;
  private sparePartsTable: string;

  constructor(dynamoClient: DynamoDBClient) {
    this.dynamoClient = dynamoClient;
    this.normalizedDataTable = process.env.NORMALIZED_INVOICE_DATA_TABLE || 'NormalizedInvoiceData';
    this.dataQualityTable = process.env.DATA_QUALITY_TABLE || 'DataQualityMetrics';
    this.duplicateDetectionTable = process.env.DUPLICATE_DETECTION_TABLE || 'DuplicateDetectionResults';
    this.sparePartsTable = process.env.SPARE_PARTS_TABLE || 'SpareParts';
  }

  async storeNormalizedInvoiceData(data: NormalizedInvoiceData[]): Promise<StorageResult> {
    const result: StorageResult = {
      success: true,
      recordsStored: 0,
      errors: [],
      warnings: []
    };

    try {
      // Process in batches of 25 (DynamoDB batch limit)
      const batchSize = 25;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const writeRequests = batch.map(item => ({
          PutRequest: {
            Item: this.convertNormalizedDataToDynamoItem(item)
          }
        }));

        const batchCommand = new BatchWriteItemCommand({
          RequestItems: {
            [this.normalizedDataTable]: writeRequests
          }
        });

        await this.dynamoClient.send(batchCommand);
        result.recordsStored += batch.length;
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Error storing normalized data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async storeDataQualityMetrics(metrics: DataQualityMetrics): Promise<void> {
    try {
      const putCommand = new PutItemCommand({
        TableName: this.dataQualityTable,
        Item: {
          metricType: { S: metrics.metricType },
          timestamp: { S: metrics.timestamp },
          totalRecords: { N: metrics.totalRecords.toString() },
          successfulRecords: { N: metrics.successfulRecords.toString() },
          failedRecords: { N: metrics.failedRecords.toString() },
          duplicatesFound: { N: metrics.duplicatesFound.toString() },
          averageQualityScore: { N: metrics.averageQualityScore.toString() },
          errorTypes: { M: this.convertRecordToMap(metrics.errorTypes) },
          warningTypes: { M: this.convertRecordToMap(metrics.warningTypes) },
          processingTimeMs: { N: metrics.processingTimeMs.toString() },
          ttl: { N: (metrics.ttl || this.calculateTTL(30)).toString() } // 30 days default
        }
      });

      await this.dynamoClient.send(putCommand);

    } catch (error) {
      console.error('Error storing data quality metrics:', error);
      throw error;
    }
  }

  async storeDuplicateDetectionResult(result: DuplicateDetectionResult): Promise<void> {
    try {
      const putCommand = new PutItemCommand({
        TableName: this.duplicateDetectionTable,
        Item: {
          partNumber: { S: result.partNumber },
          detectionTimestamp: { S: result.detectionTimestamp },
          isDuplicate: { BOOL: result.isDuplicate },
          ...(result.existingPartNumber && { existingPartNumber: { S: result.existingPartNumber } }),
          similarParts: { 
            L: result.similarParts.map(part => ({
              M: {
                partNumber: { S: part.partNumber },
                similarity: { N: part.similarity.toString() },
                matchType: { S: part.matchType }
              }
            }))
          },
          confidence: { N: result.confidence.toString() },
          action: { S: result.action },
          ttl: { N: (result.ttl || this.calculateTTL(90)).toString() } // 90 days default
        }
      });

      await this.dynamoClient.send(putCommand);

    } catch (error) {
      console.error('Error storing duplicate detection result:', error);
      throw error;
    }
  }

  async queryNormalizedData(options: QueryOptions): Promise<{
    items: NormalizedInvoiceData[];
    lastEvaluatedKey?: Record<string, any>;
  }> {
    try {
      let queryCommand;

      if (options.partNumber) {
        // Query by part number
        queryCommand = new QueryCommand({
          TableName: this.normalizedDataTable,
          KeyConditionExpression: 'partNumber = :partNumber',
          ExpressionAttributeValues: {
            ':partNumber': { S: options.partNumber }
          },
          Limit: options.limit || 100,
          ExclusiveStartKey: options.lastEvaluatedKey
        });

        if (options.startDate || options.endDate) {
          queryCommand.input.KeyConditionExpression += ' AND invoiceDate BETWEEN :startDate AND :endDate';
          queryCommand.input.ExpressionAttributeValues![':startDate'] = { S: options.startDate || '1900-01-01' };
          queryCommand.input.ExpressionAttributeValues![':endDate'] = { S: options.endDate || '2099-12-31' };
        }

      } else if (options.invoiceType) {
        // Query by invoice type using GSI
        queryCommand = new QueryCommand({
          TableName: this.normalizedDataTable,
          IndexName: 'InvoiceTypeIndex',
          KeyConditionExpression: 'invoiceType = :invoiceType',
          ExpressionAttributeValues: {
            ':invoiceType': { S: options.invoiceType }
          },
          Limit: options.limit || 100,
          ExclusiveStartKey: options.lastEvaluatedKey
        });

        if (options.startDate || options.endDate) {
          queryCommand.input.KeyConditionExpression += ' AND invoiceDate BETWEEN :startDate AND :endDate';
          queryCommand.input.ExpressionAttributeValues![':startDate'] = { S: options.startDate || '1900-01-01' };
          queryCommand.input.ExpressionAttributeValues![':endDate'] = { S: options.endDate || '2099-12-31' };
        }

      } else if (options.supplierId) {
        // Query by supplier using GSI
        queryCommand = new QueryCommand({
          TableName: this.normalizedDataTable,
          IndexName: 'SupplierIndex',
          KeyConditionExpression: 'supplierId = :supplierId',
          ExpressionAttributeValues: {
            ':supplierId': { S: options.supplierId }
          },
          Limit: options.limit || 100,
          ExclusiveStartKey: options.lastEvaluatedKey
        });

        if (options.startDate || options.endDate) {
          queryCommand.input.KeyConditionExpression += ' AND invoiceDate BETWEEN :startDate AND :endDate';
          queryCommand.input.ExpressionAttributeValues![':startDate'] = { S: options.startDate || '1900-01-01' };
          queryCommand.input.ExpressionAttributeValues![':endDate'] = { S: options.endDate || '2099-12-31' };
        }

      } else {
        throw new Error('At least one query parameter (partNumber, invoiceType, or supplierId) must be provided');
      }

      const response = await this.dynamoClient.send(queryCommand);
      
      const items = response.Items?.map(item => this.convertDynamoItemToNormalizedData(item)) || [];

      return {
        items,
        lastEvaluatedKey: response.LastEvaluatedKey
      };

    } catch (error) {
      console.error('Error querying normalized data:', error);
      throw error;
    }
  }

  async getDataQualityMetrics(metricType: string, startTime?: string, endTime?: string): Promise<DataQualityMetrics[]> {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.dataQualityTable,
        KeyConditionExpression: 'metricType = :metricType',
        ExpressionAttributeValues: {
          ':metricType': { S: metricType }
        },
        ScanIndexForward: false, // Most recent first
        Limit: 50
      });

      if (startTime || endTime) {
        queryCommand.input.KeyConditionExpression += ' AND #ts BETWEEN :startTime AND :endTime';
        queryCommand.input.ExpressionAttributeNames = { '#ts': 'timestamp' };
        queryCommand.input.ExpressionAttributeValues![':startTime'] = { S: startTime || '1900-01-01T00:00:00Z' };
        queryCommand.input.ExpressionAttributeValues![':endTime'] = { S: endTime || new Date().toISOString() };
      }

      const response = await this.dynamoClient.send(queryCommand);
      
      return response.Items?.map(item => this.convertDynamoItemToDataQualityMetrics(item)) || [];

    } catch (error) {
      console.error('Error getting data quality metrics:', error);
      throw error;
    }
  }

  async getDuplicateDetectionHistory(partNumber: string): Promise<DuplicateDetectionResult[]> {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.duplicateDetectionTable,
        KeyConditionExpression: 'partNumber = :partNumber',
        ExpressionAttributeValues: {
          ':partNumber': { S: partNumber }
        },
        ScanIndexForward: false, // Most recent first
        Limit: 20
      });

      const response = await this.dynamoClient.send(queryCommand);
      
      return response.Items?.map(item => this.convertDynamoItemToDuplicateResult(item)) || [];

    } catch (error) {
      console.error('Error getting duplicate detection history:', error);
      throw error;
    }
  }

  private convertNormalizedDataToDynamoItem(data: NormalizedInvoiceData): Record<string, any> {
    return {
      partNumber: { S: data.partNumber },
      invoiceDate: { S: data.invoiceDate },
      invoiceId: { S: data.invoiceId },
      invoiceType: { S: data.invoiceType },
      ...(data.supplierId && { supplierId: { S: data.supplierId } }),
      ...(data.customerId && { customerId: { S: data.customerId } }),
      quantity: { N: data.quantity.toString() },
      unitPrice: { N: data.unitPrice.toString() },
      totalAmount: { N: data.totalAmount.toString() },
      currency: { S: data.currency },
      normalizedDescription: { S: data.normalizedDescription },
      originalDescription: { S: data.originalDescription },
      category: { S: data.category },
      unitOfMeasure: { S: data.unitOfMeasure },
      qualityScore: { N: data.qualityScore.toString() },
      normalizationTimestamp: { S: data.normalizationTimestamp },
      dataSource: { S: data.dataSource },
      ttl: { N: (data.ttl || this.calculateTTL(365)).toString() } // 1 year default
    };
  }

  private convertDynamoItemToNormalizedData(item: Record<string, any>): NormalizedInvoiceData {
    return {
      partNumber: item.partNumber.S,
      invoiceDate: item.invoiceDate.S,
      invoiceId: item.invoiceId.S,
      invoiceType: item.invoiceType.S as 'sales' | 'purchase',
      supplierId: item.supplierId?.S,
      customerId: item.customerId?.S,
      quantity: parseFloat(item.quantity.N),
      unitPrice: parseFloat(item.unitPrice.N),
      totalAmount: parseFloat(item.totalAmount.N),
      currency: item.currency.S,
      normalizedDescription: item.normalizedDescription.S,
      originalDescription: item.originalDescription.S,
      category: item.category.S,
      unitOfMeasure: item.unitOfMeasure.S,
      qualityScore: parseFloat(item.qualityScore.N),
      normalizationTimestamp: item.normalizationTimestamp.S,
      dataSource: item.dataSource.S,
      ttl: item.ttl?.N ? parseInt(item.ttl.N) : undefined
    };
  }

  private convertDynamoItemToDataQualityMetrics(item: Record<string, any>): DataQualityMetrics {
    return {
      metricType: item.metricType.S,
      timestamp: item.timestamp.S,
      totalRecords: parseInt(item.totalRecords.N),
      successfulRecords: parseInt(item.successfulRecords.N),
      failedRecords: parseInt(item.failedRecords.N),
      duplicatesFound: parseInt(item.duplicatesFound.N),
      averageQualityScore: parseFloat(item.averageQualityScore.N),
      errorTypes: this.convertMapToRecord(item.errorTypes.M),
      warningTypes: this.convertMapToRecord(item.warningTypes.M),
      processingTimeMs: parseInt(item.processingTimeMs.N),
      ttl: item.ttl?.N ? parseInt(item.ttl.N) : undefined
    };
  }

  private convertDynamoItemToDuplicateResult(item: Record<string, any>): DuplicateDetectionResult {
    return {
      partNumber: item.partNumber.S,
      detectionTimestamp: item.detectionTimestamp.S,
      isDuplicate: item.isDuplicate.BOOL,
      existingPartNumber: item.existingPartNumber?.S,
      similarParts: item.similarParts.L.map((part: any) => ({
        partNumber: part.M.partNumber.S,
        similarity: parseFloat(part.M.similarity.N),
        matchType: part.M.matchType.S as 'exact' | 'fuzzy' | 'description'
      })),
      confidence: parseFloat(item.confidence.N),
      action: item.action.S as 'created' | 'merged' | 'flagged',
      ttl: item.ttl?.N ? parseInt(item.ttl.N) : undefined
    };
  }

  private convertRecordToMap(record: Record<string, number>): Record<string, any> {
    const map: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      map[key] = { N: value.toString() };
    }
    return map;
  }

  private convertMapToRecord(map: Record<string, any>): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [key, value] of Object.entries(map)) {
      record[key] = parseInt(value.N);
    }
    return record;
  }

  private calculateTTL(days: number): number {
    return Math.floor(Date.now() / 1000) + (days * 24 * 60 * 60);
  }
}