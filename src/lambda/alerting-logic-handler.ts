import { APIGatewayProxyEvent, APIGatewayProxyResult, ScheduledEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AlertThresholdManager } from './alert-threshold-manager';
import { AlertSuppressionService } from './alert-suppression-service';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});
const bedrockClient = new BedrockRuntimeClient({});

// Initialize alert management services
const thresholdManager = new AlertThresholdManager();
const suppressionService = new AlertSuppressionService();

const SPARE_PARTS_TABLE = process.env.SPARE_PARTS_TABLE!;
const DEMAND_FORECAST_TABLE = process.env.DEMAND_FORECAST_TABLE!;
const RECOMMENDATIONS_TABLE = process.env.RECOMMENDATIONS_TABLE!;
const SUPPLIER_METRICS_TABLE = process.env.SUPPLIER_METRICS_TABLE!;
const NOTIFICATION_PREFERENCES_TABLE = process.env.NOTIFICATION_PREFERENCES_TABLE!;
const NOTIFICATION_HISTORY_TABLE = process.env.NOTIFICATION_HISTORY_TABLE!;
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID!;

// SNS Topic ARNs
const TOPIC_ARNS = {
  alerts: process.env.ALERTS_TOPIC_ARN!,
  stockout: process.env.STOCKOUT_ALERTS_TOPIC_ARN!,
  costOptimization: process.env.COST_OPTIMIZATION_TOPIC_ARN!,
  predictive: process.env.PREDICTIVE_ALERTS_TOPIC_ARN!,
  system: process.env.SYSTEM_ALERTS_TOPIC_ARN!,
};

interface AlertThreshold {
  type: 'inventory' | 'cost' | 'predictive' | 'system';
  condition: 'below' | 'above' | 'equals' | 'change';
  value: number;
  partNumber?: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface AlertContext {
  partNumber?: string;
  currentValue: number;
  threshold: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  forecastDays?: number;
  costImpact?: number;
  supplierInfo?: any;
  historicalData?: any[];
}

export const handler = async (
  event: APIGatewayProxyEvent | ScheduledEvent
): Promise<APIGatewayProxyResult | void> => {
  console.log('Alerting logic handler event:', JSON.stringify(event, null, 2));

  try {
    // Handle scheduled events (CloudWatch Events)
    if ('source' in event && event.source === 'aws.events') {
      await handleScheduledEvaluation();
      return;
    }

    // Handle API Gateway events
    const apiEvent = event as APIGatewayProxyEvent;
    const { httpMethod, resource, body } = apiEvent;

    switch (resource) {
      case '/alerting/trigger':
        return await handleTriggerAlert(httpMethod, body);
      
      case '/alerting/evaluate':
        return await handleEvaluateAlerts(httpMethod, body);
      
      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Endpoint not found' }),
        };
    }
  } catch (error) {
    console.error('Error in alerting logic handler:', error);
    
    if ('source' in event && event.source === 'aws.events') {
      // For scheduled events, just log the error
      return;
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

async function handleTriggerAlert(method: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  try {
    const { alertType, partNumber, context } = JSON.parse(body);

    if (!alertType) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'alertType is required' }),
      };
    }

    const alertResult = await triggerAlert(alertType, partNumber, context);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Alert triggered successfully',
        alertId: alertResult.alertId,
        notificationsSent: alertResult.notificationsSent,
      }),
    };
  } catch (error) {
    console.error('Error triggering alert:', error);
    throw error;
  }
}

async function handleEvaluateAlerts(method: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const evaluationResults = await evaluateAllAlerts();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Alert evaluation completed',
        results: evaluationResults,
      }),
    };
  } catch (error) {
    console.error('Error evaluating alerts:', error);
    throw error;
  }
}

async function handleScheduledEvaluation(): Promise<void> {
  console.log('Running scheduled alert evaluation');
  
  try {
    const results = await evaluateAllAlerts();
    console.log('Scheduled evaluation results:', results);
  } catch (error) {
    console.error('Error in scheduled evaluation:', error);
    
    // Send system alert about evaluation failure
    await triggerAlert('system', undefined, {
      currentValue: 0,
      threshold: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      urgencyLevel: 'high',
    });
  }
}

async function evaluateAllAlerts(): Promise<any> {
  const results = {
    inventoryAlerts: 0,
    predictiveAlerts: 0,
    costOptimizationAlerts: 0,
    systemAlerts: 0,
    totalNotifications: 0,
    suppressedAlerts: 0,
  };

  try {
    // Use the new threshold manager for comprehensive alert evaluation
    const inventoryAlerts = await thresholdManager.evaluateInventoryThresholds();
    results.inventoryAlerts = inventoryAlerts.length;

    // Get demand forecasts for predictive analysis
    const forecastCommand = new ScanCommand({
      TableName: DEMAND_FORECAST_TABLE,
      FilterExpression: 'forecastDate >= :today',
      ExpressionAttributeValues: {
        ':today': new Date().toISOString().split('T')[0],
      },
    });
    const forecastResult = await docClient.send(forecastCommand);
    const forecasts = forecastResult.Items || [];

    const predictiveAlerts = await thresholdManager.evaluatePredictiveThresholds(forecasts);
    results.predictiveAlerts = predictiveAlerts.length;

    // Evaluate cost optimization alerts
    const costAlerts = await thresholdManager.evaluateCostOptimizationThresholds();
    results.costOptimizationAlerts = costAlerts.length;

    // Process all alerts through suppression logic
    const allAlerts = [...inventoryAlerts, ...predictiveAlerts, ...costAlerts];
    
    for (const alert of allAlerts) {
      const suppressionCheck = await suppressionService.shouldSuppressAlert(
        alert.alertType,
        alert.partNumber,
        alert.urgencyLevel,
        'system' // Default user for system-generated alerts
      );

      if (suppressionCheck.suppress) {
        results.suppressedAlerts++;
        console.log(`Alert suppressed: ${alert.alertType} for ${alert.partNumber} - ${suppressionCheck.reason}`);
        continue;
      }

      // Check manual suppression rules
      const manualSuppression = await suppressionService.isManuallySupressed(
        alert.alertType,
        alert.partNumber
      );

      if (manualSuppression.suppressed) {
        results.suppressedAlerts++;
        console.log(`Alert manually suppressed: ${alert.alertType} for ${alert.partNumber}`);
        continue;
      }

      // Send the alert
      const alertResult = await triggerAlert(alert.alertType, alert.partNumber, alert.context);
      results.totalNotifications += alertResult.notificationsSent;
    }

  } catch (error) {
    console.error('Error in evaluateAllAlerts:', error);
    results.systemAlerts = 1;
    
    // Send system alert about evaluation failure
    await triggerAlert('system', undefined, {
      currentValue: 0,
      threshold: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      urgencyLevel: 'high',
    });
  }

  return results;
}

