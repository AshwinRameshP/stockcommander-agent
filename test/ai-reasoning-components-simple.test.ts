// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-dynamodb');

// Mock AWS clients
const mockSend = jest.fn();
jest.mock('../src/utils/aws-clients', () => ({
  bedrockRuntimeClient: {
    send: mockSend
  },
  dynamoDBClient: {
    send: mockSend
  },
  bedrockConfig: {
    modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
    maxTokens: 4000,
    temperature: 0.1
  },
  awsConfig: {
    normalizedInvoiceDataTable: 'test-table',
    supplierMetricsTable: 'test-supplier-table'
  }
}));

import { agentCore, BedrockAgentCore } from '../src/utils/bedrock-agent-core';
import { demandAnalysisEngine } from '../src/utils/demand-analysis';
import { supplierEvaluationEngine } from '../src/utils/supplier-evaluation';

describe('AI Reasoning Components - Comprehensive Tests', () => {
  let agentCore: BedrockAgentCore;

  beforeEach(() => {
    agentCore = new BedrockAgentCore();
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  describe('BedrockAgentCore Integration', () => {
    test('should create agent memory', () => {
      const sessionId = 'test-session-123';
      
      const memory = agentCore.getOrCreateMemory(sessionId);
      
      expect(memory).toBeDefined();
      expect(memory.sessionId).toBe(sessionId);
      expect(memory.conversationHistory).toEqual([]);
      expect(memory.workingMemory).toEqual({});
      expect(memory.longTermMemory).toEqual({});
    });

    test('should update agent memory', () => {
      const sessionId = 'test-session-456';
      
      agentCore.updateMemory(sessionId, {
        workingMemory: { testKey: 'testValue' },
        context: { partNumber: 'XYZ789' }
      });
      
      const memory = agentCore.getOrCreateMemory(sessionId);
      expect(memory.workingMemory.testKey).toBe('testValue');
      expect(memory.context.partNumber).toBe('XYZ789');
    });

    test('should execute get_historical_demand tool', async () => {
      const sessionId = 'test-session';
      const memory = agentCore.getOrCreateMemory(sessionId);

      // Mock DynamoDB response
      const mockDynamoResponse = {
        Items: [
          {
            partNumber: { S: 'ABC123' },
            invoiceDate: { S: '2024-01-15' },
            invoiceId: { S: 'INV001' },
            invoiceType: { S: 'sales' },
            quantity: { N: '10' },
            unitPrice: { N: '25.50' },
            totalAmount: { N: '255.00' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Test part' },
            originalDescription: { S: 'Test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.95' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      mockSend.mockResolvedValueOnce(mockDynamoResponse);

      const tool = agentCore['tools'].get('get_historical_demand');
      expect(tool).toBeDefined();

      const result = await tool!.execute(
        { partNumber: 'ABC123', timeRange: '12months' },
        memory
      );

      expect(result).toBeDefined();
      expect(result.partNumber).toBe('ABC123');
      expect(result.demandHistory).toHaveLength(1);
      expect(result.totalDemand).toBe(10);
    });
  });

  describe('Demand Analysis Engine', () => {
    test('should retrieve historical demand data', async () => {
      const mockDynamoResponse = {
        Items: [
          {
            partNumber: { S: 'TEST123' },
            invoiceDate: { S: '2024-01-15' },
            invoiceType: { S: 'sales' },
            quantity: { N: '10' },
            unitPrice: { N: '25.50' },
            totalAmount: { N: '255.00' },
            invoiceId: { S: 'INV-001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Test part' },
            originalDescription: { S: 'Test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.95' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      mockSend.mockResolvedValueOnce(mockDynamoResponse);

      const historicalData = await demandAnalysisEngine.getHistoricalDemand('TEST123', 12);

      expect(historicalData).toHaveLength(1);
      expect(historicalData[0].partNumber).toBe('TEST123');
      expect(historicalData[0].quantity).toBe(10);
    });

    test('should handle empty historical data', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const historicalData = await demandAnalysisEngine.getHistoricalDemand('NONEXISTENT', 12);

      expect(historicalData).toHaveLength(0);
    });

    test('should analyze demand patterns with no data', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const pattern = await demandAnalysisEngine.analyzeDemandPatterns('NODATA123', 24);

      expect(pattern.partNumber).toBe('NODATA123');
      expect(pattern.trend.direction).toBe('stable');
      expect(pattern.seasonality.detected).toBe(false);
      expect(pattern.forecastability.score).toBe(0);
      expect(pattern.forecastability.challenges).toContain('No historical data available');
    });
  });

  describe('Supplier Evaluation Engine', () => {
    test('should evaluate supplier with historical data', async () => {
      const mockPurchaseHistory = [
        {
          partNumber: { S: 'SUPPLIER123' },
          invoiceDate: { S: '2024-01-15' },
          invoiceType: { S: 'purchase' },
          supplierId: { S: 'SUP001' },
          quantity: { N: '100' },
          unitPrice: { N: '15.50' },
          totalAmount: { N: '1550.00' },
          invoiceId: { S: 'PINV001' },
          currency: { S: 'USD' },
          normalizedDescription: { S: 'Supplier test part' },
          originalDescription: { S: 'Supplier test part' },
          category: { S: 'Electronics' },
          unitOfMeasure: { S: 'EA' },
          qualityScore: { N: '0.92' },
          normalizationTimestamp: { S: new Date().toISOString() },
          dataSource: { S: 'test' }
        }
      ];

      mockSend.mockResolvedValueOnce({ Items: mockPurchaseHistory });

      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('SUP001', 'SUPPLIER123');

      expect(analysis.supplierId).toBe('SUP001');
      expect(analysis.overallScore).toBeGreaterThan(0);
      expect(analysis.deliveryPerformance).toBeDefined();
      expect(analysis.costPerformance).toBeDefined();
      expect(analysis.qualityMetrics).toBeDefined();
      expect(analysis.recommendation).toMatch(/preferred|acceptable|monitor|avoid/);
    });

    test('should handle supplier with no data', async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });

      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('NEWSUP001');

      expect(analysis.supplierId).toBe('NEWSUP001');
      expect(analysis.overallScore).toBe(0);
      expect(analysis.recommendation).toBe('avoid');
      expect(analysis.riskFactors).toHaveLength(1);
      expect(analysis.riskFactors[0].description).toContain('No historical data');
    });

    test('should rank suppliers for a part', async () => {
      // Mock suppliers for part
      const mockSuppliersQuery = {
        Items: [
          { supplierId: { S: 'SUP001' } },
          { supplierId: { S: 'SUP002' } }
        ]
      };

      // Mock purchase history for each supplier
      const mockPurchaseHistory = {
        Items: [
          {
            partNumber: { S: 'RANK123' },
            invoiceDate: { S: '2024-01-15' },
            invoiceType: { S: 'purchase' },
            supplierId: { S: 'SUP001' },
            quantity: { N: '50' },
            unitPrice: { N: '20.00' },
            totalAmount: { N: '1000.00' },
            invoiceId: { S: 'PINV001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Ranking test part' },
            originalDescription: { S: 'Ranking test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.95' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      // Mock the sequence of calls
      mockSend
        .mockResolvedValueOnce(mockSuppliersQuery) // Get suppliers for part
        .mockResolvedValueOnce(mockPurchaseHistory) // SUP001 history
        .mockResolvedValueOnce(mockPurchaseHistory); // SUP002 history

      const ranking = await supplierEvaluationEngine.rankSuppliersForPart('RANK123');

      expect(ranking.partNumber).toBe('RANK123');
      expect(ranking.rankings).toHaveLength(2);
      expect(ranking.rankings[0].ranking).toBe(1);
      expect(ranking.rankings[1].ranking).toBe(2);
      expect(ranking.recommendedSupplier.supplierId).toBeTruthy();
      expect(ranking.marketAnalysis).toBeDefined();
    });
  });
});
  describe('Advanced AgentCore Tests', () => {
    test('should create comprehensive inventory analysis plan', async () => {
      const objective = 'Perform comprehensive inventory analysis for part ABC123';
      const context = { partNumber: 'ABC123', analysisType: 'full' };

      // Mock Bedrock response
      const mockPlanResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              steps: [
                {
                  stepId: 'step_1',
                  description: 'Get historical demand data',
                  toolName: 'get_historical_demand',
                  parameters: { partNumber: 'ABC123', timeRange: '12months' },
                  dependencies: []
                },
                {
                  stepId: 'step_2',
                  description: 'Calculate demand patterns',
                  toolName: 'calculate_demand_patterns',
                  parameters: { partNumber: 'ABC123' },
                  dependencies: ['step_1']
                }
              ]
            })
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockPlanResponse);

      const plan = await agentCore.createPlan(objective, context);

      expect(plan).toBeDefined();
      expect(plan.objective).toBe(objective);
      expect(plan.steps).toHaveLength(2);
      expect(plan.status).toBe('pending');
      expect(plan.steps[0].toolName).toBe('get_historical_demand');
      expect(plan.steps[1].dependencies).toContain('step_1');
    });

    test('should handle malformed plan response gracefully', async () => {
      const objective = 'Test malformed response';
      const context = {};

      // Mock malformed Bedrock response
      const mockPlanResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Invalid JSON response'
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockPlanResponse);

      const plan = await agentCore.createPlan(objective, context);

      expect(plan).toBeDefined();
      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0].toolName).toBe('generate_recommendation');
    });

    test('should execute plan with dependencies', async () => {
      const sessionId = 'test-execution';
      
      const plan = {
        planId: 'test-plan',
        objective: 'Test execution',
        steps: [
          {
            stepId: 'step_1',
            description: 'First step',
            toolName: 'get_historical_demand',
            parameters: { partNumber: 'TEST123' },
            dependencies: [],
            status: 'pending' as const
          },
          {
            stepId: 'step_2',
            description: 'Second step',
            toolName: 'calculate_demand_patterns',
            parameters: { partNumber: 'TEST123' },
            dependencies: ['step_1'],
            status: 'pending' as const
          }
        ],
        context: {},
        status: 'pending' as const,
        createdAt: new Date()
      };

      // Mock tool responses
      mockSend.mockResolvedValueOnce({ Items: [] }); // Empty historical data
      
      const mockPattern = {
        partNumber: 'TEST123',
        analysisDate: new Date(),
        trend: { direction: 'stable' as const, strength: 0, changePoints: [], confidence: 0, monthlyGrowthRate: 0 },
        seasonality: { detected: false, pattern: 'none' as const, indices: {}, strength: 0, confidence: 0, peakPeriods: [], lowPeriods: [] },
        variability: { coefficient: 0, classification: 'low' as const, volatilityPattern: 'consistent' as const, standardDeviation: 0, meanDemand: 0 },
        anomalies: [],
        forecastability: { score: 0, challenges: ['No historical data'], recommendations: [], confidence: 0 }
      };
      
      jest.spyOn(demandAnalysisEngine, 'analyzeDemandPatterns').mockResolvedValueOnce(mockPattern);

      const executedPlan = await agentCore.executePlan(plan, sessionId);

      expect(executedPlan.status).toBe('completed');
      expect(executedPlan.steps[0].status).toBe('completed');
      expect(executedPlan.steps[1].status).toBe('completed');
    });

    test('should perform AI reasoning with context', async () => {
      const prompt = 'Should we reorder part ABC123?';
      const context = {
        currentStock: 5,
        reorderPoint: 10,
        leadTime: 14,
        averageDemand: 2
      };

      const mockReasoningResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Based on the current stock level of 5 units and reorder point of 10 units, yes, part ABC123 should be reordered immediately.'
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockReasoningResponse);

      const reasoning = await agentCore.reason(prompt, context);

      expect(reasoning).toContain('should be reordered');
      expect(reasoning).toContain('current stock level of 5');
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
        modelId: 'anthropic.claude-3-sonnet-20240229-v1:0'
      }));
    });
  });

  describe('Advanced Demand Analysis Tests', () => {
    test('should analyze demand patterns with sufficient data', async () => {
      // Mock historical data with trend and seasonality
      const mockHistoricalData = Array.from({ length: 24 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (23 - i));
        const baseQuantity = 10;
        const trend = i * 0.5; // Increasing trend
        const seasonal = Math.sin((i % 12) * Math.PI / 6) * 2; // Seasonal pattern
        
        return {
          partNumber: { S: 'PATTERN123' },
          invoiceDate: { S: date.toISOString().split('T')[0] },
          invoiceType: { S: 'sales' },
          quantity: { N: Math.max(1, baseQuantity + trend + seasonal).toString() },
          unitPrice: { N: '25.00' },
          totalAmount: { N: '250.00' },
          invoiceId: { S: `INV-${i}` },
          currency: { S: 'USD' },
          normalizedDescription: { S: 'Pattern test part' },
          originalDescription: { S: 'Pattern test part' },
          category: { S: 'Electronics' },
          unitOfMeasure: { S: 'EA' },
          qualityScore: { N: '0.95' },
          normalizationTimestamp: { S: new Date().toISOString() },
          dataSource: { S: 'test' }
        };
      });

      mockSend.mockResolvedValueOnce({ Items: mockHistoricalData });

      const pattern = await demandAnalysisEngine.analyzeDemandPatterns('PATTERN123', 24);

      expect(pattern.partNumber).toBe('PATTERN123');
      expect(pattern.trend.direction).toBe('increasing');
      expect(pattern.trend.strength).toBeGreaterThan(0);
      expect(pattern.seasonality.detected).toBe(true);
      expect(pattern.variability.classification).toMatch(/low|medium|high/);
      expect(pattern.forecastability.score).toBeGreaterThan(0);
    });

    test('should generate demand forecasts based on patterns', async () => {
      const mockPattern = {
        partNumber: 'FORECAST123',
        analysisDate: new Date(),
        trend: {
          direction: 'increasing' as const,
          strength: 0.6,
          changePoints: [],
          confidence: 0.8,
          monthlyGrowthRate: 3.5
        },
        seasonality: {
          detected: true,
          pattern: 'monthly' as const,
          indices: {
            '01': 1.2, '02': 0.9, '03': 1.1, '04': 0.8,
            '05': 1.0, '06': 1.3, '07': 0.7, '08': 0.9,
            '09': 1.1, '10': 1.2, '11': 1.4, '12': 1.5
          },
          strength: 0.4,
          confidence: 0.7,
          peakPeriods: ['12', '11', '06'],
          lowPeriods: ['07', '04', '02']
        },
        variability: {
          coefficient: 0.25,
          classification: 'medium' as const,
          volatilityPattern: 'consistent' as const,
          standardDeviation: 3.2,
          meanDemand: 12.8
        },
        anomalies: [],
        forecastability: {
          score: 0.75,
          challenges: [],
          recommendations: ['Use seasonal forecasting model'],
          confidence: 0.8
        }
      };

      const forecasts = await demandAnalysisEngine.generateDemandForecast('FORECAST123', mockPattern, 6);

      expect(forecasts).toHaveLength(6);
      expect(forecasts[0].partNumber).toBe('FORECAST123');
      expect(forecasts[0].predictedDemand).toBeGreaterThan(0);
      expect(forecasts[0].confidenceInterval.lower).toBeLessThanOrEqual(forecasts[0].predictedDemand);
      expect(forecasts[0].confidenceInterval.upper).toBeGreaterThanOrEqual(forecasts[0].predictedDemand);
      
      // Check that seasonal factors are applied
      const decemberForecast = forecasts.find(f => f.forecastDate.getMonth() === 11); // December
      if (decemberForecast) {
        expect(decemberForecast.seasonalityFactor).toBe(1.5); // Peak season
      }
    });

    test('should validate demand analysis calculations with historical data', async () => {
      // Test with known data pattern to validate calculations
      const mockHistoricalData = [
        { partNumber: { S: 'CALC123' }, invoiceDate: { S: '2024-01-01' }, invoiceType: { S: 'sales' }, quantity: { N: '10' }, unitPrice: { N: '25.00' }, totalAmount: { N: '250.00' }, invoiceId: { S: 'INV-1' }, currency: { S: 'USD' }, normalizedDescription: { S: 'Calc test part' }, originalDescription: { S: 'Calc test part' }, category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.95' }, normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' } },
        { partNumber: { S: 'CALC123' }, invoiceDate: { S: '2024-02-01' }, invoiceType: { S: 'sales' }, quantity: { N: '15' }, unitPrice: { N: '25.00' }, totalAmount: { N: '375.00' }, invoiceId: { S: 'INV-2' }, currency: { S: 'USD' }, normalizedDescription: { S: 'Calc test part' }, originalDescription: { S: 'Calc test part' }, category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.95' }, normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' } },
        { partNumber: { S: 'CALC123' }, invoiceDate: { S: '2024-03-01' }, invoiceType: { S: 'sales' }, quantity: { N: '20' }, unitPrice: { N: '25.00' }, totalAmount: { N: '500.00' }, invoiceId: { S: 'INV-3' }, currency: { S: 'USD' }, normalizedDescription: { S: 'Calc test part' }, originalDescription: { S: 'Calc test part' }, category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.95' }, normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' } }
      ];

      mockSend.mockResolvedValueOnce({ Items: mockHistoricalData });

      const pattern = await demandAnalysisEngine.analyzeDemandPatterns('CALC123', 12);

      expect(pattern.partNumber).toBe('CALC123');
      expect(pattern.trend.direction).toBe('increasing'); // Clear upward trend: 10 -> 15 -> 20
      expect(pattern.variability.meanDemand).toBe(15); // Average of 10, 15, 20
      expect(pattern.variability.coefficient).toBeGreaterThan(0); // Should have some variability
    });
  });

  describe('Advanced Supplier Evaluation Tests', () => {
    test('should test supplier evaluation algorithms with sample data', async () => {
      // Test with known supplier data to validate algorithms
      const mockPurchaseHistory = [
        {
          partNumber: { S: 'ALGO123' },
          invoiceDate: { S: '2024-01-15' },
          invoiceType: { S: 'purchase' },
          supplierId: { S: 'ALGO001' },
          quantity: { N: '100' },
          unitPrice: { N: '20.00' }, // Consistent pricing
          totalAmount: { N: '2000.00' },
          invoiceId: { S: 'PALGO001' },
          currency: { S: 'USD' },
          normalizedDescription: { S: 'Algorithm test part' },
          originalDescription: { S: 'Algorithm test part' },
          category: { S: 'Electronics' },
          unitOfMeasure: { S: 'EA' },
          qualityScore: { N: '0.95' }, // High quality
          normalizationTimestamp: { S: new Date().toISOString() },
          dataSource: { S: 'test' }
        },
        {
          partNumber: { S: 'ALGO123' },
          invoiceDate: { S: '2024-02-15' },
          invoiceType: { S: 'purchase' },
          supplierId: { S: 'ALGO001' },
          quantity: { N: '100' },
          unitPrice: { N: '20.00' }, // Consistent pricing
          totalAmount: { N: '2000.00' },
          invoiceId: { S: 'PALGO002' },
          currency: { S: 'USD' },
          normalizedDescription: { S: 'Algorithm test part' },
          originalDescription: { S: 'Algorithm test part' },
          category: { S: 'Electronics' },
          unitOfMeasure: { S: 'EA' },
          qualityScore: { N: '0.95' }, // High quality
          normalizationTimestamp: { S: new Date().toISOString() },
          dataSource: { S: 'test' }
        }
      ];

      mockSend.mockResolvedValueOnce({ Items: mockPurchaseHistory });

      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('ALGO001', 'ALGO123');

      expect(analysis.supplierId).toBe('ALGO001');
      expect(analysis.overallScore).toBeGreaterThan(70); // Should score well with consistent data
      expect(analysis.costPerformance.averageUnitCost).toBe(20.00);
      expect(analysis.costPerformance.priceStability).toBeGreaterThan(0.9); // High stability due to consistent pricing
      expect(analysis.qualityMetrics.qualityRating).toBe(95); // 0.95 * 100
      expect(analysis.recommendation).toMatch(/preferred|acceptable/); // Should be good recommendation
    });

    test('should calculate market analysis correctly', async () => {
      // Mock multiple suppliers with different performance levels
      const mockSuppliersQuery = {
        Items: [
          { supplierId: { S: 'MARKET001' } },
          { supplierId: { S: 'MARKET002' } },
          { supplierId: { S: 'MARKET003' } }
        ]
      };

      // Mock different performance levels for market analysis
      const mockHighPerformanceHistory = {
        Items: [{
          partNumber: { S: 'MARKET123' }, invoiceDate: { S: '2024-01-15' }, invoiceType: { S: 'purchase' }, supplierId: { S: 'MARKET001' },
          quantity: { N: '100' }, unitPrice: { N: '15.00' }, totalAmount: { N: '1500.00' }, invoiceId: { S: 'PMARKET001' },
          currency: { S: 'USD' }, normalizedDescription: { S: 'Market test part' }, originalDescription: { S: 'Market test part' },
          category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.98' }, 
          normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' }
        }]
      };

      const mockMediumPerformanceHistory = {
        Items: [{
          partNumber: { S: 'MARKET123' }, invoiceDate: { S: '2024-01-15' }, invoiceType: { S: 'purchase' }, supplierId: { S: 'MARKET002' },
          quantity: { N: '100' }, unitPrice: { N: '18.00' }, totalAmount: { N: '1800.00' }, invoiceId: { S: 'PMARKET002' },
          currency: { S: 'USD' }, normalizedDescription: { S: 'Market test part' }, originalDescription: { S: 'Market test part' },
          category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.85' },
          normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' }
        }]
      };

      const mockLowPerformanceHistory = {
        Items: [{
          partNumber: { S: 'MARKET123' }, invoiceDate: { S: '2024-01-15' }, invoiceType: { S: 'purchase' }, supplierId: { S: 'MARKET003' },
          quantity: { N: '100' }, unitPrice: { N: '22.00' }, totalAmount: { N: '2200.00' }, invoiceId: { S: 'PMARKET003' },
          currency: { S: 'USD' }, normalizedDescription: { S: 'Market test part' }, originalDescription: { S: 'Market test part' },
          category: { S: 'Electronics' }, unitOfMeasure: { S: 'EA' }, qualityScore: { N: '0.70' },
          normalizationTimestamp: { S: new Date().toISOString() }, dataSource: { S: 'test' }
        }]
      };

      mockSend
        .mockResolvedValueOnce(mockSuppliersQuery)
        .mockResolvedValueOnce(mockHighPerformanceHistory)
        .mockResolvedValueOnce(mockMediumPerformanceHistory)
        .mockResolvedValueOnce(mockLowPerformanceHistory);

      const ranking = await supplierEvaluationEngine.rankSuppliersForPart('MARKET123');

      expect(ranking.partNumber).toBe('MARKET123');
      expect(ranking.rankings).toHaveLength(3);
      
      // Verify ranking order (best supplier should be first)
      expect(ranking.rankings[0].ranking).toBe(1);
      expect(ranking.rankings[1].ranking).toBe(2);
      expect(ranking.rankings[2].ranking).toBe(3);
      
      // Verify market analysis calculations
      expect(ranking.marketAnalysis.priceRange.min).toBe(15.00);
      expect(ranking.marketAnalysis.priceRange.max).toBe(22.00);
      expect(ranking.marketAnalysis.priceRange.average).toBeCloseTo(18.33, 1);
      
      // Best supplier should be recommended
      expect(ranking.recommendedSupplier.supplierId).toBe('MARKET001');
    });
  });

  describe('Integration and Error Handling Tests', () => {
    test('should integrate all AI reasoning components in comprehensive workflow', async () => {
      const sessionId = 'comprehensive-test';
      const partNumber = 'COMPREHENSIVE123';

      // Mock comprehensive data flow
      const mockHistoricalData = {
        Items: [
          {
            partNumber: { S: partNumber },
            invoiceDate: { S: '2024-01-15' },
            invoiceType: { S: 'sales' },
            quantity: { N: '25' },
            unitPrice: { N: '30.00' },
            totalAmount: { N: '750.00' },
            invoiceId: { S: 'COMP001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Comprehensive test part' },
            originalDescription: { S: 'Comprehensive test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.93' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      const mockSuppliersData = {
        Items: [{ supplierId: { S: 'COMPSUP001' } }]
      };

      const mockSupplierHistory = {
        Items: [
          {
            partNumber: { S: partNumber },
            invoiceDate: { S: '2024-01-10' },
            invoiceType: { S: 'purchase' },
            supplierId: { S: 'COMPSUP001' },
            quantity: { N: '100' },
            unitPrice: { N: '22.00' },
            totalAmount: { N: '2200.00' },
            invoiceId: { S: 'PCOMP001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Comprehensive test part' },
            originalDescription: { S: 'Comprehensive test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.91' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      // Mock the sequence of DynamoDB calls
      mockSend
        .mockResolvedValueOnce(mockHistoricalData) // Historical demand
        .mockResolvedValueOnce(mockHistoricalData) // Demand patterns
        .mockResolvedValueOnce(mockSuppliersData) // Suppliers for part
        .mockResolvedValueOnce(mockSupplierHistory); // Supplier history

      // Test individual components work together
      const historicalData = await demandAnalysisEngine.getHistoricalDemand(partNumber, 12);
      expect(historicalData).toHaveLength(1);
      expect(historicalData[0].partNumber).toBe(partNumber);

      const pattern = await demandAnalysisEngine.analyzeDemandPatterns(partNumber, 12);
      expect(pattern.partNumber).toBe(partNumber);

      const ranking = await supplierEvaluationEngine.rankSuppliersForPart(partNumber);
      expect(ranking.partNumber).toBe(partNumber);
      expect(ranking.rankings).toHaveLength(1);
    });

    test('should handle errors gracefully across all components', async () => {
      const sessionId = 'error-test';
      const partNumber = 'ERROR123';

      // Test demand analysis error handling
      mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));
      const historicalData = await demandAnalysisEngine.getHistoricalDemand(partNumber, 12);
      expect(historicalData).toHaveLength(0);

      // Test supplier evaluation error handling
      mockSend.mockRejectedValueOnce(new Error('Supplier data unavailable'));
      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('ERROR_SUP');
      expect(analysis.overallScore).toBe(0);
      expect(analysis.recommendation).toBe('avoid');

      // Test AgentCore tool error handling
      mockSend.mockRejectedValueOnce(new Error('Tool execution failed'));
      const tool = agentCore['tools'].get('get_historical_demand');
      const memory = agentCore.getOrCreateMemory(sessionId);
      
      const result = await tool!.execute(
        { partNumber, timeRange: '12months' },
        memory
      );

      expect(result.demandHistory).toHaveLength(0);
      expect(result.totalDemand).toBe(0);
    });

    test('should validate AI reasoning prompt responses', async () => {
      const prompt = 'Analyze inventory levels for critical parts';
      const context = {
        criticalParts: ['ABC123', 'XYZ789'],
        currentStockLevels: { 'ABC123': 5, 'XYZ789': 12 },
        reorderPoints: { 'ABC123': 10, 'XYZ789': 15 }
      };

      const mockComplexResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'Analysis of critical parts inventory:\n\nABC123: Current stock (5) is below reorder point (10). Immediate action required.\nXYZ789: Current stock (12) is below reorder point (15). Monitor closely and prepare for reorder.\n\nRecommendations:\n1. Prioritize ABC123 for immediate replenishment\n2. Schedule XYZ789 reorder within next week\n3. Review supplier lead times for both parts'
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockComplexResponse);

      const reasoning = await agentCore.reason(prompt, context);

      expect(reasoning).toContain('ABC123');
      expect(reasoning).toContain('XYZ789');
      expect(reasoning).toContain('below reorder point');
      expect(reasoning).toContain('Recommendations');
      expect(reasoning.length).toBeGreaterThan(100); // Should be a comprehensive response
    });
  });
//});