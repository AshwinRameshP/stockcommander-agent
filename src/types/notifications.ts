export interface NotificationPreference {
  userId: string;
  notificationType: string;
  enabled: boolean;
  channels: NotificationChannel[];
  email?: string;
  phoneNumber?: string;
  thresholds?: NotificationThresholds;
  frequency?: NotificationFrequency;
  quietHours?: QuietHours;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationThresholds {
  stockLevel?: number;
  costSavings?: number;
  urgencyLevel?: UrgencyLevel;
  demandVariance?: number;
  leadTimeDelay?: number;
}

export interface QuietHours {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  timezone: string;
  enabled?: boolean;
}

export interface NotificationHistory {
  notificationId: string;
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  timestamp: string;
  message: string;
  subject?: string;
  metadata?: NotificationMetadata;
  ttl: number;
  deliveredAt?: string;
  readAt?: string;
  errorMessage?: string;
}

export interface NotificationMetadata {
  partNumber?: string;
  alertType?: string;
  urgencyLevel?: UrgencyLevel;
  context?: AlertContext;
  retryCount?: number;
  originalMessageId?: string;
}

export interface AlertContext {
  partNumber?: string;
  currentValue: number;
  threshold: number;
  trend?: Trend;
  forecastDays?: number;
  costImpact?: number;
  supplierInfo?: SupplierInfo;
  historicalData?: HistoricalDataPoint[];
  urgencyLevel?: UrgencyLevel;
  error?: string;
  message?: string;
  actionRequired?: string;
  daysOfStock?: number;
  leadTimeDays?: numbe

export interface SupplierInfo {
  supplierId: string;
  name: string;
  leadTime: number;
  reliability: number;
  costPerUnit: number;
  lastOrderDate?: string;
}

export interface HistoricalDataPoint {
  date: string;
  value: number;
  type: 'demand' | 'stock' | 'cost';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  alertType: AlertType;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldownPeriod?: number; // minutes
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlertCondition {
  field: string;
  operator: ComparisonOperator;
  value: number | string;
  aggregation?: AggregationType;
  timeWindow?: number; // minutes
}

export interface AlertAction {
  type: 'notification' | 'webhook' | 'email' | 'sms';
  target: string;
  template?: string;
  priority: number;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  alertType: AlertType;
  channel: NotificationChannel;
  subject: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationBatch {
  batchId: string;
  notifications: NotificationRequest[];
  status: BatchStatus;
  createdAt: string;
  processedAt?: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
}

export interface NotificationRequest {
  userId: string;
  notificationType: string;
  channel: NotificationChannel;
  message: string;
  subject?: string;
  priority: NotificationPriority;
  metadata?: NotificationMetadata;
  scheduledFor?: string;
}

// Enums and Union Types
export type NotificationChannel = 'email' | 'sms' | 'push' | 'webhook' | 'slack';

export type NotificationStatus = 
  | 'pending' 
  | 'sent' 
  | 'delivered' 
  | 'read' 
  | 'failed' 
  | 'bounced' 
  | 'unsubscribed';

export type NotificationFrequency = 
  | 'immediate' 
  | 'hourly' 
  | 'daily' 
  | 'weekly' 
  | 'monthly';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type Trend = 'increasing' | 'decreasing' | 'stable' | 'volatile';

export type AlertType = 
  | 'stockout' 
  | 'lowStock' 
  | 'predictive' 
  | 'costOptimization' 
  | 'supplierIssue' 
  | 'demandSpike' 
  | 'system' 
  | 'maintenance';

export type ComparisonOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'greaterThan' 
  | 'lessThan' 
  | 'greaterThanOrEqual' 
  | 'lessThanOrEqual' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith';

export type AggregationType = 
  | 'sum' 
  | 'average' 
  | 'min' 
  | 'max' 
  | 'count' 
  | 'median';

export type BatchStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// API Response Types
export interface NotificationPreferencesResponse {
  preferences: NotificationPreference;
  availableChannels: NotificationChannel[];
  supportedTypes: string[];
}

export interface NotificationHistoryResponse {
  notifications: NotificationHistory[];
  count: number;
  lastEvaluatedKey?: any;
  hasMore: boolean;
}

export interface AlertEvaluationResponse {
  evaluationId: string;
  timestamp: string;
  results: {
    inventoryAlerts: number;
    predictiveAlerts: number;
    costOptimizationAlerts: number;
    systemAlerts: number;
    totalNotifications: number;
  };
  duration: number;
  errors?: string[];
}

export interface SubscriptionResponse {
  subscriptionArn: string;
  topicArn: string;
  protocol: string;
  endpoint: string;
  status: 'pending' | 'confirmed' | 'deleted';
}

// Utility Types
export interface NotificationConfig {
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  rateLimitPerMinute: number;
  defaultTtlDays: number;
  enableQuietHours: boolean;
  supportedTimezones: string[];
}

export interface NotificationMetrics {
  totalSent: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  averageDeliveryTime: number;
  errorRate: number;
}