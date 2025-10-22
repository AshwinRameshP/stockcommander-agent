import { DynamoDBClient, QueryCommand, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDBClient, awsConfig } from './aws-clients';
import { NormalizedInvoiceData, SupplierMetrics } from '../types';

// Supplier performance interfaces
export interface SupplierPerformanceAnalysis {
  supplierId: string;
  supplierName: string;
  analysisDate: Date;
  deliveryPerformance: DeliveryPerformance;
  costPerformance: CostPerformance;
  qualityMetrics: QualityMetrics;
  relationshipFactors: RelationshipFactors;
  capacityAssessment: CapacityAssessment;
  overallScore: number;
  ranking: number;
  recommendation: 'preferred' | 'acceptable' | 'monitor' | 'avoid';
  riskFactors: RiskFactor[];
}

export interface DeliveryPerformance {
  onTimeDeliveryRate: number; // Percentage
  averageLeadTime: number; // Days
  leadTimeVariability: number; // Standard deviation
  leadTimeConsistency: number; // 0-1 score
  deliveryReliabilityScore: number; // 0-100
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface CostPerformance {
  averageUnitCost: number;
  priceCompetitiveness: number; // Relative to market average
  priceStability: number; // 0-1 score, higher is more stable
  costTrend: 'decreasing' | 'stable' | 'increasing';
  totalCostOfOwnership: number;
  paymentTerms: string;
  discountOpportunities: string[];
}

export interface QualityMetrics {
  qualityRating: number; // 0-100
  defectRate: number; // Percentage
  returnRate: number; // Percentage
  qualityTrend: 'improving' | 'stable' | 'declining';
  certifications: string[];
  qualityIncidents: number;
}

export interface RelationshipFactors {
  communicationScore: number; // 0-100
  responsiveness: number; // Hours to respond
  flexibility: number; // 0-100 score
  strategicAlignment: number; // 0-100 score
  contractCompliance: number; // 0-100 score
  innovationSupport: number; // 0-100 score
}

export interface CapacityAssessment {
  productionCapacity: number;
  currentUtilization: number; // Percentage
  scalabilityScore: number; // 0-100
  geographicCoverage: string[];
  financialStability: number; // 0-100 score
  technologyCapabilities: string[];
}

export interface RiskFactor {
  type: 'financial' | 'operational' | 'strategic' | 'compliance' | 'geographic';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: string;
  mitigation: string;
}

export interface SupplierRanking {
  partNumber?: string;
  rankings: SupplierPerformanceAnalysis[];
  marketAnalysis: MarketAnalysis;
  recommendedSupplier: {
    supplierId: string;
    reasoning: string;
    confidence: number;
    alternativeSuppliers: string[];
  };
}

export interface MarketAnalysis {
  competitivePosition: 'strong' | 'moderate' | 'weak';
  priceRange: { min: number; max: number; average: number };
  leadTimeRange: { min: number; max: number; average: number };
  marketTrends: string[];
  supplierConcentration: number; // 0-1, higher means more concentrated
}

// Statistical helper functions for supplier analysis
class SupplierStatistics {
  static calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sorted[lower];
    }
    
    return sorted[lower] * (upper - index) + sorted[upper] * (index - lower);
  }

  static normalizeScore(value: number, min: number, max: number, reverse: boolean = false): number {
    if (max === min) return 50; // Default score if no variation
    
    let normalized = ((value - min) / (max - min)) * 100;
    
    if (reverse) {
      normalized = 100 - normalized; // For metrics where lower is better
    }
    
    return Math.max(0, Math.min(100, normalized));
  }

  static calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (Math.abs(changePercent) < 5) return 'stable';
    return changePercent > 0 ? 'improving' : 'declining';
  }
}

// Main supplier evaluation engine
export class SupplierEvaluationEngine {
  private dynamoClient: DynamoDBClient;

  constructor() {
    this.dynamoClient = dynamoDBClient;
  }

