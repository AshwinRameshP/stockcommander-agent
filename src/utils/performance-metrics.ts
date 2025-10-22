import { CloudWatch } from 'aws-sdk';
import { Context } from 'aws-lambda';

export interface PerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  dimensions?: { [key: string]: string };
  timestamp?: Date;
}

export interface BusinessMetric {
  invoicesProcessed: number;
  recommendationsGenerated: number;
  costSavingsIdentified: number;
  processingLatency: number;
  accuracyScore: number;
}

export class PerformanceMetrics {
  private cloudWatch: CloudWatch;
  private namespace: string;

  constructor(namespace: string = 'InventoryReplenishment') {
    this.cloudWatch = new CloudWatch();
    this.namespace = namespace;
  }

  /**
   * Publishes a single metric to CloudWatch
   */
  async publishMetric(metric: PerformanceMetric): Promise<void> {
    try {
      const params = {
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: metric.metricName,
            Value: metric.value,
            Unit: metric.unit,
            Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
            Timestamp: metric.timestamp || new Date(),
          },
        ],
      };

      await this.cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to publish metric:', error);
      // Don't throw to avoid breaking the main function
    }
  }

  /**
   * Publishes multiple metrics in batch
   */
  async publishMetrics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      const metricData = metrics.map(metric => ({
        MetricName: metric.metricName,
        Value: metric.value,
        Unit: metric.unit,
        Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined,
        Timestamp: metric.timestamp || new Date(),
      }));

      // CloudWatch allows up to 20 metrics per request
      const chunks = this.chunkArray(metricData, 20);
      
      for (const chunk of chunks) {
        await this.cloudWatch.putMetricData({
          Namespace: this.namespace,
          MetricData: chunk,
        }).promise();
      }
    } catch (error) {
      console.error('Failed to publish metrics:', error);
    }
  }

  /**
   * Records invoice processing metrics
   */
  async recordInvoiceProcessing(
    processingTime: number,
    invoiceSize: number,
    success: boolean,
    invoiceType: 'sales' | 'purchase'
  ): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        metricName: 'InvoiceProcessingTime',
        value: processingTime,
        unit: 'Milliseconds',
        dimensions: {
          InvoiceType: invoiceType,
          Status: success ? 'Success' : 'Failed',
        },
      },
      {
        metricName: 'InvoiceSize',
        value: invoiceSize,
        unit: 'Bytes',
        dimensions: {
          InvoiceType: invoiceType,
        },
      },
      {
        metricName: 'InvoicesProcessed',
        value: 1,
        unit: 'Count',
        dimensions: {
          InvoiceType: invoiceType,
          Status: success ? 'Success' : 'Failed',
        },
      },
    ];

    await this.publishMetrics(metrics);
  }

  /**
   * Records AI reasoning performance
   */
  async recordAIReasoningMetrics(
    reasoningTime: number,
    complexityScore: number,
    confidenceScore: number,
    reasoningType: string
  ): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        metricName: 'AIReasoningTime',
        value: reasoningTime,
        unit: 'Milliseconds',
        dimensions: {
          ReasoningType: reasoningType,
        },
      },
      {
        metricName: 'AIComplexityScore',
        value: complexityScore,
        unit: 'None',
        dimensions: {
          ReasoningType: reasoningType,
        },
      },
      {
        metricName: 'AIConfidenceScore',
        value: confidenceScore,
        unit: 'Percent',
        dimensions: {
          ReasoningType: reasoningType,
        },
      },
    ];

    await this.publishMetrics(metrics);
  }

  /**
   * Records ML model performance
   */
  async recordMLModelMetrics(
    modelName: string,
    predictionTime: number,
    accuracy: number,
    dataPoints: number
  ): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        metricName: 'MLPredictionTime',
        value: predictionTime,
        unit: 'Milliseconds',
        dimensions: {
          ModelName: modelName,
        },
      },
      {
        metricName: 'MLModelAccuracy',
        value: accuracy,
        unit: 'Percent',
        dimensions: {
          ModelName: modelName,
        },
      },
      {
        metricName: 'MLDataPoints',
        value: dataPoints,
        unit: 'Count',
        dimensions: {
          ModelName: modelName,
        },
      },
    ];

    await this.publishMetrics(metrics);
  }

  /**
   * Records business metrics
   */
  async recordBusinessMetrics(metrics: BusinessMetric): Promise<void> {
    const cloudWatchMetrics: PerformanceMetric[] = [
      {
        metricName: 'InvoicesProcessedDaily',
        value: metrics.invoicesProcessed,
        unit: 'Count',
      },
      {
        metricName: 'RecommendationsGenerated',
        value: metrics.recommendationsGenerated,
        unit: 'Count',
      },
      {
        metricName: 'CostSavingsIdentified',
        value: metrics.costSavingsIdentified,
        unit: 'None', // Dollar amount
      },
      {
        metricName: 'AverageProcessingLatency',
        value: metrics.processingLatency,
        unit: 'Milliseconds',
      },
      {
        metricName: 'SystemAccuracyScore',
        value: metrics.accuracyScore,
        unit: 'Percent',
      },
    ];

    await this.publishMetrics(cloudWatchMetrics);
  }

  /**
   * Records API performance metrics
   */
  async recordAPIMetrics(
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    requestSize: number,
    responseSize: number
  ): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        metricName: 'APIResponseTime',
        value: responseTime,
        unit: 'Milliseconds',
        dimensions: {
          Endpoint: endpoint,
          Method: method,
          StatusCode: statusCode.toString(),
        },
      },
      {
        metricName: 'APIRequestSize',
        value: requestSize,
        unit: 'Bytes',
        dimensions: {
          Endpoint: endpoint,
          Method: method,
        },
      },
      {
        metricName: 'APIResponseSize',
        value: responseSize,
        unit: 'Bytes',
        dimensions: {
          Endpoint: endpoint,
          Method: method,
        },
      },
      {
        metricName: 'APIRequests',
        value: 1,
        unit: 'Count',
        dimensions: {
          Endpoint: endpoint,
          Method: method,
          StatusCode: statusCode.toString(),
        },
      },
    ];

    await this.publishMetrics(metrics);
  }

  /**
   * Records cost metrics
   */
  async recordCostMetrics(
    service: string,
    operation: string,
    estimatedCost: number,
    resourceUnits: number
  ): Promise<void> {
    const metrics: PerformanceMetric[] = [
      {
        metricName: 'EstimatedCost',
        value: estimatedCost,
        unit: 'None', // Dollar amount
        dimensions: {
          Service: service,
          Operation: operation,
        },
      },
      {
        metricName: 'ResourceUnits',
        value: resourceUnits,
        unit: 'Count',
        dimensions: {
          Service: service,
          Operation: operation,
        },
      },
      {
        metricName: 'CostPerUnit',
        value: resourceUnits > 0 ? estimatedCost / resourceUnits : 0,
        unit: 'None',
        dimensions: {
          Service: service,
          Operation: operation,
        },
      },
    ];

    await this.publishMetrics(metrics);
  }

  /**
   * Utility function to chunk arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

/**
 * Middleware to automatically track Lambda performance
 */
