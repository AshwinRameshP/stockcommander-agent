import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDBClient, awsConfig } from './aws-clients';
import { NormalizedInvoiceData, DemandForecast } from '../types';

// Demand pattern interfaces
export interface DemandPattern {
  partNumber: string;
  analysisDate: Date;
  trend: TrendAnalysis;
  seasonality: SeasonalityAnalysis;
  variability: VariabilityAnalysis;
  anomalies: AnomalyDetection[];
  forecastability: ForecastabilityScore;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number; // 0-1 scale
  changePoints: Date[];
  confidence: number;
  monthlyGrowthRate: number;
}

export interface SeasonalityAnalysis {
  detected: boolean;
  pattern: 'monthly' | 'quarterly' | 'annual' | 'none';
  indices: Record<string, number>; // period -> seasonal index
  strength: number; // 0-1 scale
  confidence: number;
  peakPeriods: string[];
  lowPeriods: string[];
}

export interface VariabilityAnalysis {
  coefficient: number; // Coefficient of variation
  classification: 'low' | 'medium' | 'high';
  volatilityPattern: 'consistent' | 'increasing' | 'decreasing';
  standardDeviation: number;
  meanDemand: number;
}

export interface AnomalyDetection {
  date: Date;
  type: 'spike' | 'drop';
  magnitude: number; // How many standard deviations from normal
  actualValue: number;
  expectedValue: number;
  explanation?: string;
}

export interface ForecastabilityScore {
  score: number; // 0-1 scale, higher is more forecastable
  challenges: string[];
  recommendations: string[];
  confidence: number;
}

// Statistical helper functions
class StatisticalAnalysis {
  static mean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  static standardDeviation(values: number[]): number {
    const mean = this.mean(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return Math.sqrt(this.mean(squaredDiffs));
  }

  static coefficientOfVariation(values: number[]): number {
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);
    return mean === 0 ? 0 : stdDev / mean;
  }

  static linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

    return { slope, intercept, r2 };
  }

  static detectOutliers(values: number[], threshold: number = 2): number[] {
    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);
    
    return values.map((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      return zScore > threshold ? index : -1;
    }).filter(index => index !== -1);
  }
}

// Main demand analysis class
export class DemandAnalysisEngine {
  private dynamoClient: DynamoDBClient;

  constructor() {
    this.dynamoClient = dynamoDBClient;
  }

  // Get historical demand data for a part
  async getHistoricalDemand(partNumber: string, months: number = 24): Promise<NormalizedInvoiceData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const params = {
      TableName: awsConfig.normalizedInvoiceDataTable || 'NormalizedInvoiceData',
      KeyConditionExpression: 'partNumber = :partNumber AND invoiceDate >= :startDate',
      ExpressionAttributeValues: {
        ':partNumber': { S: partNumber },
        ':startDate': { S: startDate.toISOString().split('T')[0] }
      },
      ScanIndexForward: true // Sort by date ascending
    };

