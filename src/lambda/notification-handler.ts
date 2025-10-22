import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, SubscribeCommand, UnsubscribeCommand, ListSubscriptionsByTopicCommand } from '@aws-sdk/client-sns';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const NOTIFICATION_PREFERENCES_TABLE = process.env.NOTIFICATION_PREFERENCES_TABLE!;
const NOTIFICATION_HISTORY_TABLE = process.env.NOTIFICATION_HISTORY_TABLE!;

// SNS Topic ARNs
const TOPIC_ARNS = {
  alerts: process.env.ALERTS_TOPIC_ARN!,
  stockout: process.env.STOCKOUT_ALERTS_TOPIC_ARN!,
  costOptimization: process.env.COST_OPTIMIZATION_TOPIC_ARN!,
  predictive: process.env.PREDICTIVE_ALERTS_TOPIC_ARN!,
  system: process.env.SYSTEM_ALERTS_TOPIC_ARN!,
};

interface NotificationPreference {
  userId: string;
  notificationType: string;
  enabled: boolean;
  channels: string[]; // ['email', 'sms', 'push']
  email?: string;
  phoneNumber?: string;
  thresholds?: {
    stockLevel?: number;
    costSavings?: number;
    urgencyLevel?: string;
  };
  frequency?: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quietHours?: {
    start: string;
    end: string;
    timezone: string;
  };
}

interface NotificationHistory {
  notificationId: string;
  userId: string;
  notificationType: string;
  channel: string;
  status: 'sent' | 'delivered' | 'failed' | 'bounced';
  timestamp: string;
  message: string;
  metadata?: any;
  ttl: number;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Notification handler event:', JSON.stringify(event, null, 2));

  try {
    const { httpMethod, resource, pathParameters, queryStringParameters, body } = event;
    const userId = event.headers['x-user-id'] || 'default-user'; // In real app, extract from JWT

    switch (resource) {
      case '/notifications/preferences':
        return await handlePreferences(httpMethod, userId, body);
      
      case '/notifications/history':
        return await handleHistory(httpMethod, userId, queryStringParameters);
      
      case '/notifications/subscriptions':
        return await handleSubscriptions(httpMethod, userId, body);
      
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
    console.error('Error in notification handler:', error);
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

async function handlePreferences(
  method: string, 
  userId: string, 
  body: string | null
): Promise<APIGatewayProxyResult> {
  switch (method) {
    case 'GET':
      return await getUserPreferences(userId);
    
    case 'POST':
      return await createUserPreferences(userId, body);
    
    case 'PUT':
      return await updateUserPreferences(userId, body);
    
    default:
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
  }
}

async function getUserPreferences(userId: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: NOTIFICATION_PREFERENCES_TABLE,
      Key: { userId },
    });

    const result = await docClient.send(command);
    
    if (!result.Item) {
      // Return default preferences if none exist
      const defaultPreferences = getDefaultPreferences(userId);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(defaultPreferences),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
}

async function createUserPreferences(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
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
    const preferences: NotificationPreference = JSON.parse(body);
    preferences.userId = userId;

    // Validate preferences
    const validationError = validatePreferences(preferences);
    if (validationError) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: validationError }),
      };
    }

    const command = new PutCommand({
      TableName: NOTIFICATION_PREFERENCES_TABLE,
      Item: {
        ...preferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Preferences created successfully', preferences }),
    };
  } catch (error) {
    console.error('Error creating user preferences:', error);
    throw error;
  }
}

async function updateUserPreferences(userId: string, body: string | null): Promise<APIGatewayProxyResult> {
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
    const updates = JSON.parse(body);
    
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: { [key: string]: string } = {};
    const expressionAttributeValues: { [key: string]: any } = {};

    Object.keys(updates).forEach((key, index) => {
      if (key !== 'userId') {
        const attrName = `#attr${index}`;
        const attrValue = `:val${index}`;
        updateExpressions.push(`${attrName} = ${attrValue}`);
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = updates[key];
      }
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: NOTIFICATION_PREFERENCES_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    const result = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        message: 'Preferences updated successfully', 
        preferences: result.Attributes 
      }),
    };
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
}

