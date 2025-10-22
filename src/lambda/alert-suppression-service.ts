import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { UrgencyLevel, NotificationFrequency, QuietHours } from '../types/notifications';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

interface AlertSuppressionRule {
  alertId: string;
  partNumber?: string;
  alertType: string;
  suppressedUntil: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

interface AlertCooldown {
  key: string;
  lastSent: string;
  count: number;
  cooldownUntil: string;
}

export class AlertSuppressionService {
  private readonly NOTIFICATION_HISTORY_TABLE: string;
  private readonly NOTIFICATION_PREFERENCES_TABLE: string;

  constructor() {
    this.NOTIFICATION_HISTORY_TABLE = process.env.NOTIFICATION_HISTORY_TABLE!;
    this.NOTIFICATION_PREFERENCES_TABLE = process.env.NOTIFICATION_PREFERENCES_TABLE!;
  }

  /**
   * Check if an alert should be suppressed based on various rules
   */
  async shouldSuppressAlert(
    alertType: string,
    partNumber: string | undefined,
    urgencyLevel: UrgencyLevel,
    userId: string
  ): Promise<{
    suppress: boolean;
    reason?: string;
    nextAllowedTime?: string;
  }> {
    try {
      // Check user quiet hours
      const quietHoursCheck = await this.checkQuietHours(userId);
      if (quietHoursCheck.suppress && urgencyLevel !== 'critical') {
        return quietHoursCheck;
      }

      // Check frequency limits
      const frequencyCheck = await this.checkFrequencyLimits(alertType, partNumber, userId);
      if (frequencyCheck.suppress) {
        return frequencyCheck;
      }

      // Check cooldown periods
      const cooldownCheck = await this.checkCooldownPeriod(alertType, partNumber, urgencyLevel);
      if (cooldownCheck.suppress) {
        return cooldownCheck;
      }

      // Check duplicate alerts
      const duplicateCheck = await this.checkDuplicateAlerts(alertType, partNumber, userId);
      if (duplicateCheck.suppress) {
        return duplicateCheck;
      }

      // Check alert escalation rules
      const escalationCheck = await this.checkEscalationRules(alertType, partNumber, urgencyLevel, userId);
      if (escalationCheck.suppress) {
        return escalationCheck;
      }

      return { suppress: false };
    } catch (error) {
      console.error('Error checking alert suppression:', error);
      // In case of error, don't suppress critical alerts
      return { suppress: urgencyLevel !== 'critical' };
    }
  }

  /**
   * Check if current time falls within user's quiet hours
   */
  private async checkQuietHours(userId: string): Promise<{
    suppress: boolean;
    reason?: string;
    nextAllowedTime?: string;
  }> {
    try {
      const command = new GetCommand({
        TableName: this.NOTIFICATION_PREFERENCES_TABLE,
        Key: { userId },
      });

      const result = await docClient.send(command);
      const preferences = result.Item;

      if (!preferences || !preferences.quietHours || !preferences.quietHours.enabled) {
        return { suppress: false };
      }

      const { start, end, timezone } = preferences.quietHours;
      const now = new Date();
      
      // Convert to user's timezone (simplified - in production use proper timezone library)
      const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone || 'UTC' }));
      const currentHour = userTime.getHours();
      const currentMinute = userTime.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      let inQuietHours = false;
      let nextAllowedTime: string | undefined;

      if (startTime <= endTime) {
        // Same day quiet hours (e.g., 22:00 - 08:00 next day)
        inQuietHours = currentTime >= startTime && currentTime < endTime;
        if (inQuietHours) {
          const nextAllowed = new Date(userTime);
          nextAllowed.setHours(endHour, endMinute, 0, 0);
          nextAllowedTime = nextAllowed.toISOString();
        }
      } else {
        // Overnight quiet hours (e.g., 22:00 - 08:00 next day)
        inQuietHours = currentTime >= startTime || currentTime < endTime;
        if (inQuietHours) {
          const nextAllowed = new Date(userTime);
          if (currentTime >= startTime) {
            // Currently in evening quiet hours, next allowed is morning
            nextAllowed.setDate(nextAllowed.getDate() + 1);
            nextAllowed.setHours(endHour, endMinute, 0, 0);
          } else {
            // Currently in morning quiet hours, next allowed is today
            nextAllowed.setHours(endHour, endMinute, 0, 0);
          }
          nextAllowedTime = nextAllowed.toISOString();
        }
      }

