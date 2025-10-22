import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AlertRule, AlertCondition, NotificationThresholds, UrgencyLevel } from '../types/notifications';

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export class AlertThresholdManager {
  private readonly SPARE_PARTS_TABLE: string;
  private readonly NOTIFICATION_PREFERENCES_TABLE: string;
  private readonly SUPPLIER_METRICS_TABLE: string;

  constructor() {
    this.SPARE_PARTS_TABLE = process.env.SPARE_PARTS_TABLE!;
    this.NOTIFICATION_PREFERENCES_TABLE = process.env.NOTIFICATION_PREFERENCES_TABLE!;
    this.SUPPLIER_METRICS_TABLE = process.env.SUPPLIER_METRICS_TABLE!;
  }

  /**
   * Evaluate threshold-based alerts for inventory levels
   */
  async evaluateInventoryThresholds(): Promise<Array<{
    partNumber: string;
    alertType: string;
    urgencyLevel: UrgencyLevel;
    context: any;
  }>> {
    const alerts: any[] = [];

    try {
      const command = new ScanCommand({
        TableName: this.SPARE_PARTS_TABLE,
      });

      const result = await docClient.send(command);
      const spareParts = result.Items || [];

      for (const part of spareParts) {
        const thresholdAlerts = await this.evaluatePartThresholds(part);
        alerts.push(...thresholdAlerts);
      }
    } catch (error) {
      console.error('Error evaluating inventory thresholds:', error);
      throw error;
    }

    return alerts;
  }

  /**
   * Evaluate thresholds for a specific spare part
   */
  private async evaluatePartThresholds(part: any): Promise<any[]> {
    const alerts: any[] = [];
    const { 
      partNumber, 
      currentStock, 
      safetyStock, 
      reorderPoint, 
      maxStock,
      leadTimeDays = 14,
      averageDemand = 0,
      category 
    } = part;

    // Critical stockout alert
    if (currentStock <= 0) {
      alerts.push({
        partNumber,
        alertType: 'stockout',
        urgencyLevel: 'critical' as UrgencyLevel,
        context: {
          partNumber,
          currentValue: currentStock,
          threshold: 0,
          message: `CRITICAL: ${partNumber} is completely out of stock`,
          trend: 'decreasing',
          actionRequired: 'Immediate emergency procurement required',
        },
      });
    }
    // Safety stock breach
    else if (currentStock <= safetyStock) {
      const urgency = currentStock <= (safetyStock * 0.5) ? 'high' : 'medium';
      alerts.push({
        partNumber,
        alertType: 'lowStock',
        urgencyLevel: urgency as UrgencyLevel,
        context: {
          partNumber,
          currentValue: currentStock,
          threshold: safetyStock,
          message: `${partNumber} below safety stock level`,
          daysOfStock: averageDemand > 0 ? Math.floor(currentStock / averageDemand) : null,
          actionRequired: 'Review replenishment schedule',
        },
      });
    }
    // Reorder point reached
    else if (currentStock <= reorderPoint) {
      alerts.push({
        partNumber,
        alertType: 'reorderPoint',
        urgencyLevel: 'medium' as UrgencyLevel,
        context: {
          partNumber,
          currentValue: currentStock,
          threshold: reorderPoint,
          message: `${partNumber} has reached reorder point`,
          leadTimeDays,
          actionRequired: 'Initiate replenishment order',
        },
      });
    }

    // Overstock alert
    if (maxStock && currentStock >= maxStock) {
      alerts.push({
        partNumber,
        alertType: 'overstock',
        urgencyLevel: 'low' as UrgencyLevel,
        context: {
          partNumber,
          currentValue: currentStock,
          threshold: maxStock,
          message: `${partNumber} exceeds maximum stock level`,
          carryingCostImpact: this.calculateCarryingCost(currentStock - maxStock, part),
          actionRequired: 'Consider reducing future orders or liquidating excess',
        },
      });
    }

    // Slow-moving inventory alert
    const slowMovingThreshold = await this.getSlowMovingThreshold(category);
    if (averageDemand < slowMovingThreshold && currentStock > safetyStock) {
      alerts.push({
        partNumber,
        alertType: 'slowMoving',
        urgencyLevel: 'low' as UrgencyLevel,
        context: {
          partNumber,
          currentValue: averageDemand,
          threshold: slowMovingThreshold,
          message: `${partNumber} is slow-moving inventory`,
          monthsOfStock: averageDemand > 0 ? Math.floor(currentStock / averageDemand) : null,
          actionRequired: 'Review demand patterns and adjust safety stock',
        },
      });
    }

    return alerts;
  }

  /**
   * Evaluate predictive alerts based on demand forecasting
   */
  async evaluatePredictiveThresholds(forecasts: any[]): Promise<any[]> {
    const alerts: any[] = [];

    // Group forecasts by part number
    const forecastsByPart: { [key: string]: any[] } = {};
    forecasts.forEach(forecast => {
      if (!forecastsByPart[forecast.partNumber]) {
        forecastsByPart[forecast.partNumber] = [];
      }
      forecastsByPart[forecast.partNumber].push(forecast);
    });

    for (const [partNumber, partForecasts] of Object.entries(forecastsByPart)) {
      const predictiveAlerts = await this.evaluatePartPredictiveThresholds(partNumber, partForecasts);
      alerts.push(...predictiveAlerts);
    }

    return alerts;
  }

  /**
   * Evaluate predictive thresholds for a specific part
   */
  private async evaluatePartPredictiveThresholds(partNumber: string, forecasts: any[]): Promise<any[]> {
    const alerts: any[] = [];

    try {
      // Get current part information
      const partCommand = new GetCommand({
        TableName: this.SPARE_PARTS_TABLE,
        Key: { partNumber },
      });

      const partResult = await docClient.send(partCommand);
      const part = partResult.Item;

      if (!part) return alerts;

      const { currentStock, leadTimeDays = 14, safetyStock } = part;

      // Sort forecasts by date
      const sortedForecasts = forecasts.sort((a, b) => 
        new Date(a.forecastDate).getTime() - new Date(b.forecastDate).getTime()
      );

      // Calculate cumulative demand over lead time
      const leadTimeDate = new Date();
      leadTimeDate.setDate(leadTimeDate.getDate() + leadTimeDays);

      let cumulativeDemand = 0;
      let daysUntilStockout = 0;
      let dailyDemand = 0;

      for (const forecast of sortedForecasts) {
        const forecastDate = new Date(forecast.forecastDate);
        if (forecastDate <= leadTimeDate) {
          cumulativeDemand += forecast.predictedDemand;
          dailyDemand = forecast.predictedDemand;
        }
      }

      // Calculate days until stockout
      if (dailyDemand > 0) {
        daysUntilStockout = Math.floor(currentStock / dailyDemand);
      }

      // Predictive stockout alert
      if (currentStock < cumulativeDemand) {
        const urgency = daysUntilStockout <= 7 ? 'high' : 
                      daysUntilStockout <= 14 ? 'medium' : 'low';

        alerts.push({
          partNumber,
          alertType: 'predictiveStockout',
          urgencyLevel: urgency as UrgencyLevel,
          context: {
            partNumber,
            currentValue: currentStock,
            threshold: cumulativeDemand,
            forecastDays: daysUntilStockout,
            leadTimeDays,
            message: `${partNumber} predicted to stock out in ${daysUntilStockout} days`,
            actionRequired: 'Place order immediately to avoid stockout',
          },
        });
      }

      // Demand spike alert
      const averageDemand = forecasts.reduce((sum, f) => sum + f.predictedDemand, 0) / forecasts.length;
      const maxDemand = Math.max(...forecasts.map(f => f.predictedDemand));
      
      if (maxDemand > averageDemand * 2) { // 100% increase threshold
        alerts.push({
          partNumber,
          alertType: 'demandSpike',
          urgencyLevel: 'medium' as UrgencyLevel,
          context: {
            partNumber,
            currentValue: maxDemand,
            threshold: averageDemand * 2,
            spikePercentage: Math.round(((maxDemand - averageDemand) / averageDemand) * 100),
            message: `${partNumber} experiencing demand spike`,
            actionRequired: 'Increase safety stock and review supplier capacity',
          },
        });
      }

      // Seasonal pattern alert
      const seasonalVariation = this.calculateSeasonalVariation(forecasts);
      if (seasonalVariation > 0.5) { // 50% seasonal variation
        alerts.push({
          partNumber,
          alertType: 'seasonalPattern',
          urgencyLevel: 'low' as UrgencyLevel,
          context: {
            partNumber,
            currentValue: seasonalVariation,
            threshold: 0.5,
            message: `${partNumber} shows strong seasonal demand patterns`,
            actionRequired: 'Adjust inventory planning for seasonal variations',
          },
        });
      }

    } catch (error) {
      console.error(`Error evaluating predictive thresholds for ${partNumber}:`, error);
    }

    return alerts;
  }

  /**
   * Evaluate cost optimization opportunities
   */
  async evaluateCostOptimizationThresholds(): Promise<any[]> {
    const alerts: any[] = [];

    try {
      // Get supplier metrics for cost analysis
      const supplierCommand = new ScanCommand({
        TableName: this.SUPPLIER_METRICS_TABLE,
      });

      const supplierResult = await docClient.send(supplierCommand);
      const suppliers = supplierResult.Items || [];

      // Analyze supplier performance and cost opportunities
      for (const supplier of suppliers) {
        const costAlerts = await this.evaluateSupplierCostThresholds(supplier);
        alerts.push(...costAlerts);
      }

      // Analyze bulk purchase opportunities
      const bulkOpportunities = await this.evaluateBulkPurchaseOpportunities();
      alerts.push(...bulkOpportunities);

    } catch (error) {
      console.error('Error evaluating cost optimization thresholds:', error);
    }

    return alerts;
  }

  /**
   * Evaluate supplier-specific cost thresholds
   */
  private async evaluateSupplierCostThresholds(supplier: any): Promise<any[]> {
    const alerts: any[] = [];
    const { 
      supplierId, 
      averageLeadTime, 
      onTimeDeliveryRate, 
      priceStability,
      qualityRating,
      lastOrderDate 
    } = supplier;

    // Lead time degradation alert
    if (averageLeadTime > 21) { // 3 weeks threshold
      alerts.push({
        partNumber: null,
        alertType: 'supplierPerformance',
        urgencyLevel: 'medium' as UrgencyLevel,
        context: {
          supplierId,
          currentValue: averageLeadTime,
          threshold: 21,
          message: `Supplier ${supplierId} has excessive lead times`,
          actionRequired: 'Review supplier performance and consider alternatives',
        },
      });
    }

    // Delivery reliability alert
    if (onTimeDeliveryRate < 0.85) { // 85% threshold
      alerts.push({
        partNumber: null,
        alertType: 'supplierReliability',
        urgencyLevel: 'medium' as UrgencyLevel,
        context: {
          supplierId,
          currentValue: onTimeDeliveryRate,
          threshold: 0.85,
          message: `Supplier ${supplierId} has poor delivery reliability`,
          actionRequired: 'Increase safety stock or find backup supplier',
        },
      });
    }

    // Price volatility alert
    if (priceStability < 0.9) { // 90% price stability threshold
      alerts.push({
        partNumber: null,
        alertType: 'priceVolatility',
        urgencyLevel: 'low' as UrgencyLevel,
        context: {
          supplierId,
          currentValue: priceStability,
          threshold: 0.9,
          message: `Supplier ${supplierId} has volatile pricing`,
          actionRequired: 'Consider long-term contracts or alternative suppliers',
        },
      });
    }

    return alerts;
  }

  /**
   * Evaluate bulk purchase opportunities
   */
  private async evaluateBulkPurchaseOpportunities(): Promise<any[]> {
    const alerts: any[] = [];

    try {
      // Get parts with high demand and good supplier relationships
      const partsCommand = new ScanCommand({
        TableName: this.SPARE_PARTS_TABLE,
        FilterExpression: 'averageDemand > :minDemand',
        ExpressionAttributeValues: {
          ':minDemand': 10, // Minimum monthly demand for bulk consideration
        },
      });

      const partsResult = await docClient.send(partsCommand);
      const parts = partsResult.Items || [];

      for (const part of parts) {
        const { partNumber, averageDemand, unitCost, currentStock } = part;
        
        // Calculate potential bulk savings (simplified)
        const monthlyDemand = averageDemand;
        const quarterlyDemand = monthlyDemand * 3;
        const potentialSavings = quarterlyDemand * unitCost * 0.1; // Assume 10% bulk discount

        if (potentialSavings > 500) { // $500 minimum savings threshold
          alerts.push({
            partNumber,
            alertType: 'bulkPurchaseOpportunity',
            urgencyLevel: 'low' as UrgencyLevel,
            context: {
              partNumber,
              currentValue: potentialSavings,
              threshold: 500,
              quarterlyDemand,
              message: `Bulk purchase opportunity for ${partNumber}`,
              actionRequired: `Consider quarterly bulk order to save $${potentialSavings.toFixed(2)}`,
            },
          });
        }
      }

    } catch (error) {
      console.error('Error evaluating bulk purchase opportunities:', error);
    }

    return alerts;
  }

  /**
   * Get user-specific notification thresholds
   */
  async getUserThresholds(userId: string): Promise<NotificationThresholds> {
    try {
      const command = new GetCommand({
        TableName: this.NOTIFICATION_PREFERENCES_TABLE,
        Key: { userId },
      });

      const result = await docClient.send(command);
      
      if (result.Item && result.Item.thresholds) {
        return result.Item.thresholds;
      }

      // Return default thresholds
      return {
        stockLevel: 10,
        costSavings: 100,
        urgencyLevel: 'medium',
        demandVariance: 0.3,
        leadTimeDelay: 7,
      };
    } catch (error) {
      console.error('Error getting user thresholds:', error);
      throw error;
    }
  }

  /**
   * Calculate carrying cost for excess inventory
   */
  private calculateCarryingCost(excessUnits: number, part: any): number {
    const { unitCost = 0 } = part;
    const carryingCostRate = 0.25; // 25% annual carrying cost
    return excessUnits * unitCost * carryingCostRate;
  }

  /**
   * Get slow-moving threshold for a category
   */
  private async getSlowMovingThreshold(category: string): Promise<number> {
    // Simplified - in reality would be based on category analysis
    const categoryThresholds: { [key: string]: number } = {
      'electronics': 2,
      'mechanical': 1,
      'consumables': 5,
      'default': 1,
    };

    return categoryThresholds[category] || categoryThresholds['default'];
  }

  /**
   * Calculate seasonal variation coefficient
   */
  private calculateSeasonalVariation(forecasts: any[]): number {
    if (forecasts.length < 12) return 0; // Need at least 12 months for seasonal analysis

    const demands = forecasts.map(f => f.predictedDemand);
    const mean = demands.reduce((sum, d) => sum + d, 0) / demands.length;
    const variance = demands.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / demands.length;
    const standardDeviation = Math.sqrt(variance);

    return mean > 0 ? standardDeviation / mean : 0;
  }
}