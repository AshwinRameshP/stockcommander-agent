import * as AWSXRay from 'aws-xray-sdk-core';
import { Context } from 'aws-lambda';

export interface TraceContext {
  traceId: string;
  segmentId: string;
  parentId?: string;
  correlationId: string;
}

export class DistributedTracing {
  private static instance: DistributedTracing;
  private correlationIdHeader = 'X-Correlation-ID';

  private constructor() {
    // Configure X-Ray
    AWSXRay.config([
      AWSXRay.plugins.ECSPlugin,
      AWSXRay.plugins.EC2Plugin,
    ]);

    // Capture AWS SDK calls
    AWSXRay.captureAWS(require('aws-sdk'));
  }

  public static getInstance(): DistributedTracing {
    if (!DistributedTracing.instance) {
      DistributedTracing.instance = new DistributedTracing();
    }
    return DistributedTracing.instance;
  }

  /**
   * Creates a new trace segment for Lambda function
   */
  public createLambdaSegment(functionName: string, context: Context): any {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation('functionName', functionName);
      segment.addAnnotation('functionVersion', context.functionVersion);
      segment.addAnnotation('requestId', context.awsRequestId);
      segment.addMetadata('lambda', {
        functionName,
        functionVersion: context.functionVersion,
        memoryLimitInMB: context.memoryLimitInMB,
        remainingTimeInMillis: context.getRemainingTimeInMillis(),
      });
    }
    return segment;
  }

  /**
   * Creates a subsegment for tracking specific operations
   */
  public createSubsegment(name: string, operation: () => Promise<any>): Promise<any> {
    return AWSXRay.captureAsyncFunc(name, async (subsegment) => {
      try {
        const result = await operation();
        subsegment?.addAnnotation('status', 'success');
        return result;
      } catch (error: any) {
        subsegment?.addAnnotation('status', 'error');
        subsegment?.addMetadata('error', {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
        throw error;
      }
    });
  }

  /**
   * Traces HTTP requests
   */
  public traceHTTPRequest(
    url: string,
    method: string,
    operation: () => Promise<any>
  ): Promise<any> {
    return this.createSubsegment(`HTTP ${method} ${url}`, async () => {
      const subsegment = AWSXRay.getSegment();
      if (subsegment) {
        subsegment.addAnnotation('http.method', method);
        subsegment.addAnnotation('http.url', url);
      }
      return operation();
    });
  }

  /**
   * Traces database operations
   */
  public traceDatabaseOperation(
    tableName: string,
    operation: string,
    dbOperation: () => Promise<any>
  ): Promise<any> {
    return this.createSubsegment(`DynamoDB ${operation}`, async () => {
      const subsegment = AWSXRay.getSegment();
      if (subsegment) {
        subsegment.addAnnotation('db.type', 'dynamodb');
        subsegment.addAnnotation('db.table', tableName);
        subsegment.addAnnotation('db.operation', operation);
      }
      return dbOperation();
    });
  }

  /**
   * Traces S3 operations
   */
  public traceS3Operation(
    bucketName: string,
    operation: string,
    s3Operation: () => Promise<any>
  ): Promise<any> {
    return this.createSubsegment(`S3 ${operation}`, async () => {
      const subsegment = AWSXRay.getSegment();
      if (subsegment) {
        subsegment.addAnnotation('s3.bucket', bucketName);
        subsegment.addAnnotation('s3.operation', operation);
      }
      return s3Operation();
    });
  }

  /**
   * Traces Bedrock AI operations
   */
  public traceBedrockOperation(
    modelId: string,
    operation: string,
    bedrockOperation: () => Promise<any>
  ): Promise<any> {
    return this.createSubsegment(`Bedrock ${operation}`, async () => {
      const subsegment = AWSXRay.getSegment();
      if (subsegment) {
        subsegment.addAnnotation('bedrock.model', modelId);
        subsegment.addAnnotation('bedrock.operation', operation);
      }
      return bedrockOperation();
    });
  }

  /**
   * Traces SageMaker operations
   */
  public traceSageMakerOperation(
    endpointName: string,
    operation: string,
    sagemakerOperation: () => Promise<any>
  ): Promise<any> {
    return this.createSubsegment(`SageMaker ${operation}`, async () => {
      const subsegment = AWSXRay.getSegment();
      if (subsegment) {
        subsegment.addAnnotation('sagemaker.endpoint', endpointName);
        subsegment.addAnnotation('sagemaker.operation', operation);
      }
      return sagemakerOperation();
    });
  }

  /**
   * Adds custom annotations to current segment
   */
  public addAnnotation(key: string, value: string | number | boolean): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation(key, value);
    }
  }

  /**
   * Adds custom metadata to current segment
   */
  public addMetadata(namespace: string, data: any): void {
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata(namespace, data);
    }
  }

  /**
   * Gets current trace context
   */
  public getTraceContext(): TraceContext | null {
    const segment = AWSXRay.getSegment();
    if (!segment) {
      return null;
    }

    return {
      traceId: segment.trace_id,
      segmentId: segment.id,
      parentId: segment.parent_id,
      correlationId: this.generateCorrelationId(),
    };
  }

  /**
   * Extracts correlation ID from headers
   */
  public extractCorrelationId(headers: { [key: string]: string }): string {
    return headers[this.correlationIdHeader] || 
           headers[this.correlationIdHeader.toLowerCase()] ||
           this.generateCorrelationId();
  }

  /**
   * Generates a new correlation ID
   */
  public generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates headers with trace context for downstream calls
   */
  public createTraceHeaders(correlationId?: string): { [key: string]: string } {
    const traceContext = this.getTraceContext();
    const headers: { [key: string]: string } = {};

    if (correlationId || traceContext?.correlationId) {
      headers[this.correlationIdHeader] = correlationId || traceContext!.correlationId;
    }

    // Add X-Ray trace header if available
    const traceHeader = process.env._X_AMZN_TRACE_ID;
    if (traceHeader) {
      headers['X-Amzn-Trace-Id'] = traceHeader;
    }

    return headers;
  }

  /**
   * Logs structured trace information
   */
  public logTraceInfo(message: string, data?: any): void {
    const traceContext = this.getTraceContext();
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      traceId: traceContext?.traceId,
      segmentId: traceContext?.segmentId,
      correlationId: traceContext?.correlationId,
      data,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Logs structured error information with trace context
   */
  public logTraceError(error: Error, context?: any): void {
    const traceContext = this.getTraceContext();
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      error: {
        name: error.name,
        stack: error.stack,
      },
      traceId: traceContext?.traceId,
      segmentId: traceContext?.segmentId,
      correlationId: traceContext?.correlationId,
      context,
    };

    console.error(JSON.stringify(logEntry));

    // Add error to X-Ray segment
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addError(error);
    }
  }
}

