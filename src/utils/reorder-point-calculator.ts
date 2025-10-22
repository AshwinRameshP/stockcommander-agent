import { SparePart, DemandForecast, SupplierMetrics } from '../types';
import { demandAnalysisEngine, DemandPattern } from './demand-analysis';
import { SupplierEvaluationEngine } from './supplier-evaluation';

// Reorder point calculation interfaces
export interface ReorderPointCalculation {
  partNumber: string;
  calculationDate: Date;
  reorderPoint: number;
  safetyStock: number;
  averageDemand: number;
  leadTimeDays: number;
  serviceLevel: number;
  demandVariability: number;
  leadTimeVariability: number;
  calculationMethod: 'statistical' | 'fixed' | 'dynamic';
  confidence: number;
  reasoning: string[];
}

export interface ServiceLevelTarget {
  level: number; // 0.95 for 95% service level
  description: string;
  stockoutRisk: number; // Percentage risk of stockout
  carryingCostImpact: number; // Relative impact on carrying costs
}

export interface SafetyStockCalculation {
  partNumber: string;
  safetyStock: number;
  method: 'normal_distribution' | 'empirical' | 'fixed_percentage';
  zScore: number;
  demandStdDev: number;
  leadTimeStdDev: number;
  serviceLevel: number;
  reasoning: string;
}

// Service level configurations
export const SERVICE_LEVEL_TARGETS: Record<string, ServiceLevelTarget> = {
  'critical': {
    level: 0.99,
    description: 'Critical parts - 99% service level',
    stockoutRisk: 1,
    carryingCostImpact: 1.5
  },
  'high': {
    level: 0.95,
    description: 'High importance - 95% service level',
    stockoutRisk: 5,
    carryingCostImpact: 1.2
  },
  'medium': {
    level: 0.90,
    description: 'Medium importance - 90% service level',
    stockoutRisk: 10,
    carryingCostImpact: 1.0
  },
  'low': {
    level: 0.85,
    description: 'Low importance - 85% service level',
    stockoutRisk: 15,
    carryingCostImpact: 0.8
  }
};

// Z-scores for normal distribution service levels
const Z_SCORES: Record<number, number> = {
  0.50: 0.00,
  0.60: 0.25,
  0.70: 0.52,
  0.75: 0.67,
  0.80: 0.84,
  0.85: 1.04,
  0.90: 1.28,
  0.95: 1.65,
  0.99: 2.33,
  0.995: 2.58,
  0.999: 3.09
};

// Statistical helper functions
class ReorderPointStatistics {
  static getZScore(serviceLevel: number): number {
    // Find closest service level in Z_SCORES
    const levels = Object.keys(Z_SCORES).map(Number).sort((a, b) => a - b);
    
    for (let i = 0; i < levels.length; i++) {
      if (serviceLevel <= levels[i]) {
        return Z_SCORES[levels[i]];
      }
    }
    
    return Z_SCORES[0.999]; // Default to highest if above all levels
  }

  static calculateCombinedVariability(
    demandStdDev: number,
    leadTimeStdDev: number,
    averageDemand: number,
    averageLeadTime: number
  ): number {
    // Formula for combined demand and lead time variability
    // Var(total) = leadTime * Var(demand) + demand² * Var(leadTime)
    const demandVariance = demandStdDev * demandStdDev;
    const leadTimeVariance = leadTimeStdDev * leadTimeStdDev;
    
    const combinedVariance = 
      averageLeadTime * demandVariance + 
      (averageDemand * averageDemand) * leadTimeVariance;
    
    return Math.sqrt(combinedVariance);
  }

  static normalizeServiceLevel(serviceLevel: number): number {
    return Math.max(0.5, Math.min(0.999, serviceLevel));
  }
}

// Main reorder point calculator
export class ReorderPointCalculator {
  private supplierEvaluator: SupplierEvaluationEngine;

  constructor() {
    this.supplierEvaluator = new SupplierEvaluationEngine();
  }

