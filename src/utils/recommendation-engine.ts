import { DynamoDBClient, QueryCommand, PutItemCommand, ScanCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDBClient, awsConfig } from './aws-clients';
import { 
  SparePart, 
  ReplenishmentRecommendation, 
  DemandForecast, 
  SupplierMetrics 
} from '../types';
import { demandAnalysisEngine, DemandPattern } from './demand-analysis';
import { SupplierEvaluationEngine, SupplierRanking } from './supplier-evaluation';
import { reorderPointCalculator, ReorderPointCalculation } from './reorder-point-calculator';
import { BedrockAgentCore } from './bedrock-agent-core';

// Recommendation generation interfaces
export interface RecommendationRequest {
  partNumber: string;
  currentStock: number;
  urgencyOverride?: 'low' | 'medium' | 'high' | 'critical';
  supplierPreference?: string;
  maxBudget?: number;
  requiredDeliveryDate?: Date;
}

export interface RecommendationContext {
  sparePart: SparePart;
  demandPattern: DemandPattern;
  demandForecast: DemandForecast[];
  reorderPointCalc: ReorderPointCalculation;
  supplierRanking: SupplierRanking;
  currentStock: number;
  marketConditions: MarketConditions;
}

export interface MarketConditions {
  priceVolatility: 'low' | 'medium' | 'high';
  supplyConstraints: boolean;
  seasonalFactors: string[];
  economicIndicators: {
    inflationRate: number;
    commodityPrices: 'rising' | 'stable' | 'falling';
    supplierCapacityUtilization: number;
  };
}

export interface UrgencyClassification {
  level: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  factors: UrgencyFactor[];
  timeToStockout: number; // Days
  businessImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
}

export interface UrgencyFactor {
  type: 'stock_level' | 'demand_spike' | 'lead_time' | 'seasonality' | 'supplier_risk';
  description: string;
  impact: number; // 0-100
  weight: number; // Relative importance
}

export interface CostOptimization {
  recommendedQuantity: number;
  unitCost: number;
  totalCost: number;
  alternatives: Array<{
    quantity: number;
    supplier: string;
    unitCost: number;
    totalCost: number;
    tradeoffs: string[];
  }>;
  costSavingsOpportunities: string[];
}

export interface AIReasoningResult {
  recommendation: string;
  confidence: number;
  reasoning: string[];
  riskAssessment: string[];
  alternatives: string[];
  keyInsights: string[];
}

// Main recommendation engine
export class RecommendationEngine {
  private dynamoClient: DynamoDBClient;
  private supplierEvaluator: SupplierEvaluationEngine;
  private bedrockAgentCore: BedrockAgentCore;

  constructor() {
    this.dynamoClient = dynamoDBClient;
    this.supplierEvaluator = new SupplierEvaluationEngine();
    this.bedrockAgentCore = new BedrockAgentCore();
  }