// Alert evaluation functions moved to AlertThresholdManager class

async function triggerAlert(
  alertType: string, 
  partNumber?: string, 
  context?: AlertContext
): Promise<{ alertId: string; notificationsSent: number }> {
  const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Generate intelligent alert message using Bedrock
    const alertMessage = await generateAlertMessage(alertType, partNumber, context);
    
    // Determine appropriate SNS topic
    const topicArn = getTopicForAlertType(alertType);
    
    // Publish to SNS topic
    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({
        alertId,
        alertType,
        partNumber,
        message: alertMessage,
        context,
        timestamp: new Date().toISOString(),
      }),
      Subject: `Inventory Alert: ${alertType}${partNumber ? ` - ${partNumber}` : ''}`,
      MessageAttributes: {
        alertType: {
          DataType: 'String',
          StringValue: alertType,
        },
        urgencyLevel: {
          DataType: 'String',
          StringValue: context?.urgencyLevel || 'medium',
        },
        partNumber: partNumber ? {
          DataType: 'String',
          StringValue: partNumber,
        } : undefined,
      },
    });

    await snsClient.send(publishCommand);

    // Record notification in history
    await recordNotificationHistory({
      notificationId: alertId,
      userId: 'system', // System-generated alert
      notificationType: alertType,
      channel: 'sns',
      status: 'sent',
      timestamp: new Date().toISOString(),
      message: alertMessage,
      metadata: { partNumber, context },
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days TTL
    });

    console.log(`Alert ${alertId} triggered successfully for ${alertType}`);
    
    return {
      alertId,
      notificationsSent: 1, // Simplified - in reality would count actual subscribers
    };
  } catch (error) {
    console.error(`Error triggering alert ${alertId}:`, error);
    throw error;
  }
}

async function generateAlertMessage(
  alertType: string, 
  partNumber?: string, 
  context?: AlertContext
): Promise<string> {
  try {
    const prompt = `Generate a concise, actionable alert message for an inventory management system.

Alert Type: ${alertType}
Part Number: ${partNumber || 'N/A'}
Context: ${JSON.stringify(context, null, 2)}

Requirements:
- Be specific and actionable
- Include key metrics and thresholds
- Suggest next steps
- Keep under 200 words
- Use professional tone

Generate the alert message:`;

    const command = new InvokeModelCommand({
      modelId: BEDROCK_MODEL_ID,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text.trim();
  } catch (error) {
    console.error('Error generating alert message with Bedrock:', error);
    
    // Fallback to template-based message
    return generateFallbackMessage(alertType, partNumber, context);
  }
}

function generateFallbackMessage(
  alertType: string, 
  partNumber?: string, 
  context?: AlertContext
): string {
  switch (alertType) {
    case 'stockout':
      return `STOCKOUT ALERT: ${partNumber} has ${context?.currentValue || 0} units remaining (threshold: ${context?.threshold || 0}). Immediate replenishment required.`;
    
    case 'predictive':
      return `PREDICTIVE ALERT: ${partNumber} is projected to stock out in ${context?.forecastDays || 'unknown'} days based on demand forecasting. Consider placing order now.`;
    
    case 'costOptimization':
      return `COST OPTIMIZATION: Opportunity to save $${context?.costImpact || 0} on ${partNumber}. Review supplier options and bulk purchasing opportunities.`;
    
    case 'system':
      return `SYSTEM ALERT: Inventory management system requires attention. ${context?.error || 'Unknown issue detected'}.`;
    
    default:
      return `INVENTORY ALERT: ${alertType} alert triggered for ${partNumber || 'system'}. Please review inventory status.`;
  }
}

function getTopicForAlertType(alertType: string): string {
  switch (alertType) {
    case 'stockout':
      return TOPIC_ARNS.stockout;
    case 'predictive':
      return TOPIC_ARNS.predictive;
    case 'costOptimization':
      return TOPIC_ARNS.costOptimization;
    case 'system':
      return TOPIC_ARNS.system;
    default:
      return TOPIC_ARNS.alerts;
  }
}

async function recordNotificationHistory(notification: any): Promise<void> {
  try {
    const command = new PutCommand({
      TableName: NOTIFICATION_HISTORY_TABLE,
      Item: notification,
    });

    await docClient.send(command);
  } catch (error) {
    console.error('Error recording notification history:', error);
    // Don't throw - this is not critical for alert functionality
  }
}