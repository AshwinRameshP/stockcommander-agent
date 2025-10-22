import {
  SageMakerClient,
  CreateTrainingJobCommand,
  CreateModelCommand,
  CreateEndpointConfigCommand,
  CreateEndpointCommand,
  DescribeTrainingJobCommand,
  DescribeEndpointCommand,
  TrainingJobStatus,
  EndpointStatus,
  TrainingInstanceType
} from '@aws-sdk/client-sagemaker';
import { 
  SageMakerRuntimeClient,
  InvokeEndpointCommand 
} from '@aws-sdk/client-sagemaker-runtime';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export interface AnomalyDetectionConfig {
  trainingJobName: string;
  modelName: string;
  endpointConfigName: string;
  endpointName: string;
  roleArn: string;
  trainingImage: string;
  instanceType: TrainingInstanceType;
  instanceCount: number;
  volumeSizeInGB: number;
  maxRuntimeInSeconds: number;
}

export interface AnomalyDetectionRequest {
  partNumber: string;
  timeSeries: Array<{
    timestamp: string;
    demand: number;
  }>;
  threshold?: number;
}

export interface AnomalyDetectionResponse {
  partNumber: string;
  anomalies: Array<{
    timestamp: string;
    actualValue: number;
    expectedValue: number;
    anomalyScore: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  overallAnomalyScore: number;
  isAnomalous: boolean;
}

export interface AlertConfig {
  snsTopicArn: string;
  alertThresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  cooldownPeriodMinutes: number;
}

export interface ModelPerformanceMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
} 