      return {
        suppress: inQuietHours,
        reason: inQuietHours ? 'User quiet hours active' : undefined,
        nextAllowedTime,
      };
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return { suppress: false };
    }
  }

  /**
   * Check frequency limits based on user preferences
   */
  private async checkFrequencyLimits(
    alertType: string,
    partNumber: string | undefined,
    userId: string
  ): Promise<{
    suppress: boolean;
    reason?: string;
    nextAllowedTime?: string;
  }> {
    try {
      const command = new GetCommand({
        TableName: this.NOTIFICATION_PREFERENCES_TABLE,
        Key: { userId },
      });

      const result = await docClient.send(command);
      const preferences = result.Item;

      if (!preferences || !preferences.frequency) {
        return { suppress: false };
      }

      const frequency: NotificationFrequency = preferences.frequency;
      
      // Get recent notifications for this user and alert type
      const recentNotifications = await this.getRecentNotifications(userId, alertType, partNumber);
      
      if (recentNotifications.length === 0) {
        return { suppress: false };
      }

      const lastNotification = recentNotifications[0];
      const lastSentTime = new Date(lastNotification.timestamp);
      const now = new Date();

      let minInterval: number; // in minutes
      let nextAllowedTime: Date;

      switch (frequency) {
        case 'immediate':
          return { suppress: false };
        
        case 'hourly':
          minInterval = 60;
          break;
        
        case 'daily':
          minInterval = 24 * 60;
          break;
        
        case 'weekly':
          minInterval = 7 * 24 * 60;
          break;
        
        case 'monthly':
          minInterval = 30 * 24 * 60;
          break;
        
        default:
          return { suppress: false };
      }

      nextAllowedTime = new Date(lastSentTime.getTime() + minInterval * 60 * 1000);
      
      if (now < nextAllowedTime) {
        return {
          suppress: true,
          reason: `Frequency limit: ${frequency}`,
          nextAllowedTime: nextAllowedTime.toISOString(),
        };
      }

      return { suppress: false };
    } catch (error) {
      console.error('Error checking frequency limits:', error);
      return { suppress: false };
    }
  }

  /**
   * Check cooldown periods to prevent alert spam
   */
  private async checkCooldownPeriod(
    alertType: string,
    partNumber: string | undefined,
    urgencyLevel: UrgencyLevel
  ): Promise<{
    suppress: boolean;
    reason?: string;
    nextAllowedTime?: string;
  }> {
    try {
      // Define cooldown periods based on urgency level (in minutes)
      const cooldownPeriods: { [key in UrgencyLevel]: number } = {
        critical: 5,    // 5 minutes
        high: 15,       // 15 minutes
        medium: 60,     // 1 hour
        low: 240,       // 4 hours
      };

      const cooldownMinutes = cooldownPeriods[urgencyLevel];
      const cooldownKey = `${alertType}:${partNumber || 'global'}`;

      // Check recent notifications for this specific alert
      const recentNotifications = await this.getRecentNotifications('system', alertType, partNumber);
      
      if (recentNotifications.length === 0) {
        return { suppress: false };
      }

      const lastNotification = recentNotifications[0];
      const lastSentTime = new Date(lastNotification.timestamp);
      const now = new Date();
      const nextAllowedTime = new Date(lastSentTime.getTime() + cooldownMinutes * 60 * 1000);

      if (now < nextAllowedTime) {
        return {
          suppress: true,
          reason: `Cooldown period active (${cooldownMinutes} minutes)`,
          nextAllowedTime: nextAllowedTime.toISOString(),
        };
      }

      return { suppress: false };
    } catch (error) {
      console.error('Error checking cooldown period:', error);
      return { suppress: false };
    }
  }

  /**
   * Check for duplicate alerts within a time window
   */
  private async checkDuplicateAlerts(
    alertType: string,
    partNumber: string | undefined,
    userId: string
  ): Promise<{
    suppress: boolean;
    reason?: string;
  }> {
    try {
      // Look for identical alerts in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentNotifications = await this.getRecentNotifications(userId, alertType, partNumber, oneHourAgo);
      
      // If we find identical alerts in the last hour, suppress
      const duplicates = recentNotifications.filter(notification => {
        const metadata = notification.metadata;
        return metadata && 
               metadata.alertType === alertType && 
               metadata.partNumber === partNumber;
      });

      if (duplicates.length > 0) {
        return {
          suppress: true,
          reason: `Duplicate alert within last hour`,
        };
      }

      return { suppress: false };
    } catch (error) {
      console.error('Error checking duplicate alerts:', error);
      return { suppress: false };
    }
  }

  /**
   * Check escalation rules - suppress lower priority alerts if higher priority exists
   */
  private async checkEscalationRules(
    alertType: string,
    partNumber: string | undefined,
    urgencyLevel: UrgencyLevel,
    userId: string
  ): Promise<{
    suppress: boolean;
    reason?: string;
  }> {
    try {
      if (!partNumber) {
        return { suppress: false };
      }

      // Get recent alerts for this part
      const recentNotifications = await this.getRecentNotifications(userId, undefined, partNumber);
      
      // Check if there's a higher priority alert for the same part
      const urgencyOrder: { [key in UrgencyLevel]: number } = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };

      const currentPriority = urgencyOrder[urgencyLevel];
      
      for (const notification of recentNotifications) {
        const metadata = notification.metadata;
        if (metadata && metadata.partNumber === partNumber) {
          const existingPriority = urgencyOrder[metadata.urgencyLevel as UrgencyLevel] || 0;
          
          // If there's a higher or equal priority alert in the last 4 hours, suppress lower priority
          const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
          const notificationTime = new Date(notification.timestamp);
          
          if (notificationTime > fourHoursAgo && existingPriority >= currentPriority) {
            return {
              suppress: true,
              reason: `Higher priority alert exists for ${partNumber}`,
            };
          }
        }
      }

      return { suppress: false };
    } catch (error) {
      console.error('Error checking escalation rules:', error);
      return { suppress: false };
    }
  }

  /**
   * Get recent notifications for filtering
   */
  private async getRecentNotifications(
    userId: string,
    alertType?: string,
    partNumber?: string,
    since?: Date
  ): Promise<any[]> {
    try {
      const sinceTime = since || new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours by default
      
      let command;
      
      if (userId === 'system') {
        // For system alerts, scan the table
        command = new QueryCommand({
          TableName: this.NOTIFICATION_HISTORY_TABLE,
          IndexName: 'UserStatusIndex',
          KeyConditionExpression: 'userId = :userId',
          FilterExpression: '#timestamp >= :since',
          ExpressionAttributeNames: {
            '#timestamp': 'timestamp',
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':since': sinceTime.toISOString(),
          },
          ScanIndexForward: false, // Most recent first
          Limit: 50,
        });
      } else {
        // For user-specific alerts
        command = new QueryCommand({
          TableName: this.NOTIFICATION_HISTORY_TABLE,
          IndexName: 'UserStatusIndex',
          KeyConditionExpression: 'userId = :userId',
          FilterExpression: '#timestamp >= :since',
          ExpressionAttributeNames: {
            '#timestamp': 'timestamp',
          },
          ExpressionAttributeValues: {
            ':userId': userId,
            ':since': sinceTime.toISOString(),
          },
          ScanIndexForward: false,
          Limit: 50,
        });
      }

      const result = await docClient.send(command);
      let notifications = result.Items || [];

      // Apply additional filters
      if (alertType) {
        notifications = notifications.filter(n => n.notificationType === alertType);
      }

      if (partNumber) {
        notifications = notifications.filter(n => 
          n.metadata && n.metadata.partNumber === partNumber
        );
      }

      return notifications;
    } catch (error) {
      console.error('Error getting recent notifications:', error);
      return [];
    }
  }

  /**
   * Create a manual suppression rule
   */
  async createSuppressionRule(
    alertType: string,
    partNumber: string | undefined,
    suppressionDurationHours: number,
    reason: string,
    createdBy: string
  ): Promise<string> {
    try {
      const suppressionId = `suppression-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const suppressedUntil = new Date(Date.now() + suppressionDurationHours * 60 * 60 * 1000);

      const suppressionRule: AlertSuppressionRule = {
        alertId: suppressionId,
        partNumber,
        alertType,
        suppressedUntil: suppressedUntil.toISOString(),
        reason,
        createdBy,
        createdAt: new Date().toISOString(),
      };

      const command = new PutCommand({
        TableName: this.NOTIFICATION_HISTORY_TABLE,
        Item: {
          notificationId: suppressionId,
          userId: 'system',
          notificationType: 'suppression',
          channel: 'system',
          status: 'active',
          timestamp: new Date().toISOString(),
          message: `Alert suppression: ${alertType}${partNumber ? ` for ${partNumber}` : ''}`,
          metadata: suppressionRule,
          ttl: Math.floor(suppressedUntil.getTime() / 1000),
        },
      });

      await docClient.send(command);

      console.log(`Created suppression rule ${suppressionId} for ${alertType}`);
      return suppressionId;
    } catch (error) {
      console.error('Error creating suppression rule:', error);
      throw error;
    }
  }

  /**
   * Check if an alert is manually suppressed
   */
  async isManuallySupressed(
    alertType: string,
    partNumber: string | undefined
  ): Promise<{
    suppressed: boolean;
    rule?: AlertSuppressionRule;
  }> {
    try {
      // Query for active suppression rules
      const command = new QueryCommand({
        TableName: this.NOTIFICATION_HISTORY_TABLE,
        IndexName: 'UserStatusIndex',
        KeyConditionExpression: 'userId = :userId AND #status = :status',
        FilterExpression: 'notificationType = :type',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':userId': 'system',
          ':status': 'active',
          ':type': 'suppression',
        },
      });

      const result = await docClient.send(command);
      const suppressionRules = result.Items || [];

      for (const rule of suppressionRules) {
        const metadata = rule.metadata as AlertSuppressionRule;
        if (metadata && 
            metadata.alertType === alertType && 
            metadata.partNumber === partNumber) {
          
          const suppressedUntil = new Date(metadata.suppressedUntil);
          if (new Date() < suppressedUntil) {
            return {
              suppressed: true,
              rule: metadata,
            };
          }
        }
      }

      return { suppressed: false };
    } catch (error) {
      console.error('Error checking manual suppression:', error);
      return { suppressed: false };
    }
  }
}