export function performanceMiddleware(metricsCollector: PerformanceMetrics) {
  return (handler: Function) => {
    return async (event: any, context: Context) => {
      const startTime = Date.now();
      const requestSize = JSON.stringify(event).length;
      let responseSize = 0;
      let statusCode = 200;
      let error: Error | null = null;

      try {
        const result = await handler(event, context);
        responseSize = JSON.stringify(result).length;
        statusCode = result?.statusCode || 200;
        return result;
      } catch (err: any) {
        error = err;
        statusCode = 500;
        throw err;
      } finally {
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Record performance metrics
        await metricsCollector.recordAPIMetrics(
          event.resource || context.functionName,
          event.httpMethod || 'INVOKE',
          duration,
          statusCode,
          requestSize,
          responseSize
        );

        // Record Lambda-specific metrics
        await metricsCollector.publishMetric({
          metricName: 'LambdaExecutionTime',
          value: duration,
          unit: 'Milliseconds',
          dimensions: {
            FunctionName: context.functionName,
            Status: error ? 'Error' : 'Success',
          },
        });

        // Record memory usage if available
        if (context.memoryLimitInMB) {
          await metricsCollector.publishMetric({
            metricName: 'LambdaMemoryUtilization',
            value: (context.memoryLimitInMB * 0.8), // Estimated usage
            unit: 'Megabytes',
            dimensions: {
              FunctionName: context.functionName,
            },
          });
        }
      }
    };
  };
}

/**
 * Utility function to measure execution time
 */
export async function measureExecutionTime<T>(
  operation: () => Promise<T>,
  operationName: string,
  metricsCollector: PerformanceMetrics,
  dimensions?: { [key: string]: string }
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await operation();
    const duration = Date.now() - startTime;
    
    await metricsCollector.publishMetric({
      metricName: 'OperationExecutionTime',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Operation: operationName,
        Status: 'Success',
        ...dimensions,
      },
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    await metricsCollector.publishMetric({
      metricName: 'OperationExecutionTime',
      value: duration,
      unit: 'Milliseconds',
      dimensions: {
        Operation: operationName,
        Status: 'Error',
        ...dimensions,
      },
    });
    
    throw error;
  }
}