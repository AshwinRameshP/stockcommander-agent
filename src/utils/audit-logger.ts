import { CloudWatchLogs } from 'aws-sdk';
import { Context } from 'aws-lambda';

export interface AuditEvent {
  eventType: 'DATA_ACCESS' | 'DATA_MODIFICATION' | 'AUTHENTICATION' | 'AUTHORIZATION' | 'SYSTEM_ERROR';
  userId?: string;
  resource: string;
  action: string;
  timestamp: string;
  sourceIp?: string;
  userAgent?: string;
  requestId: string;
  sessionId?: string;
  details?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
}

export class AuditLogger {
  private cloudWatchLogs: CloudWatchLogs;
  private logGroupName: string;
  private logStreamName: string;

  constructor(logGroupName?: string) {
    this.cloudWatchLogs = new CloudWatchLogs();
    this.logGroupName = logGroupName || process.env.AUDIT_LOG_GROUP || '/aws/inventory-replenishment/audit';
    this.logStreamName = `${new Date().toISOString().split('T')[0]}-${process.env.AWS_LAMBDA_FUNCTION_NAME}`;
  }

  /**
   * Logs an audit event to CloudWatch Logs
   */
  async logEvent(event: AuditEvent): Promise<void> {
    try {
      await this.ensureLogStream();
      
      const logEvent = {
        timestamp: Date.now(),
        message: JSON.stringify({
          ...event,
          level: 'AUDIT',
          service: 'inventory-replenishment',
          version: process.env.AWS_LAMBDA_FUNCTION_VERSION || '1.0',
        }),
      };

      await this.cloudWatchLogs.putLogEvents({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent],
      }).promise();

    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main function
    }
  }

  /**
   * Logs data access events
   */
  async logDataAccess(
    resource: string,
    action: string,
    context: Context,
    userId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.logEvent({
      eventType: 'DATA_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      details,
      success: true,
    });
  }

  /**
   * Logs data modification events
   */
  async logDataModification(
    resource: string,
    action: string,
    context: Context,
    userId?: string,
    oldValue?: any,
    newValue?: any
  ): Promise<void> {
    await this.logEvent({
      eventType: 'DATA_MODIFICATION',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      details: {
        oldValue: this.sanitizeData(oldValue),
        newValue: this.sanitizeData(newValue),
      },
      success: true,
    });
  }

  /**
   * Logs authentication events
   */
  async logAuthentication(
    userId: string,
    action: string,
    context: Context,
    success: boolean,
    sourceIp?: string,
    userAgent?: string,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'AUTHENTICATION',
      userId,
      resource: 'auth',
      action,
      timestamp: new Date().toISOString(),
      sourceIp,
      userAgent,
      requestId: context.awsRequestId,
      success,
      errorMessage,
    });
  }

  /**
   * Logs authorization events
   */
  async logAuthorization(
    userId: string,
    resource: string,
    action: string,
    context: Context,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'AUTHORIZATION',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      success,
      errorMessage,
    });
  }

  /**
   * Logs system errors
   */
  async logSystemError(
    resource: string,
    action: string,
    context: Context,
    error: Error,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      eventType: 'SYSTEM_ERROR',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId,
      success: false,
      errorMessage: error.message,
      details: {
        stack: error.stack,
        name: error.name,
      },
    });
  }

  /**
   * Ensures the log stream exists
   */
  private async ensureLogStream(): Promise<void> {
    try {
      await this.cloudWatchLogs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
      }).promise();
    } catch (error: any) {
      // Log stream might already exist, ignore ResourceAlreadyExistsException
      if (error.code !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  /**
   * Sanitizes sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'ssn', 'creditcard', 'credit_card', 'cvv', 'pin'
    ];

    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }

      // Recursively sanitize nested objects
      for (const key in sanitized) {
        if (typeof sanitized[key] === 'object') {
          sanitized[key] = this.sanitizeData(sanitized[key]);
        }
      }

      return sanitized;
    }

    return data;
  }
}

/**
 * Middleware function to automatically log API requests
 */
export function auditMiddleware(auditLogger: AuditLogger) {
  return (handler: Function) => {
    return async (event: any, context: Context) => {
      const startTime = Date.now();
      let result: any;
      let error: Error | null = null;

      try {
        // Log the incoming request
        await auditLogger.logDataAccess(
          event.resource || 'api',
          event.httpMethod || 'INVOKE',
          context,
          event.requestContext?.identity?.userArn,
          {
            path: event.path,
            queryStringParameters: event.queryStringParameters,
            headers: this.sanitizeHeaders(event.headers),
          }
        );

        result = await handler(event, context);
        return result;

      } catch (err: any) {
        error = err;
        await auditLogger.logSystemError(
          event.resource || 'api',
          event.httpMethod || 'INVOKE',
          context,
          err,
          event.requestContext?.identity?.userArn
        );
        throw err;

      } finally {
        // Log the response
        const duration = Date.now() - startTime;
        await auditLogger.logEvent({
          eventType: 'DATA_ACCESS',
          userId: event.requestContext?.identity?.userArn,
          resource: event.resource || 'api',
          action: `${event.httpMethod || 'INVOKE'}_RESPONSE`,
          timestamp: new Date().toISOString(),
          requestId: context.awsRequestId,
          success: !error,
          errorMessage: error?.message,
          details: {
            duration,
            statusCode: result?.statusCode,
            responseSize: result?.body ? result.body.length : 0,
          },
        });
      }
    };
  };

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}