  // Calculate optimal reorder point for a spare part
  async calculateReorderPoint(
    sparePart: SparePart,
    demandPattern: DemandPattern,
    supplierMetrics: SupplierMetrics,
    serviceLevel?: number
  ): Promise<ReorderPointCalculation> {
    
    const reasoning: string[] = [];
    
    // Determine service level based on part criticality
    const targetServiceLevel = serviceLevel || this.determineServiceLevel(sparePart);
    reasoning.push(`Service level target: ${(targetServiceLevel * 100).toFixed(1)}% based on part criticality`);

    // Get demand statistics
    const averageDemand = demandPattern.variability.meanDemand;
    const demandStdDev = demandPattern.variability.standardDeviation;
    
    if (averageDemand === 0) {
      reasoning.push('No historical demand data - using minimum safety stock');
      return this.createMinimalReorderPoint(sparePart, reasoning);
    }

    // Get lead time statistics
    const averageLeadTime = supplierMetrics.averageLeadTime;
    const leadTimeStdDev = this.estimateLeadTimeVariability(supplierMetrics);
    
    reasoning.push(`Average demand: ${averageDemand.toFixed(2)} units/month`);
    reasoning.push(`Average lead time: ${averageLeadTime.toFixed(1)} days`);

    // Calculate safety stock
    const safetyStockCalc = this.calculateSafetyStock(
      averageDemand,
      demandStdDev,
      averageLeadTime,
      leadTimeStdDev,
      targetServiceLevel
    );

    reasoning.push(`Safety stock calculation: ${safetyStockCalc.reasoning}`);

    // Calculate reorder point
    const leadTimeDemand = (averageDemand / 30) * averageLeadTime; // Convert monthly demand to daily
    const reorderPoint = Math.ceil(leadTimeDemand + safetyStockCalc.safetyStock);

    reasoning.push(`Lead time demand: ${leadTimeDemand.toFixed(2)} units`);
    reasoning.push(`Reorder point: ${leadTimeDemand.toFixed(2)} + ${safetyStockCalc.safetyStock.toFixed(2)} = ${reorderPoint} units`);

    // Determine calculation method and confidence
    const { method, confidence } = this.assessCalculationQuality(demandPattern, supplierMetrics);
    reasoning.push(`Calculation method: ${method} (confidence: ${(confidence * 100).toFixed(1)}%)`);

    return {
      partNumber: sparePart.partNumber,
      calculationDate: new Date(),
      reorderPoint,
      safetyStock: Math.ceil(safetyStockCalc.safetyStock),
      averageDemand,
      leadTimeDays: averageLeadTime,
      serviceLevel: targetServiceLevel,
      demandVariability: demandStdDev,
      leadTimeVariability: leadTimeStdDev,
      calculationMethod: method,
      confidence,
      reasoning
    };
  }

  // Calculate safety stock using statistical methods
  private calculateSafetyStock(
    averageDemand: number,
    demandStdDev: number,
    averageLeadTime: number,
    leadTimeStdDev: number,
    serviceLevel: number
  ): SafetyStockCalculation {
    
    const normalizedServiceLevel = ReorderPointStatistics.normalizeServiceLevel(serviceLevel);
    const zScore = ReorderPointStatistics.getZScore(normalizedServiceLevel);
    
    // Calculate combined variability
    const combinedStdDev = ReorderPointStatistics.calculateCombinedVariability(
      demandStdDev,
      leadTimeStdDev,
      averageDemand,
      averageLeadTime
    );

    // Safety stock = Z-score × Combined Standard Deviation
    const safetyStock = zScore * combinedStdDev;

    const reasoning = `Z-score ${zScore.toFixed(2)} × combined std dev ${combinedStdDev.toFixed(2)} = ${safetyStock.toFixed(2)} units`;

    return {
      partNumber: '', // Will be set by caller
      safetyStock,
      method: 'normal_distribution',
      zScore,
      demandStdDev,
      leadTimeStdDev,
      serviceLevel: normalizedServiceLevel,
      reasoning
    };
  }