  // Get supplier purchase history
  async getSupplierPurchaseHistory(supplierId: string, months: number = 24): Promise<NormalizedInvoiceData[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    const params = {
      TableName: awsConfig.normalizedInvoiceDataTable || 'NormalizedInvoiceData',
      IndexName: 'SupplierIndex',
      KeyConditionExpression: 'supplierId = :supplierId AND invoiceDate >= :startDate',
      FilterExpression: 'invoiceType = :invoiceType',
      ExpressionAttributeValues: {
        ':supplierId': { S: supplierId },
        ':startDate': { S: startDate.toISOString().split('T')[0] },
        ':invoiceType': { S: 'purchase' }
      }
    };

    try {
      const result = await this.dynamoClient.send(new QueryCommand(params));
      
      return (result.Items || []).map(item => ({
        partNumber: item.partNumber?.S || '',
        invoiceDate: item.invoiceDate?.S || '',
        invoiceId: item.invoiceId?.S || '',
        invoiceType: 'purchase' as const,
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
      console.error('Error fetching supplier purchase history:', error);
      return [];
    }
  }

  // Get all suppliers for a specific part
  async getSuppliersForPart(partNumber: string): Promise<string[]> {
    const params = {
      TableName: awsConfig.normalizedInvoiceDataTable || 'NormalizedInvoiceData',
      KeyConditionExpression: 'partNumber = :partNumber',
      FilterExpression: 'invoiceType = :invoiceType AND attribute_exists(supplierId)',
      ExpressionAttributeValues: {
        ':partNumber': { S: partNumber },
        ':invoiceType': { S: 'purchase' }
      },
      ProjectionExpression: 'supplierId'
    };

    try {
      const result = await this.dynamoClient.send(new QueryCommand(params));
      const suppliers = new Set<string>();
      
      (result.Items || []).forEach(item => {
        if (item.supplierId?.S) {
          suppliers.add(item.supplierId.S);
        }
      });
      
      return Array.from(suppliers);
    } catch (error) {
      console.error('Error fetching suppliers for part:', error);
      return [];
    }
  }

  // Evaluate supplier performance
  async evaluateSupplierPerformance(supplierId: string, partNumber?: string): Promise<SupplierPerformanceAnalysis> {
    const purchaseHistory = await this.getSupplierPurchaseHistory(supplierId);
    
    // Filter by part number if specified
    const relevantHistory = partNumber ? 
      purchaseHistory.filter(item => item.partNumber === partNumber) : 
      purchaseHistory;

    if (relevantHistory.length === 0) {
      return this.createEmptySupplierAnalysis(supplierId);
    }

    // Calculate performance metrics
    const deliveryPerformance = await this.analyzeDeliveryPerformance(supplierId, relevantHistory);
    const costPerformance = this.analyzeCostPerformance(relevantHistory);
    const qualityMetrics = this.analyzeQualityMetrics(relevantHistory);
    const relationshipFactors = await this.analyzeRelationshipFactors(supplierId);
    const capacityAssessment = await this.analyzeCapacityAssessment(supplierId);

    // Calculate overall score
    const overallScore = this.calculateOverallScore({
      deliveryPerformance,
      costPerformance,
      qualityMetrics,
      relationshipFactors,
      capacityAssessment
    });

    // Assess risk factors
    const riskFactors = this.assessRiskFactors(supplierId, {
      deliveryPerformance,
      costPerformance,
      qualityMetrics,
      capacityAssessment
    });

    // Determine recommendation
    const recommendation = this.determineRecommendation(overallScore, riskFactors);

    return {
      supplierId,
      supplierName: `Supplier ${supplierId}`, // Would be fetched from supplier master data
      analysisDate: new Date(),
      deliveryPerformance,
      costPerformance,
      qualityMetrics,
      relationshipFactors,
      capacityAssessment,
      overallScore,
      ranking: 0, // Will be set during ranking process
      recommendation,
      riskFactors
    };
  }

  // Analyze delivery performance
  private async analyzeDeliveryPerformance(
    supplierId: string, 
    purchaseHistory: NormalizedInvoiceData[]
  ): Promise<DeliveryPerformance> {
    
    // Mock delivery data - in real implementation, this would come from delivery tracking
    const deliveryData = purchaseHistory.map(item => ({
      orderedDate: new Date(item.invoiceDate),
      deliveredDate: new Date(new Date(item.invoiceDate).getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      expectedDate: new Date(new Date(item.invoiceDate).getTime() + 14 * 24 * 60 * 60 * 1000),
      quantity: item.quantity
    }));

    // Calculate lead times
    const leadTimes = deliveryData.map(delivery => {
      const leadTime = (delivery.deliveredDate.getTime() - delivery.orderedDate.getTime()) / (24 * 60 * 60 * 1000);
      return leadTime;
    });

    // Calculate on-time delivery rate
    const onTimeDeliveries = deliveryData.filter(delivery => 
      delivery.deliveredDate <= delivery.expectedDate
    ).length;
    const onTimeDeliveryRate = (onTimeDeliveries / deliveryData.length) * 100;

    // Calculate lead time statistics
    const averageLeadTime = leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length;
    const leadTimeVariability = Math.sqrt(
      leadTimes.reduce((sum, lt) => sum + Math.pow(lt - averageLeadTime, 2), 0) / leadTimes.length
    );

    // Lead time consistency (inverse of coefficient of variation)
    const leadTimeConsistency = averageLeadTime > 0 ? 
      Math.max(0, 1 - (leadTimeVariability / averageLeadTime)) : 0;

    // Delivery reliability score (combination of on-time rate and consistency)
    const deliveryReliabilityScore = (onTimeDeliveryRate * 0.7) + (leadTimeConsistency * 100 * 0.3);

    // Recent trend analysis
    const recentLeadTimes = leadTimes.slice(-Math.min(6, leadTimes.length));
    const recentTrend = SupplierStatistics.calculateTrend(recentLeadTimes);

    return {
      onTimeDeliveryRate,
      averageLeadTime,
      leadTimeVariability,
      leadTimeConsistency,
      deliveryReliabilityScore,
      recentTrend: recentTrend === 'improving' ? 'improving' : 
                   recentTrend === 'declining' ? 'declining' : 'stable'
    };
  }

  // Analyze cost performance
  private analyzeCostPerformance(purchaseHistory: NormalizedInvoiceData[]): CostPerformance {
    const unitCosts = purchaseHistory.map(item => item.unitPrice);
    const averageUnitCost = unitCosts.reduce((a, b) => a + b, 0) / unitCosts.length;

    // Price stability (inverse of coefficient of variation)
    const costStdDev = Math.sqrt(
      unitCosts.reduce((sum, cost) => sum + Math.pow(cost - averageUnitCost, 2), 0) / unitCosts.length
    );
    const priceStability = averageUnitCost > 0 ? 
      Math.max(0, 1 - (costStdDev / averageUnitCost)) : 0;

    // Cost trend analysis
    const recentCosts = unitCosts.slice(-Math.min(6, unitCosts.length));
    const costTrendAnalysis = SupplierStatistics.calculateTrend(recentCosts);
    
    let costTrend: 'decreasing' | 'stable' | 'increasing';
    if (costTrendAnalysis === 'improving') {
      costTrend = 'decreasing'; // Improving costs means decreasing prices
    } else if (costTrendAnalysis === 'declining') {
      costTrend = 'increasing'; // Declining performance means increasing prices
    } else {
      costTrend = 'stable';
    }

    // Mock market comparison - in real implementation, this would compare to market data
    const priceCompetitiveness = 75 + (Math.random() * 50); // Mock score 75-125

    return {
      averageUnitCost,
      priceCompetitiveness,
      priceStability,
      costTrend,
      totalCostOfOwnership: averageUnitCost * 1.15, // Mock TCO calculation
      paymentTerms: 'Net 30', // Mock payment terms
      discountOpportunities: ['Volume discount available', 'Early payment discount']
    };
  }

  // Analyze quality metrics
  private analyzeQualityMetrics(purchaseHistory: NormalizedInvoiceData[]): QualityMetrics {
    // Use quality scores from normalized data
    const qualityScores = purchaseHistory.map(item => item.qualityScore * 100);
    const averageQualityRating = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;

    // Mock defect and return rates - in real implementation, this would come from quality tracking
    const defectRate = Math.max(0, 5 - (averageQualityRating / 20)); // Lower quality = higher defects
    const returnRate = defectRate * 0.3; // Returns are typically lower than defects

    const qualityTrend = SupplierStatistics.calculateTrend(qualityScores);

    return {
      qualityRating: averageQualityRating,
      defectRate,
      returnRate,
      qualityTrend: qualityTrend === 'improving' ? 'improving' : 
                    qualityTrend === 'declining' ? 'declining' : 'stable',
      certifications: ['ISO 9001', 'ISO 14001'], // Mock certifications
      qualityIncidents: Math.floor(defectRate / 2) // Mock incidents
    };
  }

  // Analyze relationship factors
  private async analyzeRelationshipFactors(supplierId: string): Promise<RelationshipFactors> {
    // Mock relationship data - in real implementation, this would come from CRM/ERP systems
    return {
      communicationScore: 70 + Math.random() * 30,
      responsiveness: 2 + Math.random() * 22, // Hours
      flexibility: 60 + Math.random() * 40,
      strategicAlignment: 65 + Math.random() * 35,
      contractCompliance: 80 + Math.random() * 20,
      innovationSupport: 50 + Math.random() * 50
    };
  }

  // Analyze capacity assessment
  private async analyzeCapacityAssessment(supplierId: string): Promise<CapacityAssessment> {
    // Mock capacity data - in real implementation, this would come from supplier assessments
    return {
      productionCapacity: 1000 + Math.random() * 9000,
      currentUtilization: 60 + Math.random() * 30,
      scalabilityScore: 70 + Math.random() * 30,
      geographicCoverage: ['North America', 'Europe'],
      financialStability: 75 + Math.random() * 25,
      technologyCapabilities: ['Advanced Manufacturing', 'Quality Control', 'Logistics']
    };
  }

  // Calculate overall supplier score
  private calculateOverallScore(metrics: {
    deliveryPerformance: DeliveryPerformance;
    costPerformance: CostPerformance;
    qualityMetrics: QualityMetrics;
    relationshipFactors: RelationshipFactors;
    capacityAssessment: CapacityAssessment;
  }): number {
    
    // Weighted scoring
    const weights = {
      delivery: 0.25,
      cost: 0.20,
      quality: 0.25,
      relationship: 0.15,
      capacity: 0.15
    };

    const deliveryScore = metrics.deliveryPerformance.deliveryReliabilityScore;
    const costScore = 100 - Math.abs(metrics.costPerformance.priceCompetitiveness - 100); // Closer to 100 is better
    const qualityScore = metrics.qualityMetrics.qualityRating;
    const relationshipScore = (
      metrics.relationshipFactors.communicationScore +
      metrics.relationshipFactors.flexibility +
      metrics.relationshipFactors.strategicAlignment +
      metrics.relationshipFactors.contractCompliance
    ) / 4;
    const capacityScore = (
      metrics.capacityAssessment.scalabilityScore +
      metrics.capacityAssessment.financialStability
    ) / 2;

    const overallScore = (
      deliveryScore * weights.delivery +
      costScore * weights.cost +
      qualityScore * weights.quality +
      relationshipScore * weights.relationship +
      capacityScore * weights.capacity
    );

    return Math.round(overallScore);
  }

  // Assess risk factors
  private assessRiskFactors(supplierId: string, metrics: {
    deliveryPerformance: DeliveryPerformance;
    costPerformance: CostPerformance;
    qualityMetrics: QualityMetrics;
    capacityAssessment: CapacityAssessment;
  }): RiskFactor[] {
    
    const risks: RiskFactor[] = [];

    // Delivery risks
    if (metrics.deliveryPerformance.onTimeDeliveryRate < 80) {
      risks.push({
        type: 'operational',
        description: 'Poor on-time delivery performance',
        severity: metrics.deliveryPerformance.onTimeDeliveryRate < 60 ? 'high' : 'medium',
        probability: 'high',
        impact: 'Production delays and stockouts',
        mitigation: 'Increase safety stock, develop backup suppliers'
      });
    }

    // Quality risks
    if (metrics.qualityMetrics.defectRate > 3) {
      risks.push({
        type: 'operational',
        description: 'High defect rate',
        severity: metrics.qualityMetrics.defectRate > 5 ? 'high' : 'medium',
        probability: 'medium',
        impact: 'Quality issues and customer complaints',
        mitigation: 'Implement quality agreements, increase inspection'
      });
    }

    // Financial risks
    if (metrics.capacityAssessment.financialStability < 70) {
      risks.push({
        type: 'financial',
        description: 'Financial stability concerns',
        severity: 'medium',
        probability: 'medium',
        impact: 'Supply disruption due to financial issues',
        mitigation: 'Monitor financial health, secure backup suppliers'
      });
    }

    // Capacity risks
    if (metrics.capacityAssessment.currentUtilization > 90) {
      risks.push({
        type: 'operational',
        description: 'High capacity utilization',
        severity: 'medium',
        probability: 'high',
        impact: 'Inability to handle demand increases',
        mitigation: 'Discuss capacity expansion plans, diversify suppliers'
      });
    }

    return risks;
  }

  // Determine recommendation based on score and risks
  private determineRecommendation(
    overallScore: number, 
    riskFactors: RiskFactor[]
  ): 'preferred' | 'acceptable' | 'monitor' | 'avoid' {
    
    const highRisks = riskFactors.filter(risk => risk.severity === 'high' || risk.severity === 'critical');
    
    if (highRisks.length > 0) {
      return overallScore > 70 ? 'monitor' : 'avoid';
    }
    
    if (overallScore >= 80) {
      return 'preferred';
    } else if (overallScore >= 60) {
      return 'acceptable';
    } else {
      return 'monitor';
    }
  }

  // Create empty supplier analysis
  private createEmptySupplierAnalysis(supplierId: string): SupplierPerformanceAnalysis {
    return {
      supplierId,
      supplierName: `Supplier ${supplierId}`,
      analysisDate: new Date(),
      deliveryPerformance: {
        onTimeDeliveryRate: 0,
        averageLeadTime: 0,
        leadTimeVariability: 0,
        leadTimeConsistency: 0,
        deliveryReliabilityScore: 0,
        recentTrend: 'stable'
      },
      costPerformance: {
        averageUnitCost: 0,
        priceCompetitiveness: 0,
        priceStability: 0,
        costTrend: 'stable',
        totalCostOfOwnership: 0,
        paymentTerms: 'Unknown',
        discountOpportunities: []
      },
      qualityMetrics: {
        qualityRating: 0,
        defectRate: 0,
        returnRate: 0,
        qualityTrend: 'stable',
        certifications: [],
        qualityIncidents: 0
      },
      relationshipFactors: {
        communicationScore: 0,
        responsiveness: 0,
        flexibility: 0,
        strategicAlignment: 0,
        contractCompliance: 0,
        innovationSupport: 0
      },
      capacityAssessment: {
        productionCapacity: 0,
        currentUtilization: 0,
        scalabilityScore: 0,
        geographicCoverage: [],
        financialStability: 0,
        technologyCapabilities: []
      },
      overallScore: 0,
      ranking: 0,
      recommendation: 'avoid',
      riskFactors: [{
        type: 'operational',
        description: 'No historical data available',
        severity: 'high',
        probability: 'high',
        impact: 'Cannot assess supplier reliability',
        mitigation: 'Conduct supplier assessment before engagement'
      }]
    };
  }

  // Rank suppliers for a specific part
  async rankSuppliersForPart(partNumber: string): Promise<SupplierRanking> {
    const supplierIds = await this.getSuppliersForPart(partNumber);
    
    if (supplierIds.length === 0) {
      return {
        partNumber,
        rankings: [],
        marketAnalysis: {
          competitivePosition: 'weak',
          priceRange: { min: 0, max: 0, average: 0 },
          leadTimeRange: { min: 0, max: 0, average: 0 },
          marketTrends: ['No supplier data available'],
          supplierConcentration: 0
        },
        recommendedSupplier: {
          supplierId: '',
          reasoning: 'No suppliers found for this part',
          confidence: 0,
          alternativeSuppliers: []
        }
      };
    }

    // Evaluate all suppliers
    const evaluations = await Promise.all(
      supplierIds.map(supplierId => this.evaluateSupplierPerformance(supplierId, partNumber))
    );

    // Sort by overall score
    evaluations.sort((a, b) => b.overallScore - a.overallScore);

    // Assign rankings
    evaluations.forEach((evaluation, index) => {
      evaluation.ranking = index + 1;
    });

    // Calculate market analysis
    const marketAnalysis = this.calculateMarketAnalysis(evaluations);

    // Determine recommended supplier
    const recommendedSupplier = this.selectRecommendedSupplier(evaluations);

    return {
      partNumber,
      rankings: evaluations,
      marketAnalysis,
      recommendedSupplier
    };
  }

  // Calculate market analysis
  private calculateMarketAnalysis(evaluations: SupplierPerformanceAnalysis[]): MarketAnalysis {
    if (evaluations.length === 0) {
      return {
        competitivePosition: 'weak',
        priceRange: { min: 0, max: 0, average: 0 },
        leadTimeRange: { min: 0, max: 0, average: 0 },
        marketTrends: [],
        supplierConcentration: 0
      };
    }

    const costs = evaluations.map(e => e.costPerformance.averageUnitCost);
    const leadTimes = evaluations.map(e => e.deliveryPerformance.averageLeadTime);
    const scores = evaluations.map(e => e.overallScore);

    const priceRange = {
      min: Math.min(...costs),
      max: Math.max(...costs),
      average: costs.reduce((a, b) => a + b, 0) / costs.length
    };

    const leadTimeRange = {
      min: Math.min(...leadTimes),
      max: Math.max(...leadTimes),
      average: leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
    };

    // Determine competitive position based on supplier scores
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    let competitivePosition: 'strong' | 'moderate' | 'weak';
    
    if (averageScore >= 75) {
      competitivePosition = 'strong';
    } else if (averageScore >= 60) {
      competitivePosition = 'moderate';
    } else {
      competitivePosition = 'weak';
    }

    // Calculate supplier concentration (simplified Herfindahl index)
    const marketShares = evaluations.map(() => 1 / evaluations.length); // Assume equal market share
    const supplierConcentration = marketShares.reduce((sum, share) => sum + share * share, 0);

    const marketTrends = this.identifyMarketTrends(evaluations);

    return {
      competitivePosition,
      priceRange,
      leadTimeRange,
      marketTrends,
      supplierConcentration
    };
  }

  // Identify market trends
  private identifyMarketTrends(evaluations: SupplierPerformanceAnalysis[]): string[] {
    const trends: string[] = [];

    // Cost trends
    const increasingCosts = evaluations.filter(e => e.costPerformance.costTrend === 'increasing').length;
    const decreasingCosts = evaluations.filter(e => e.costPerformance.costTrend === 'decreasing').length;
    
    if (increasingCosts > evaluations.length * 0.6) {
      trends.push('Market prices trending upward');
    } else if (decreasingCosts > evaluations.length * 0.6) {
      trends.push('Market prices trending downward');
    }

    // Delivery trends
    const improvingDelivery = evaluations.filter(e => e.deliveryPerformance.recentTrend === 'improving').length;
    const decliningDelivery = evaluations.filter(e => e.deliveryPerformance.recentTrend === 'declining').length;
    
    if (improvingDelivery > evaluations.length * 0.6) {
      trends.push('Delivery performance improving across suppliers');
    } else if (decliningDelivery > evaluations.length * 0.6) {
      trends.push('Delivery performance declining across suppliers');
    }

    // Quality trends
    const improvingQuality = evaluations.filter(e => e.qualityMetrics.qualityTrend === 'improving').length;
    const decliningQuality = evaluations.filter(e => e.qualityMetrics.qualityTrend === 'declining').length;
    
    if (improvingQuality > evaluations.length * 0.6) {
      trends.push('Quality improvements across supplier base');
    } else if (decliningQuality > evaluations.length * 0.6) {
      trends.push('Quality concerns emerging across suppliers');
    }

    return trends;
  }

  // Select recommended supplier
  private selectRecommendedSupplier(evaluations: SupplierPerformanceAnalysis[]): {
    supplierId: string;
    reasoning: string;
    confidence: number;
    alternativeSuppliers: string[];
  } {
    
    if (evaluations.length === 0) {
      return {
        supplierId: '',
        reasoning: 'No suppliers available',
        confidence: 0,
        alternativeSuppliers: []
      };
    }

    // Find preferred suppliers
    const preferredSuppliers = evaluations.filter(e => e.recommendation === 'preferred');
    const acceptableSuppliers = evaluations.filter(e => e.recommendation === 'acceptable');

    let recommendedSupplier: SupplierPerformanceAnalysis;
    let confidence: number;
    let reasoning: string;

    if (preferredSuppliers.length > 0) {
      recommendedSupplier = preferredSuppliers[0]; // Highest scoring preferred supplier
      confidence = 0.9;
      reasoning = `Top-performing supplier with overall score of ${recommendedSupplier.overallScore}. Strong performance across all metrics.`;
    } else if (acceptableSuppliers.length > 0) {
      recommendedSupplier = acceptableSuppliers[0];
      confidence = 0.7;
      reasoning = `Best available supplier with overall score of ${recommendedSupplier.overallScore}. Acceptable performance but monitor closely.`;
    } else {
      recommendedSupplier = evaluations[0]; // Best of the rest
      confidence = 0.4;
      reasoning = `Limited supplier options. Score of ${recommendedSupplier.overallScore} indicates significant risks. Consider supplier development or sourcing alternatives.`;
    }

    // Get alternative suppliers (next 2-3 best)
    const alternativeSuppliers = evaluations
      .filter(e => e.supplierId !== recommendedSupplier.supplierId)
      .slice(0, 3)
      .map(e => e.supplierId);

    return {
      supplierId: recommendedSupplier.supplierId,
      reasoning,
      confidence,
      alternativeSuppliers
    };
  }

  // Save supplier metrics to DynamoDB
  async saveSupplierMetrics(analysis: SupplierPerformanceAnalysis): Promise<void> {
    const metrics: SupplierMetrics = {
      supplierId: analysis.supplierId,
      supplierName: analysis.supplierName,
      averageLeadTime: analysis.deliveryPerformance.averageLeadTime,
      onTimeDeliveryRate: analysis.deliveryPerformance.onTimeDeliveryRate,
      priceStability: analysis.costPerformance.priceStability,
      qualityRating: analysis.qualityMetrics.qualityRating,
      lastOrderDate: new Date(), // Would be calculated from actual data
      totalOrders: 0, // Would be calculated from actual data
      averageOrderValue: analysis.costPerformance.averageUnitCost,
      isPreferred: analysis.recommendation === 'preferred',
      lastUpdated: new Date()
    };

    const params = {
      TableName: awsConfig.supplierMetricsTable || 'SupplierMetrics',
      Item: {
        supplierId: { S: metrics.supplierId },
        supplierName: { S: metrics.supplierName },
        averageLeadTime: { N: metrics.averageLeadTime.toString() },
        onTimeDeliveryRate: { N: metrics.onTimeDeliveryRate.toString() },
        priceStability: { N: metrics.priceStability.toString() },
        qualityRating: { N: metrics.qualityRating.toString() },
        lastOrderDate: { S: metrics.lastOrderDate.toISOString() },
        totalOrders: { N: metrics.totalOrders.toString() },
        averageOrderValue: { N: metrics.averageOrderValue.toString() },
        isPreferred: { BOOL: metrics.isPreferred },
        lastUpdated: { S: metrics.lastUpdated.toISOString() }
      }
    };

    try {
      await this.dynamoClient.send(new PutItemCommand(params));
    } catch (error) {
      console.error('Error saving supplier metrics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const supplierEvaluationEngine = new SupplierEvaluationEngine();