  // Generate comprehensive replenishment recommendation
  async generateRecommendation(request: RecommendationRequest): Promise<ReplenishmentRecommendation> {
    try {
      // Gather context data
      const context = await this.gatherRecommendationContext(request);
      
      // Classify urgency
      const urgency = this.classifyUrgency(context, request.urgencyOverride);
      
      // Optimize cost and quantity
      const costOptimization = await this.optimizeCostAndQuantity(context, request);
      
      // Select optimal supplier
      const selectedSupplier = this.selectOptimalSupplier(
        context.supplierRanking,
        request.supplierPreference,
        costOptimization
      );
      
      // Generate AI reasoning
      const aiReasoning = await this.generateAIReasoning(context, urgency, costOptimization);
      
      // Create final recommendation
      const recommendation: ReplenishmentRecommendation = {
        partNumber: request.partNumber,
        recommendationId: this.generateRecommendationId(),
        recommendedQuantity: costOptimization.recommendedQuantity,
        suggestedOrderDate: this.calculateOrderDate(urgency, context),
        preferredSupplier: selectedSupplier.supplierId,
        estimatedCost: costOptimization.totalCost,
        urgencyLevel: urgency.level,
        reasoning: this.buildReasoningText(aiReasoning, urgency, costOptimization),
        confidence: this.calculateOverallConfidence(context, aiReasoning),
        status: 'pending',
        createdAt: new Date()
      };

      // Save recommendation to database
      await this.saveRecommendation(recommendation);
      
      return recommendation;
      
    } catch (error) {
      console.error('Error generating recommendation:', error);
      throw new Error(`Failed to generate recommendation for part ${request.partNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Gather all context data needed for recommendation
  private async gatherRecommendationContext(request: RecommendationRequest): Promise<RecommendationContext> {
    // Get spare part data
    const sparePart = await this.getSparePart(request.partNumber);
    if (!sparePart) {
      throw new Error(`Spare part ${request.partNumber} not found`);
    }

    // Analyze demand patterns
    const demandPattern = await demandAnalysisEngine.analyzeDemandPatterns(request.partNumber);
    
    // Generate demand forecast
    const demandForecast = await demandAnalysisEngine.generateDemandForecast(
      request.partNumber,
      demandPattern,
      12 // 12 months forecast
    );

    // Get supplier ranking
    const supplierRanking = await this.supplierEvaluator.rankSuppliersForPart(request.partNumber);
    
    // Calculate reorder point
    const primarySupplier = supplierRanking.rankings[0];
    const supplierMetrics = await this.getSupplierMetrics(primarySupplier?.supplierId || '');
    
    const reorderPointCalc = await reorderPointCalculator.calculateReorderPoint(
      sparePart,
      demandPattern,
      supplierMetrics
    );

    // Assess market conditions
    const marketConditions = await this.assessMarketConditions(request.partNumber);

    return {
      sparePart,
      demandPattern,
      demandForecast,
      reorderPointCalc,
      supplierRanking,
      currentStock: request.currentStock,
      marketConditions
    };
  }

  // Classify urgency level based on multiple factors
  private classifyUrgency(context: RecommendationContext, override?: string): UrgencyClassification {
    const factors: UrgencyFactor[] = [];
    let totalScore = 0;

    // Stock level factor
    const stockRatio = context.currentStock / context.reorderPointCalc.reorderPoint;
    let stockImpact: number;
    
    if (stockRatio <= 0.5) {
      stockImpact = 100;
    } else if (stockRatio <= 0.8) {
      stockImpact = 75;
    } else if (stockRatio <= 1.0) {
      stockImpact = 50;
    } else {
      stockImpact = 25;
    }

    factors.push({
      type: 'stock_level',
      description: `Current stock is ${(stockRatio * 100).toFixed(0)}% of reorder point`,
      impact: stockImpact,
      weight: 0.4
    });

    // Demand spike factor
    const recentDemandTrend = context.demandPattern.trend.direction;
    let demandImpact = 25; // Base impact
    
    if (recentDemandTrend === 'increasing') {
      demandImpact = 60;
    }
    
    // Check for anomalies
    const recentAnomalies = context.demandPattern.anomalies.filter(
      anomaly => anomaly.date > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
    );
    
    if (recentAnomalies.length > 0) {
      demandImpact = Math.max(demandImpact, 75);
    }

    factors.push({
      type: 'demand_spike',
      description: `Demand trend: ${recentDemandTrend}, ${recentAnomalies.length} recent anomalies`,
      impact: demandImpact,
      weight: 0.25
    });

    // Lead time factor
    const avgLeadTime = context.reorderPointCalc.leadTimeDays;
    const leadTimeImpact = Math.min(100, (avgLeadTime / 30) * 50); // Longer lead time = higher urgency

    factors.push({
      type: 'lead_time',
      description: `Average lead time: ${avgLeadTime} days`,
      impact: leadTimeImpact,
      weight: 0.2
    });

    // Seasonality factor
    let seasonalImpact = 25;
    if (context.demandPattern.seasonality.detected) {
      const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const seasonalIndex = context.demandPattern.seasonality.indices[currentMonth] || 1;
      
      if (seasonalIndex > 1.2) {
        seasonalImpact = 70; // Peak season
      } else if (seasonalIndex < 0.8) {
        seasonalImpact = 10; // Low season
      }
    }

    factors.push({
      type: 'seasonality',
      description: `Seasonal factor: ${context.demandPattern.seasonality.detected ? 'detected' : 'none'}`,
      impact: seasonalImpact,
      weight: 0.1
    });

    // Supplier risk factor
    const supplierRisk = context.supplierRanking.rankings[0]?.riskFactors.length || 0;
    const supplierImpact = Math.min(100, supplierRisk * 25);

    factors.push({
      type: 'supplier_risk',
      description: `${supplierRisk} supplier risk factors identified`,
      impact: supplierImpact,
      weight: 0.05
    });

    // Calculate weighted score
    totalScore = factors.reduce((sum, factor) => sum + (factor.impact * factor.weight), 0);

    // Apply override if specified
    let finalLevel: 'low' | 'medium' | 'high' | 'critical';
    if (override && ['low', 'medium', 'high', 'critical'].includes(override)) {
      finalLevel = override as 'low' | 'medium' | 'high' | 'critical';
    } else {
      if (totalScore >= 80) {
        finalLevel = 'critical';
      } else if (totalScore >= 60) {
        finalLevel = 'high';
      } else if (totalScore >= 40) {
        finalLevel = 'medium';
      } else {
        finalLevel = 'low';
      }
    }

    // Calculate time to stockout
    const dailyDemand = context.demandPattern.variability.meanDemand / 30;
    const timeToStockout = dailyDemand > 0 ? context.currentStock / dailyDemand : 999;

    // Determine business impact
    let businessImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    const partCategory = context.sparePart.category.toLowerCase();
    
    if (partCategory.includes('critical') || partCategory.includes('safety')) {
      businessImpact = 'severe';
    } else if (partCategory.includes('high') || partCategory.includes('important')) {
      businessImpact = 'significant';
    } else if (partCategory.includes('medium')) {
      businessImpact = 'moderate';
    } else {
      businessImpact = 'minimal';
    }

    return {
      level: finalLevel,
      score: totalScore,
      factors,
      timeToStockout,
      businessImpact
    };
  }

  // Optimize cost and quantity recommendations
  private async optimizeCostAndQuantity(
    context: RecommendationContext,
    request: RecommendationRequest
  ): Promise<CostOptimization> {
    
    const alternatives: Array<{
      quantity: number;
      supplier: string;
      unitCost: number;
      totalCost: number;
      tradeoffs: string[];
    }> = [];

    const costSavingsOpportunities: string[] = [];

    // Base recommendation from reorder point calculation
    let recommendedQuantity = Math.max(
      context.reorderPointCalc.reorderPoint - context.currentStock,
      0
    );

    // Consider EOQ for quantity optimization
    const annualDemand = context.demandPattern.variability.meanDemand * 12;
    const orderingCost = 50; // Mock ordering cost
    const carryingCostPerUnit = 10; // Mock carrying cost
    
    const eoq = reorderPointCalculator.calculateEOQ(
      annualDemand,
      orderingCost,
      carryingCostPerUnit
    );

    // Adjust quantity based on EOQ if significantly different
    if (eoq.eoq > recommendedQuantity * 1.5) {
      recommendedQuantity = Math.min(eoq.eoq, recommendedQuantity * 2);
      costSavingsOpportunities.push(`Consider EOQ of ${eoq.eoq} units for optimal ordering costs`);
    }

    // Apply budget constraints
    const primarySupplier = context.supplierRanking.rankings[0];
    const estimatedUnitCost = primarySupplier?.costPerformance.averageUnitCost || 50;
    
    if (request.maxBudget && recommendedQuantity * estimatedUnitCost > request.maxBudget) {
      recommendedQuantity = Math.floor(request.maxBudget / estimatedUnitCost);
      costSavingsOpportunities.push('Quantity reduced due to budget constraints');
    }

    // Generate alternatives with different suppliers
    for (const supplier of context.supplierRanking.rankings.slice(0, 3)) {
      const unitCost = supplier.costPerformance.averageUnitCost;
      const totalCost = recommendedQuantity * unitCost;
      const tradeoffs: string[] = [];

      if (supplier.deliveryPerformance.averageLeadTime > primarySupplier.deliveryPerformance.averageLeadTime) {
        tradeoffs.push(`${supplier.deliveryPerformance.averageLeadTime - primarySupplier.deliveryPerformance.averageLeadTime} days longer lead time`);
      }

      if (supplier.qualityMetrics.qualityRating < primarySupplier.qualityMetrics.qualityRating) {
        tradeoffs.push(`${(primarySupplier.qualityMetrics.qualityRating - supplier.qualityMetrics.qualityRating).toFixed(1)} points lower quality rating`);
      }

      alternatives.push({
        quantity: recommendedQuantity,
        supplier: supplier.supplierId,
        unitCost,
        totalCost,
        tradeoffs
      });
    }

    // Check for volume discounts
    if (recommendedQuantity < annualDemand * 0.25) {
      costSavingsOpportunities.push('Consider larger quantities for potential volume discounts');
    }

    return {
      recommendedQuantity,
      unitCost: estimatedUnitCost,
      totalCost: recommendedQuantity * estimatedUnitCost,
      alternatives,
      costSavingsOpportunities
    };
  }

  // Select optimal supplier based on ranking and preferences
  private selectOptimalSupplier(
    supplierRanking: SupplierRanking,
    supplierPreference?: string,
    costOptimization?: CostOptimization
  ): { supplierId: string; reasoning: string } {
    
    // Use preferred supplier if specified and available
    if (supplierPreference) {
      const preferredSupplier = supplierRanking.rankings.find(
        s => s.supplierId === supplierPreference
      );
      
      if (preferredSupplier && preferredSupplier.recommendation !== 'avoid') {
        return {
          supplierId: supplierPreference,
          reasoning: 'User-specified preferred supplier'
        };
      }
    }

    // Use recommended supplier from ranking
    if (supplierRanking.recommendedSupplier.supplierId) {
      return {
        supplierId: supplierRanking.recommendedSupplier.supplierId,
        reasoning: supplierRanking.recommendedSupplier.reasoning
      };
    }

    // Fallback to first available supplier
    const firstSupplier = supplierRanking.rankings[0];
    if (firstSupplier) {
      return {
        supplierId: firstSupplier.supplierId,
        reasoning: 'Best available supplier based on performance metrics'
      };
    }

    throw new Error('No suitable suppliers found');
  }

  // Generate AI-powered reasoning using Bedrock AgentCore
  private async generateAIReasoning(
    context: RecommendationContext,
    urgency: UrgencyClassification,
    costOptimization: CostOptimization
  ): Promise<AIReasoningResult> {
    
    const prompt = this.buildAIReasoningPrompt(context, urgency, costOptimization);
    
    try {
      const response = await this.bedrockAgentCore.reason(
        prompt,
        { analysisType: 'inventory_replenishment_analysis' }
      );

      return this.parseAIResponse(response);
      
    } catch (error) {
      console.error('Error generating AI reasoning:', error);
      
      // Fallback to rule-based reasoning
      return this.generateFallbackReasoning(context, urgency, costOptimization);
    }
  }

  // Build prompt for AI reasoning
  private buildAIReasoningPrompt(
    context: RecommendationContext,
    urgency: UrgencyClassification,
    costOptimization: CostOptimization
  ): string {
    
    return `
Analyze the following inventory replenishment scenario and provide detailed reasoning:

PART INFORMATION:
- Part Number: ${context.sparePart.partNumber}
- Description: ${context.sparePart.description}
- Category: ${context.sparePart.category}
- Current Stock: ${context.currentStock}
- Reorder Point: ${context.reorderPointCalc.reorderPoint}
- Safety Stock: ${context.reorderPointCalc.safetyStock}

DEMAND ANALYSIS:
- Average Monthly Demand: ${context.demandPattern.variability.meanDemand.toFixed(2)}
- Demand Variability: ${context.demandPattern.variability.classification}
- Trend: ${context.demandPattern.trend.direction}
- Seasonality: ${context.demandPattern.seasonality.detected ? 'Yes' : 'No'}
- Forecastability Score: ${(context.demandPattern.forecastability.score * 100).toFixed(1)}%

SUPPLIER INFORMATION:
- Recommended Supplier: ${context.supplierRanking.recommendedSupplier.supplierId}
- Supplier Score: ${context.supplierRanking.rankings[0]?.overallScore || 'N/A'}
- Average Lead Time: ${context.supplierRanking.rankings[0]?.deliveryPerformance.averageLeadTime || 'N/A'} days
- On-Time Delivery: ${context.supplierRanking.rankings[0]?.deliveryPerformance.onTimeDeliveryRate || 'N/A'}%

URGENCY ASSESSMENT:
- Urgency Level: ${urgency.level}
- Urgency Score: ${urgency.score.toFixed(1)}
- Time to Stockout: ${urgency.timeToStockout.toFixed(1)} days
- Business Impact: ${urgency.businessImpact}

COST OPTIMIZATION:
- Recommended Quantity: ${costOptimization.recommendedQuantity}
- Unit Cost: $${costOptimization.unitCost.toFixed(2)}
- Total Cost: $${costOptimization.totalCost.toFixed(2)}

Please provide:
1. A clear recommendation with confidence level
2. Detailed reasoning for the recommendation
3. Risk assessment and mitigation strategies
4. Alternative approaches if applicable
5. Key insights for inventory management

Format your response as JSON with the following structure:
{
  "recommendation": "string",
  "confidence": number (0-1),
  "reasoning": ["string array"],
  "riskAssessment": ["string array"],
  "alternatives": ["string array"],
  "keyInsights": ["string array"]
}
`;
  }

  // Parse AI response
  private parseAIResponse(response: string): AIReasoningResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          recommendation: parsed.recommendation || 'Proceed with replenishment order',
          confidence: parsed.confidence || 0.7,
          reasoning: parsed.reasoning || ['AI analysis completed'],
          riskAssessment: parsed.riskAssessment || ['Standard inventory risks apply'],
          alternatives: parsed.alternatives || ['Consider alternative suppliers'],
          keyInsights: parsed.keyInsights || ['Monitor demand patterns closely']
        };
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    // Fallback parsing - treat entire response as reasoning
    return {
      recommendation: 'Proceed with replenishment order based on analysis',
      confidence: 0.7,
      reasoning: [response || 'Analysis completed with available data'],
      riskAssessment: ['Standard inventory management risks'],
      alternatives: ['Review supplier alternatives'],
      keyInsights: ['Continue monitoring demand patterns']
    };
  }

  // Generate fallback reasoning when AI is unavailable
  private generateFallbackReasoning(
    context: RecommendationContext,
    urgency: UrgencyClassification,
    costOptimization: CostOptimization
  ): AIReasoningResult {
    
    const reasoning: string[] = [];
    const riskAssessment: string[] = [];
    const alternatives: string[] = [];
    const keyInsights: string[] = [];

    // Build reasoning
    reasoning.push(`Current stock (${context.currentStock}) is ${context.currentStock < context.reorderPointCalc.reorderPoint ? 'below' : 'at or above'} reorder point (${context.reorderPointCalc.reorderPoint})`);
    reasoning.push(`Demand pattern shows ${context.demandPattern.trend.direction} trend with ${context.demandPattern.variability.classification} variability`);
    reasoning.push(`Recommended supplier has ${context.supplierRanking.rankings[0]?.overallScore || 'unknown'} performance score`);

    // Risk assessment
    if (urgency.level === 'critical' || urgency.level === 'high') {
      riskAssessment.push('High risk of stockout if order is delayed');
    }
    
    if (context.demandPattern.variability.classification === 'high') {
      riskAssessment.push('High demand variability increases forecast uncertainty');
    }

    // Alternatives
    if (costOptimization.alternatives.length > 1) {
      alternatives.push(`${costOptimization.alternatives.length - 1} alternative suppliers available`);
    }

    // Key insights
    keyInsights.push(`Forecastability score: ${(context.demandPattern.forecastability.score * 100).toFixed(1)}%`);
    
    if (context.demandPattern.seasonality.detected) {
      keyInsights.push('Seasonal demand patterns detected - plan accordingly');
    }

    return {
      recommendation: 'Proceed with replenishment order',
      confidence: 0.7,
      reasoning,
      riskAssessment,
      alternatives,
      keyInsights
    };
  }

  // Calculate suggested order date based on urgency and lead time
  private calculateOrderDate(urgency: UrgencyClassification, context: RecommendationContext): Date {
    const today = new Date();
    const leadTimeDays = context.reorderPointCalc.leadTimeDays;
    
    let daysToOrder = 0;
    
    switch (urgency.level) {
      case 'critical':
        daysToOrder = 0; // Order immediately
        break;
      case 'high':
        daysToOrder = Math.max(0, urgency.timeToStockout - leadTimeDays - 5); // 5-day buffer
        break;
      case 'medium':
        daysToOrder = Math.max(0, urgency.timeToStockout - leadTimeDays - 10); // 10-day buffer
        break;
      case 'low':
        daysToOrder = Math.max(0, urgency.timeToStockout - leadTimeDays - 15); // 15-day buffer
        break;
    }

    const orderDate = new Date(today);
    orderDate.setDate(today.getDate() + daysToOrder);
    
    return orderDate;
  }

  // Build comprehensive reasoning text
  private buildReasoningText(
    aiReasoning: AIReasoningResult,
    urgency: UrgencyClassification,
    costOptimization: CostOptimization
  ): string {
    
    const sections: string[] = [];
    
    // AI recommendation
    sections.push(`AI Analysis: ${aiReasoning.recommendation}`);
    
    // Urgency justification
    sections.push(`Urgency Level: ${urgency.level.toUpperCase()} (${urgency.score.toFixed(1)}/100)`);
    sections.push(`Key factors: ${urgency.factors.map(f => f.description).join('; ')}`);
    
    // Cost optimization
    sections.push(`Quantity Optimization: ${costOptimization.recommendedQuantity} units at $${costOptimization.unitCost.toFixed(2)} each`);
    
    if (costOptimization.costSavingsOpportunities.length > 0) {
      sections.push(`Cost Savings: ${costOptimization.costSavingsOpportunities.join('; ')}`);
    }
    
    // AI reasoning details
    if (aiReasoning.reasoning.length > 0) {
      sections.push(`Detailed Analysis: ${aiReasoning.reasoning.join('; ')}`);
    }
    
    return sections.join(' | ');
  }

  // Calculate overall confidence in recommendation
  private calculateOverallConfidence(
    context: RecommendationContext,
    aiReasoning: AIReasoningResult
  ): number {
    
    let confidence = 0.5; // Base confidence
    
    // Add confidence from reorder point calculation
    confidence += context.reorderPointCalc.confidence * 0.3;
    
    // Add confidence from demand forecasting
    confidence += context.demandPattern.forecastability.score * 0.2;
    
    // Add confidence from supplier ranking
    if (context.supplierRanking.recommendedSupplier.confidence) {
      confidence += context.supplierRanking.recommendedSupplier.confidence * 0.2;
    }
    
    // Add AI confidence
    confidence += aiReasoning.confidence * 0.3;
    
    return Math.min(0.95, confidence);
  }

  // Generate unique recommendation ID
  private generateRecommendationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `REC-${timestamp}-${random}`.toUpperCase();
  }

  // Helper methods for data retrieval
  private async getSparePart(partNumber: string): Promise<SparePart | null> {
    const params = {
      TableName: awsConfig.sparePartsTable || 'SpareParts',
      Key: {
        partNumber: { S: partNumber }
      }
    };

    try {
      const result = await this.dynamoClient.send(new GetItemCommand(params));
      
      if (result.Item) {
        return {
          partNumber: result.Item.partNumber?.S || '',
          description: result.Item.description?.S || '',
          category: result.Item.category?.S || '',
          unitOfMeasure: result.Item.unitOfMeasure?.S || '',
          currentStock: parseFloat(result.Item.currentStock?.N || '0'),
          safetyStock: parseFloat(result.Item.safetyStock?.N || '0'),
          reorderPoint: parseFloat(result.Item.reorderPoint?.N || '0'),
          leadTimeDays: parseFloat(result.Item.leadTimeDays?.N || '14'),
          lastUpdated: new Date(result.Item.lastUpdated?.S || ''),
          isActive: result.Item.isActive?.BOOL || true
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching spare part:', error);
      return null;
    }
  }

  private async getSupplierMetrics(supplierId: string): Promise<SupplierMetrics> {
    // Mock supplier metrics - in real implementation, this would fetch from DynamoDB
    return {
      supplierId,
      supplierName: `Supplier ${supplierId}`,
      averageLeadTime: 14,
      onTimeDeliveryRate: 85,
      priceStability: 0.8,
      qualityRating: 80,
      lastOrderDate: new Date(),
      totalOrders: 25,
      averageOrderValue: 1500,
      isPreferred: true,
      lastUpdated: new Date()
    };
  }

  private async assessMarketConditions(partNumber: string): Promise<MarketConditions> {
    // Mock market conditions - in real implementation, this would analyze market data
    return {
      priceVolatility: 'medium',
      supplyConstraints: false,
      seasonalFactors: ['Q4 demand increase'],
      economicIndicators: {
        inflationRate: 3.2,
        commodityPrices: 'stable',
        supplierCapacityUtilization: 75
      }
    };
  }

  // Save recommendation to database
  private async saveRecommendation(recommendation: ReplenishmentRecommendation): Promise<void> {
    const params = {
      TableName: awsConfig.recommendationsTable || 'ReplenishmentRecommendations',
      Item: {
        recommendationId: { S: recommendation.recommendationId },
        partNumber: { S: recommendation.partNumber },
        recommendedQuantity: { N: recommendation.recommendedQuantity.toString() },
        suggestedOrderDate: { S: recommendation.suggestedOrderDate.toISOString() },
        preferredSupplier: { S: recommendation.preferredSupplier },
        estimatedCost: { N: recommendation.estimatedCost.toString() },
        urgencyLevel: { S: recommendation.urgencyLevel },
        reasoning: { S: recommendation.reasoning },
        confidence: { N: recommendation.confidence.toString() },
        status: { S: recommendation.status },
        createdAt: { S: recommendation.createdAt.toISOString() },
        ttl: { N: Math.floor((Date.now() + 90 * 24 * 60 * 60 * 1000) / 1000).toString() } // 90 days TTL
      }
    };

    try {
      await this.dynamoClient.send(new PutItemCommand(params));
    } catch (error) {
      console.error('Error saving recommendation:', error);
      throw error;
    }
  }

  // Batch generate recommendations for multiple parts
  async generateBatchRecommendations(
    requests: RecommendationRequest[]
  ): Promise<ReplenishmentRecommendation[]> {
    
    const recommendations: ReplenishmentRecommendation[] = [];
    const batchSize = 5; // Process in batches to avoid overwhelming the system
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(request => 
        this.generateRecommendation(request).catch(error => {
          console.error(`Error processing ${request.partNumber}:`, error);
          return null;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result) {
          recommendations.push(result);
        }
      });
      
      // Small delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return recommendations;
  }
}

// Export singleton instance
export const recommendationEngine = new RecommendationEngine();