async function handleHistory(
  method: string, 
  userId: string, 
  queryParams: { [key: string]: string } | null
): Promise<APIGatewayProxyResult> {
  if (method !== 'GET') {
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
    const limit = queryParams?.limit ? parseInt(queryParams.limit) : 50;
    const status = queryParams?.status;
    const notificationType = queryParams?.notificationType;

    let command;

    if (status) {
      // Query by user and status using GSI
      command = new QueryCommand({
        TableName: NOTIFICATION_HISTORY_TABLE,
        IndexName: 'UserStatusIndex',
        KeyConditionExpression: 'userId = :userId AND #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':userId': userId,
          ':status': status,
        },
        Limit: limit,
        ScanIndexForward: false, // Most recent first
      });
    } else {
      // Scan for all user notifications (less efficient but simpler for demo)
      command = new ScanCommand({
        TableName: NOTIFICATION_HISTORY_TABLE,
        FilterExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
        Limit: limit,
      });
    }

    const result = await docClient.send(command);

    let notifications = result.Items || [];

    // Filter by notification type if specified
    if (notificationType) {
      notifications = notifications.filter(n => n.notificationType === notificationType);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        notifications,
        count: notifications.length,
        lastEvaluatedKey: result.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error('Error getting notification history:', error);
    throw error;
  }
}

async function handleSubscriptions(
  method: string, 
  userId: string, 
  body: string | null
): Promise<APIGatewayProxyResult> {
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
    const { notificationType, channel, endpoint } = JSON.parse(body);

    if (!notificationType || !channel || !endpoint) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'notificationType, channel, and endpoint are required' 
        }),
      };
    }

    const topicArn = TOPIC_ARNS[notificationType as keyof typeof TOPIC_ARNS];
    if (!topicArn) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid notification type' }),
      };
    }

    switch (method) {
      case 'POST':
        return await subscribeToTopic(topicArn, channel, endpoint, userId);
      
      case 'DELETE':
        return await unsubscribeFromTopic(topicArn, endpoint);
      
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error handling subscriptions:', error);
    throw error;
  }
}

async function subscribeToTopic(
  topicArn: string, 
  protocol: string, 
  endpoint: string, 
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: protocol, // 'email' or 'sms'
      Endpoint: endpoint,
      Attributes: {
        FilterPolicy: JSON.stringify({ userId: [userId] }),
      },
    });

    const result = await snsClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Subscription created successfully',
        subscriptionArn: result.SubscriptionArn,
      }),
    };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
}

async function unsubscribeFromTopic(
  topicArn: string, 
  endpoint: string
): Promise<APIGatewayProxyResult> {
  try {
    // First, find the subscription ARN
    const listCommand = new ListSubscriptionsByTopicCommand({
      TopicArn: topicArn,
    });

    const subscriptions = await snsClient.send(listCommand);
    const subscription = subscriptions.Subscriptions?.find(
      sub => sub.Endpoint === endpoint
    );

    if (!subscription || !subscription.SubscriptionArn) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Subscription not found' }),
      };
    }

    const unsubscribeCommand = new UnsubscribeCommand({
      SubscriptionArn: subscription.SubscriptionArn,
    });

    await snsClient.send(unsubscribeCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ message: 'Unsubscribed successfully' }),
    };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
}

function getDefaultPreferences(userId: string): NotificationPreference {
  return {
    userId,
    notificationType: 'all',
    enabled: true,
    channels: ['email'],
    thresholds: {
      stockLevel: 10,
      costSavings: 100,
      urgencyLevel: 'medium',
    },
    frequency: 'immediate',
    quietHours: {
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
  };
}

function validatePreferences(preferences: NotificationPreference): string | null {
  if (!preferences.userId) {
    return 'userId is required';
  }

  if (!preferences.notificationType) {
    return 'notificationType is required';
  }

  if (!Array.isArray(preferences.channels) || preferences.channels.length === 0) {
    return 'At least one notification channel is required';
  }

  const validChannels = ['email', 'sms', 'push'];
  const invalidChannels = preferences.channels.filter(c => !validChannels.includes(c));
  if (invalidChannels.length > 0) {
    return `Invalid channels: ${invalidChannels.join(', ')}`;
  }

  if (preferences.channels.includes('email') && !preferences.email) {
    return 'Email address is required when email channel is enabled';
  }

  if (preferences.channels.includes('sms') && !preferences.phoneNumber) {
    return 'Phone number is required when SMS channel is enabled';
  }

  return null;
}