  // Determine appropriate service level based on part characteristics
  private determineServiceLevel(sparePart: SparePart): number {
    // Categorize parts based on criticality
    const category = sparePart.category.toLowerCase();
    
    if (category.includes('critical') || category.includes('safety')) {
      return SERVICE_LEVEL_TARGETS.critical.level;
    } else if (category.includes('high') || category.includes('important')) {
      return SERVICE_LEVEL_TARGETS.high.level;
    } else if (category.includes('medium') || category.includes('standard')) {
      return SERVICE_LEVEL_TARGETS.medium.level;
    } else {
      return SERVICE_LEVEL_TARGETS.low.level;
    }
  }

  // Estimate lead time variability from supplier metrics
  private estimateLeadTimeVariability(supplierMetrics: SupplierMetrics): number {
    // Use on-time delivery rate as proxy for lead time consistency
    const onTimeRate = supplierMetrics.onTimeDeliveryRate / 100;
    const averageLeadTime = supplierMetrics.averageLeadTime;
    
    // Higher on-time rate = lower variability
    // Assume coefficient of variation ranges from 0.1 (very consistent) to 0.5 (highly variable)
    const coefficientOfVariation = 0.5 - (onTimeRate * 0.4);
    
    return averageLeadTime * coefficientOfVariation;
  }

  // Assess quality of reorder point calculation
  private assessCalculationQuality(
    demandPattern: DemandPattern,
    supplierMetrics: SupplierMetrics
  ): { method: 'statistical' | 'fixed' | 'dynamic'; confidence: number } {
    
    let confidence = 0.5; // Base confidence
    let method: 'statistical' | 'fixed' | 'dynamic' = 'statistical';

    // Assess demand data quality
    const forecastability = demandPattern.forecastability.score;
    confidence += forecastability * 0.3;

    // Assess supplier data quality
    if (supplierMetrics.onTimeDeliveryRate > 80) {
      confidence += 0.2;
    }
    
    if (supplierMetrics.totalOrders > 10) {
      confidence += 0.1;
    }

    // Determine method based on data quality
    if (confidence > 0.7 && demandPattern.variability.classification !== 'high') {
      method = 'statistical';
    } else if (demandPattern.trend.direction !== 'stable') {
      method = 'dynamic';
    } else {
      method = 'fixed';
      confidence = Math.min(confidence, 0.6);
    }

    return { method, confidence: Math.min(confidence, 0.95) };
  }

  // Create minimal reorder point for parts with no data
  private createMinimalReorderPoint(
    sparePart: SparePart,
    reasoning: string[]
  ): ReorderPointCalculation {
    
    const minSafetyStock = Math.max(1, sparePart.safetyStock || 5);
    const estimatedLeadTime = sparePart.leadTimeDays || 14;
    
    return {
      partNumber: sparePart.partNumber,
      calculationDate: new Date(),
      reorderPoint: minSafetyStock,
      safetyStock: minSafetyStock,
      averageDemand: 0,
      leadTimeDays: estimatedLeadTime,
      serviceLevel: 0.85,
      demandVariability: 0,
      leadTimeVariability: 0,
      calculationMethod: 'fixed',
      confidence: 0.3,
      reasoning
    };
  }