/**
 * Middleware for automatic X-Ray tracing in Lambda functions
 */
export function tracingMiddleware() {
  return (handler: Function) => {
    return async (event: any, context: Context) => {
      const tracing = DistributedTracing.getInstance();
      
      // Create Lambda segment
      const segment = tracing.createLambdaSegment(context.functionName, context);
      
      // Extract correlation ID from event
      const correlationId = tracing.extractCorrelationId(event.headers || {});
      tracing.addAnnotation('correlationId', correlationId);
      
      // Add event metadata
      tracing.addMetadata('event', {
        httpMethod: event.httpMethod,
        resource: event.resource,
        path: event.path,
        queryStringParameters: event.queryStringParameters,
        pathParameters: event.pathParameters,
      });

      try {
        tracing.logTraceInfo('Lambda function started', {
          functionName: context.functionName,
          correlationId,
        });

        const result = await handler(event, context);
        
        tracing.addAnnotation('statusCode', result?.statusCode || 200);
        tracing.logTraceInfo('Lambda function completed successfully');
        
        return result;
      } catch (error: any) {
        tracing.logTraceError(error, {
          functionName: context.functionName,
          correlationId,
        });
        throw error;
      }
    };
  };
}

/**
 * Decorator for automatic method tracing
 */
export function trace(operationName?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const tracing = DistributedTracing.getInstance();

    descriptor.value = async function (...args: any[]) {
      const name = operationName || `${target.constructor.name}.${propertyName}`;
      
      return tracing.createSubsegment(name, async () => {
        tracing.addAnnotation('method', propertyName);
        tracing.addAnnotation('class', target.constructor.name);
        
        try {
          const result = await method.apply(this, args);
          tracing.addAnnotation('success', true);
          return result;
        } catch (error: any) {
          tracing.addAnnotation('success', false);
          tracing.logTraceError(error);
          throw error;
        }
      });
    };

    return descriptor;
  };
}