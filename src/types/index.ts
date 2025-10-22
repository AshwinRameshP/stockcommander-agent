// Core data interfaces for the inventory replenishment system

export interface InvoiceData {
  invoiceId: string;
  type: 'sales' | 'purchase';
  date: Date;
  supplier?: string;
  customer?: string;
  lineItems: LineItem[];
  totalAmount: number;
  currency: string;
  status: 'pending' | 'processed' | 'error';
}

export interface LineItem {
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  category?: string;
}

export interface SparePart {
  partNumber: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  safetyStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  lastUpdated: Date;
  isActive: boolean;
}

export interface DemandForecast {
  partNumber: string;
  forecastDate: Date;
  predictedDemand: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  seasonalityFactor: number;
  modelVersion: string;
  createdAt: Date;
  ttl?: number; // TTL for DynamoDB
}

export interface ReplenishmentRecommendation {
  partNumber: string;
  recommendationId: string;
  recommendedQuantity: number;
  suggestedOrderDate: Date;
  preferredSupplier: string;
  estimatedCost: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'ordered';
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface SupplierMetrics {
  supplierId: string;
  supplierName: string;
  averageLeadTime: number;
  onTimeDeliveryRate: number;
  priceStability: number;
  qualityRating: number;
  lastOrderDate: Date;
  totalOrders: number;
  averageOrderValue: number;
  isPreferred: boolean;
  lastUpdated: Date;
}

export interface BedrockRequest {
  modelId: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface BedrockResponse {
  completion: string;
  stopReason: string;
  inputTokens: number;
  outputTokens: number;
}

export interface APIResponse<T = any> {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
  data?: T;
}

export interface ProcessingEvent {
  eventType: 'invoice_uploaded' | 'processing_complete' | 'recommendation_generated';
  timestamp: Date;
  data: any;
  source: string;
}

// AWS Lambda event types
export interface S3Event {
  Records: Array<{
    s3: {
      bucket: { name: string };
      object: { key: string };
    };
  }>;
}

export interface APIGatewayEvent {
  httpMethod: string;
  path: string;
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers: Record<string, string>;
}

// Configuration interfaces
export interface AWSConfig {
  region: string;
  invoiceBucket: string;
  processedDataBucket: string;
  sparePartsTable: string;
  demandForecastTable: string;
  recommendationsTable: string;
  supplierMetricsTable: string;
}

export interface BedrockConfig {
  modelId: string;
  maxTokens: number;
  temperature: number;
  region: string;
}

// Normalized invoice data structure for storage
export interface NormalizedInvoiceData {
  partNumber: string;
  invoiceDate: string; // ISO date string for sorting
  invoiceId: string;
  invoiceType: 'sales' | 'purchase';
  supplierId?: string;
  customerId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  normalizedDescription: string;
  originalDescription: string;
  category: string;
  unitOfMeasure: string;
  qualityScore: number;
  normalizationTimestamp: string;
  dataSource: string;
  ttl?: number; // TTL for DynamoDB
}

// Data quality metrics
export interface DataQualityMetrics {
  metricType: string; // 'normalization', 'duplicate_detection', 'validation'
  timestamp: string;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duplicatesFound: number;
  averageQualityScore: number;
  errorTypes: Record<string, number>;
  warningTypes: Record<string, number>;
  processingTimeMs: number;
  ttl?: number;
}

// Duplicate detection result
export interface DuplicateDetectionResult {
  partNumber: string;
  detectionTimestamp: string;
  isDuplicate: boolean;
  existingPartNumber?: string;
  similarParts: Array<{
    partNumber: string;
    similarity: number;
    matchType: 'exact' | 'fuzzy' | 'description';
  }>;
  confidence: number;
  action: 'created' | 'merged' | 'flagged';
  ttl?: number;
}

// Enhanced line item with normalization metadata
export interface EnhancedLineItem extends LineItem {
  normalizationResult?: {
    success: boolean;
    confidence: number;
    warnings: string[];
    errors: string[];
  };
  duplicateCheck?: {
    isDuplicate: boolean;
    existingPartNumber?: string;
    confidence: number;
  };
}