    try {
      const result = await this.dynamoClient.send(new QueryCommand(params));
      
      return (result.Items || []).map(item => ({
        partNumber: item.partNumber?.S || '',
        invoiceDate: item.invoiceDate?.S || '',
        invoiceId: item.invoiceId?.S || '',
        invoiceType: (item.invoiceType?.S as 'sales' | 'purchase') || 'sales',
        supplierId: item.supplierId?.S,
        customerId: item.customerId?.S,
        quantity: parseFloat(item.quantity?.N || '0'),
        unitPrice: parseFloat(item.unitPrice?.N || '0'),
        totalAmount: parseFloat(item.totalAmount?.N || '0'),
        currency: item.currency?.S || 'USD',
        normalizedDescription: item.normalizedDescription?.S || '',
        originalDescription: item.originalDescription?.S || '',
        category: item.category?.S || '',
        unitOfMeasure: item.unitOfMeasure?.S || '',
        qualityScore: parseFloat(item.qualityScore?.N || '0'),
        normalizationTimestamp: item.normalizationTimestamp?.S || '',
        dataSource: item.dataSource?.S || ''
      }));
    } catch (error) {
      console.error('Error fetching historical demand:', error);
      return [];
    }
  }

  // Analyze demand patterns for a specific part
  async analyzeDemandPatterns(partNumber: string, months: number = 24): Promise<DemandPattern> {
    const historicalData = await this.getHistoricalDemand(partNumber, months);
    
    if (historicalData.length === 0) {
      return this.createEmptyPattern(partNumber);
    }

    // Aggregate demand by month
    const monthlyDemand = this.aggregateMonthlyDemand(historicalData);
    const demandValues = Object.values(monthlyDemand);
    const timePoints = Object.keys(monthlyDemand).map((_, index) => index);

    // Perform various analyses
    const trend = this.analyzeTrend(timePoints, demandValues, Object.keys(monthlyDemand));
    const seasonality = this.analyzeSeasonality(monthlyDemand);
    const variability = this.analyzeVariability(demandValues);
    const anomalies = this.detectAnomalies(monthlyDemand);
    const forecastability = this.calculateForecastability(trend, seasonality, variability, anomalies);

    return {
      partNumber,
      analysisDate: new Date(),
      trend,
      seasonality,
      variability,
      anomalies,
      forecastability
    };
  }

  // Aggregate historical data by month
  private aggregateMonthlyDemand(data: NormalizedInvoiceData[]): Record<string, number> {
    const monthlyDemand: Record<string, number> = {};

    data.forEach(item => {
      if (item.invoiceType === 'sales') { // Only count sales for demand
        const monthKey = item.invoiceDate.substring(0, 7); // YYYY-MM format
        monthlyDemand[monthKey] = (monthlyDemand[monthKey] || 0) + item.quantity;
      }
    });

    return monthlyDemand;
  }

  // Analyze trend in demand
  private analyzeTrend(timePoints: number[], demandValues: number[], dateKeys: string[]): TrendAnalysis {
    if (demandValues.length < 3) {
      return {
        direction: 'stable',
        strength: 0,
        changePoints: [],
        confidence: 0,
        monthlyGrowthRate: 0
      };
    }

    const regression = StatisticalAnalysis.linearRegression(timePoints, demandValues);
    const slope = regression.slope;
    const r2 = regression.r2;

    // Determine trend direction and strength
    let direction: 'increasing' | 'decreasing' | 'stable';
    const slopeThreshold = StatisticalAnalysis.mean(demandValues) * 0.05; // 5% of mean

    if (Math.abs(slope) < slopeThreshold) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    // Calculate monthly growth rate
    const monthlyGrowthRate = demandValues.length > 1 ? 
      (slope / StatisticalAnalysis.mean(demandValues)) * 100 : 0;

    // Detect change points (simplified - look for significant slope changes)
    const changePoints = this.detectChangePoints(demandValues, dateKeys);

    return {
      direction,
      strength: Math.min(Math.abs(slope) / StatisticalAnalysis.mean(demandValues), 1),
      changePoints,
      confidence: r2,
      monthlyGrowthRate
    };
  }

  // Analyze seasonality patterns
  private analyzeSeasonality(monthlyDemand: Record<string, number>): SeasonalityAnalysis {
    const months = Object.keys(monthlyDemand).sort();
    const values = months.map(month => monthlyDemand[month]);

    if (months.length < 12) {
      return {
        detected: false,
        pattern: 'none',
        indices: {},
        strength: 0,
        confidence: 0,
        peakPeriods: [],
        lowPeriods: []
      };
    }

    // Calculate seasonal indices by month
    const seasonalIndices: Record<string, number[]> = {};
    const overallMean = StatisticalAnalysis.mean(values);

    months.forEach(month => {
      const monthNum = month.split('-')[1]; // Extract MM from YYYY-MM
      if (!seasonalIndices[monthNum]) {
        seasonalIndices[monthNum] = [];
      }
      seasonalIndices[monthNum].push(monthlyDemand[month] / overallMean);
    });

    // Average seasonal indices
    const avgSeasonalIndices: Record<string, number> = {};
    Object.keys(seasonalIndices).forEach(month => {
      avgSeasonalIndices[month] = StatisticalAnalysis.mean(seasonalIndices[month]);
    });

    // Calculate seasonality strength
    const seasonalValues = Object.values(avgSeasonalIndices);
    const seasonalVariance = StatisticalAnalysis.standardDeviation(seasonalValues);
    const strength = Math.min(seasonalVariance, 1);

    // Detect peaks and lows
    const sortedMonths = Object.entries(avgSeasonalIndices)
      .sort(([,a], [,b]) => b - a);
    
    const peakPeriods = sortedMonths.slice(0, 3).map(([month]) => month);
    const lowPeriods = sortedMonths.slice(-3).map(([month]) => month);

    return {
      detected: strength > 0.1,
      pattern: strength > 0.1 ? 'monthly' : 'none',
      indices: avgSeasonalIndices,
      strength,
      confidence: strength > 0.1 ? 0.8 : 0.2,
      peakPeriods,
      lowPeriods
    };
  }

  // Analyze demand variability
  private analyzeVariability(demandValues: number[]): VariabilityAnalysis {
    const mean = StatisticalAnalysis.mean(demandValues);
    const stdDev = StatisticalAnalysis.standardDeviation(demandValues);
    const coefficient = StatisticalAnalysis.coefficientOfVariation(demandValues);

    let classification: 'low' | 'medium' | 'high';
    if (coefficient < 0.3) {
      classification = 'low';
    } else if (coefficient < 0.7) {
      classification = 'medium';
    } else {
      classification = 'high';
    }

    // Analyze volatility pattern over time
    const firstHalf = demandValues.slice(0, Math.floor(demandValues.length / 2));
    const secondHalf = demandValues.slice(Math.floor(demandValues.length / 2));
    
    const firstHalfCV = StatisticalAnalysis.coefficientOfVariation(firstHalf);
    const secondHalfCV = StatisticalAnalysis.coefficientOfVariation(secondHalf);
    
    let volatilityPattern: 'consistent' | 'increasing' | 'decreasing';
    const cvDifference = secondHalfCV - firstHalfCV;
    
    if (Math.abs(cvDifference) < 0.1) {
      volatilityPattern = 'consistent';
    } else {
      volatilityPattern = cvDifference > 0 ? 'increasing' : 'decreasing';
    }

    return {
      coefficient,
      classification,
      volatilityPattern,
      standardDeviation: stdDev,
      meanDemand: mean
    };
  }

  // Detect anomalies in demand
  private detectAnomalies(monthlyDemand: Record<string, number>): AnomalyDetection[] {
    const values = Object.values(monthlyDemand);
    const dates = Object.keys(monthlyDemand);
    const mean = StatisticalAnalysis.mean(values);
    const stdDev = StatisticalAnalysis.standardDeviation(values);

    const anomalies: AnomalyDetection[] = [];
    const threshold = 2; // 2 standard deviations

    values.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev);
      
      if (zScore > threshold) {
        anomalies.push({
          date: new Date(dates[index] + '-01'),
          type: value > mean ? 'spike' : 'drop',
          magnitude: zScore,
          actualValue: value,
          expectedValue: mean,
          explanation: `Demand ${value > mean ? 'spike' : 'drop'} of ${zScore.toFixed(1)} standard deviations`
        });
      }
    });

    return anomalies;
  }

  // Calculate forecastability score
  private calculateForecastability(
    trend: TrendAnalysis,
    seasonality: SeasonalityAnalysis,
    variability: VariabilityAnalysis,
    anomalies: AnomalyDetection[]
  ): ForecastabilityScore {
    
    let score = 0.5; // Base score
    const challenges: string[] = [];
    const recommendations: string[] = [];

    // Trend contributes positively if strong and consistent
    if (trend.confidence > 0.7) {
      score += 0.2;
      recommendations.push('Strong trend detected - use trend-based forecasting');
    } else {
      challenges.push('Weak or inconsistent trend');
    }

    // Seasonality contributes positively if detected
    if (seasonality.detected && seasonality.confidence > 0.6) {
      score += 0.2;
      recommendations.push('Seasonal patterns detected - incorporate seasonality in forecasts');
    } else {
      challenges.push('No clear seasonal patterns');
    }

    // Low variability contributes positively
    if (variability.classification === 'low') {
      score += 0.2;
    } else if (variability.classification === 'high') {
      score -= 0.2;
      challenges.push('High demand variability');
      recommendations.push('Consider safety stock adjustments for high variability');
    }

    // Anomalies reduce forecastability
    if (anomalies.length > 0) {
      score -= Math.min(anomalies.length * 0.05, 0.2);
      challenges.push(`${anomalies.length} demand anomalies detected`);
      recommendations.push('Investigate causes of demand anomalies');
    }

    // Ensure score is between 0 and 1
    score = Math.max(0, Math.min(1, score));

    return {
      score,
      challenges,
      recommendations,
      confidence: score > 0.7 ? 0.9 : (score > 0.4 ? 0.7 : 0.4)
    };
  }

  // Detect change points in demand (simplified implementation)
  private detectChangePoints(demandValues: number[], dateKeys: string[]): Date[] {
    const changePoints: Date[] = [];
    
    if (demandValues.length < 6) return changePoints;

    // Look for significant changes in moving averages
    const windowSize = Math.min(3, Math.floor(demandValues.length / 3));
    
    for (let i = windowSize; i < demandValues.length - windowSize; i++) {
      const beforeWindow = demandValues.slice(i - windowSize, i);
      const afterWindow = demandValues.slice(i, i + windowSize);
      
      const beforeMean = StatisticalAnalysis.mean(beforeWindow);
      const afterMean = StatisticalAnalysis.mean(afterWindow);
      const overallStdDev = StatisticalAnalysis.standardDeviation(demandValues);
      
      // If the difference is more than 1.5 standard deviations, consider it a change point
      if (Math.abs(afterMean - beforeMean) > 1.5 * overallStdDev) {
        changePoints.push(new Date(dateKeys[i] + '-01'));
      }
    }

    return changePoints;
  }

  // Create empty pattern for parts with no data
  private createEmptyPattern(partNumber: string): DemandPattern {
    return {
      partNumber,
      analysisDate: new Date(),
      trend: {
        direction: 'stable',
        strength: 0,
        changePoints: [],
        confidence: 0,
        monthlyGrowthRate: 0
      },
      seasonality: {
        detected: false,
        pattern: 'none',
        indices: {},
        strength: 0,
        confidence: 0,
        peakPeriods: [],
        lowPeriods: []
      },
      variability: {
        coefficient: 0,
        classification: 'low',
        volatilityPattern: 'consistent',
        standardDeviation: 0,
        meanDemand: 0
      },
      anomalies: [],
      forecastability: {
        score: 0,
        challenges: ['No historical data available'],
        recommendations: ['Collect more demand data before forecasting'],
        confidence: 0
      }
    };
  }

  // Generate demand forecast based on patterns
  async generateDemandForecast(
    partNumber: string, 
    pattern: DemandPattern, 
    forecastMonths: number = 12
  ): Promise<DemandForecast[]> {
    
    const forecasts: DemandForecast[] = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= forecastMonths; i++) {
      const forecastDate = new Date(currentDate);
      forecastDate.setMonth(forecastDate.getMonth() + i);
      
      // Base forecast on trend
      let baseForecast = pattern.variability.meanDemand;
      
      if (pattern.trend.direction !== 'stable') {
        const trendAdjustment = pattern.trend.monthlyGrowthRate / 100 * i;
        baseForecast *= (1 + trendAdjustment);
      }
      
      // Apply seasonal adjustment
      if (pattern.seasonality.detected) {
        const month = (forecastDate.getMonth() + 1).toString().padStart(2, '0');
        const seasonalIndex = pattern.seasonality.indices[month] || 1;
        baseForecast *= seasonalIndex;
      }
      
      // Calculate confidence interval based on variability
      const stdDev = pattern.variability.standardDeviation;
      const confidenceMultiplier = 1.96; // 95% confidence interval
      
      forecasts.push({
        partNumber,
        forecastDate,
        predictedDemand: Math.max(0, Math.round(baseForecast)),
        confidenceInterval: {
          lower: Math.max(0, Math.round(baseForecast - confidenceMultiplier * stdDev)),
          upper: Math.round(baseForecast + confidenceMultiplier * stdDev)
        },
        seasonalityFactor: pattern.seasonality.detected ? 
          (pattern.seasonality.indices[(forecastDate.getMonth() + 1).toString().padStart(2, '0')] || 1) : 1,
        modelVersion: '1.0.0',
        createdAt: new Date()
      });
    }
    
    return forecasts;
  }
}

// Export singleton instance
export const demandAnalysisEngine = new DemandAnalysisEngine();