  // Optimize service level based on cost considerations
  async optimizeServiceLevel(
    sparePart: SparePart,
    demandPattern: DemandPattern,
    supplierMetrics: SupplierMetrics,
    carryingCostRate: number = 0.25, // 25% annual carrying cost
    stockoutCostPerUnit: number = 100 // Cost per stockout unit
  ): Promise<{ optimalServiceLevel: number; reasoning: string[] }> {
    
    const reasoning: string[] = [];
    const serviceLevels = [0.85, 0.90, 0.95, 0.99];
    const costs: Array<{ serviceLevel: number; totalCost: number; details: any }> = [];

    for (const serviceLevel of serviceLevels) {
      const reorderCalc = await this.calculateReorderPoint(
        sparePart,
        demandPattern,
        supplierMetrics,
        serviceLevel
      );

      // Calculate carrying cost
      const averageInventory = reorderCalc.safetyStock / 2; // Simplified average inventory
      const unitCost = 50; // Mock unit cost - would come from part master data
      const annualCarryingCost = averageInventory * unitCost * carryingCostRate;

      // Calculate stockout cost
      const stockoutProbability = 1 - serviceLevel;
      const expectedStockouts = stockoutProbability * demandPattern.variability.meanDemand * 12; // Annual
      const annualStockoutCost = expectedStockouts * stockoutCostPerUnit;

      const totalCost = annualCarryingCost + annualStockoutCost;

      costs.push({
        serviceLevel,
        totalCost,
        details: {
          carryingCost: annualCarryingCost,
          stockoutCost: annualStockoutCost,
          safetyStock: reorderCalc.safetyStock
        }
      });

      reasoning.push(
        `Service level ${(serviceLevel * 100).toFixed(0)}%: ` +
        `Carrying cost $${annualCarryingCost.toFixed(0)}, ` +
        `Stockout cost $${annualStockoutCost.toFixed(0)}, ` +
        `Total $${totalCost.toFixed(0)}`
      );
    }

    // Find optimal service level (minimum total cost)
    const optimal = costs.reduce((min, current) => 
      current.totalCost < min.totalCost ? current : min
    );

    reasoning.push(`Optimal service level: ${(optimal.serviceLevel * 100).toFixed(0)}% with total cost $${optimal.totalCost.toFixed(0)}`);

    return {
      optimalServiceLevel: optimal.serviceLevel,
      reasoning
    };
  }

  // Calculate economic order quantity (EOQ) for reference
  calculateEOQ(
    annualDemand: number,
    orderingCost: number,
    carryingCostPerUnit: number
  ): { eoq: number; totalCost: number; reasoning: string } {
    
    if (annualDemand === 0 || carryingCostPerUnit === 0) {
      return {
        eoq: 1,
        totalCost: 0,
        reasoning: 'Insufficient data for EOQ calculation'
      };
    }

    const eoq = Math.sqrt((2 * annualDemand * orderingCost) / carryingCostPerUnit);
    const totalCost = Math.sqrt(2 * annualDemand * orderingCost * carryingCostPerUnit);

    const reasoning = `EOQ = √(2 × ${annualDemand} × ${orderingCost} / ${carryingCostPerUnit}) = ${eoq.toFixed(0)} units`;

    return {
      eoq: Math.ceil(eoq),
      totalCost,
      reasoning
    };
  }

  // Validate reorder point calculation
  validateReorderPoint(
    calculation: ReorderPointCalculation,
    sparePart: SparePart
  ): { isValid: boolean; warnings: string[]; recommendations: string[] } {
    
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let isValid = true;

    // Check if reorder point is reasonable
    if (calculation.reorderPoint < calculation.safetyStock) {
      warnings.push('Reorder point is less than safety stock');
      isValid = false;
    }

    if (calculation.reorderPoint > calculation.averageDemand * 6) {
      warnings.push('Reorder point seems excessive (>6 months demand)');
      recommendations.push('Review demand forecasting accuracy');
    }

    // Check confidence level
    if (calculation.confidence < 0.5) {
      warnings.push('Low confidence in calculation due to limited data');
      recommendations.push('Collect more historical data for better accuracy');
    }

    // Check service level appropriateness
    if (calculation.serviceLevel > 0.99 && sparePart.category.toLowerCase().includes('low')) {
      warnings.push('Very high service level for low-criticality part');
      recommendations.push('Consider reducing service level to optimize costs');
    }

    return { isValid, warnings, recommendations };
  }
}

// Export singleton instance
export const reorderPointCalculator = new ReorderPointCalculator();