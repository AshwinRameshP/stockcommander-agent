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

import { BedrockAgentCore, AgentPlan } from '../src/utils/bedrock-agent-core';
import { demandAnalysisEngine, DemandPattern } from '../src/utils/demand-analysis';
import { supplierEvaluationEngine, SupplierPerformanceAnalysis } from '../src/utils/supplier-evaluation';

describe('AI Reasoning Components - Comprehensive Tests', () => {
  let agentCore: BedrockAgentCore;

  beforeEach(() => {
    agentCore = new BedrockAgentCore();
    jest.clearAllMocks();
    mockSend.mockReset();
  });

  describe('BedrockAgentCore Integration Tests', () => {
    describe('Agent Planning Primitive', () => {
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
                  },
                  {
                    stepId: 'step_3',
                    description: 'Get supplier metrics',
                    toolName: 'get_supplier_metrics',
                    parameters: { partNumber: 'ABC123' },
                    dependencies: []
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
        expect(plan.steps).toHaveLength(3);
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
    });

    describe('Agent Memory Primitive', () => {
      test('should create and manage agent memory', () => {
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
    });

    describe('Tool Execution', () => {
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

      test('should execute calculate_demand_patterns tool', async () => {
        const sessionId = 'test-session';
        const memory = agentCore.getOrCreateMemory(sessionId);

        // Mock demand analysis engine
        const mockPattern: DemandPattern = {
          partNumber: 'ABC123',
          analysisDate: new Date(),
          trend: {
            direction: 'increasing',
            strength: 0.7,
            changePoints: [],
            confidence: 0.8,
            monthlyGrowthRate: 5.2
          },
          seasonality: {
            detected: true,
            pattern: 'monthly',
            indices: { '01': 1.2, '02': 0.8 },
            strength: 0.6,
            confidence: 0.75,
            peakPeriods: ['01'],
            lowPeriods: ['02']
          },
          variability: {
            coefficient: 0.3,
            classification: 'medium',
            volatilityPattern: 'consistent',
            standardDeviation: 5.2,
            meanDemand: 15.5
          },
          anomalies: [],
          forecastability: {
            score: 0.8,
            challenges: [],
            recommendations: ['Use trend-based forecasting'],
            confidence: 0.85
          }
        };

        jest.spyOn(demandAnalysisEngine, 'analyzeDemandPatterns').mockResolvedValueOnce(mockPattern);

        const tool = agentCore['tools'].get('calculate_demand_patterns');
        const result = await tool!.execute(
          { partNumber: 'ABC123', analysisType: 'full' },
          memory
        );

        expect(result.partNumber).toBe('ABC123');
        expect(result.trend.direction).toBe('increasing');
        expect(result.seasonality.detected).toBe(true);
        expect(result.forecastability.score).toBe(0.8);
      });
    });

    describe('Plan Execution', () => {
      test('should execute plan with dependencies', async () => {
        const sessionId = 'test-execution';
        
        const plan: AgentPlan = {
          planId: 'test-plan',
          objective: 'Test execution',
          steps: [
            {
              stepId: 'step_1',
              description: 'First step',
              toolName: 'get_historical_demand',
              parameters: { partNumber: 'TEST123' },
              dependencies: [],
              status: 'pending'
            },
            {
              stepId: 'step_2',
              description: 'Second step',
              toolName: 'calculate_demand_patterns',
              parameters: { partNumber: 'TEST123' },
              dependencies: ['step_1'],
              status: 'pending'
            }
          ],
          context: {},
          status: 'pending',
          createdAt: new Date()
        };

        // Mock tool responses
        mockSend.mockResolvedValueOnce({ Items: [] }); // Empty historical data
        
        const mockPattern: DemandPattern = {
          partNumber: 'TEST123',
          analysisDate: new Date(),
          trend: { direction: 'stable', strength: 0, changePoints: [], confidence: 0, monthlyGrowthRate: 0 },
          seasonality: { detected: false, pattern: 'none', indices: {}, strength: 0, confidence: 0, peakPeriods: [], lowPeriods: [] },
          variability: { coefficient: 0, classification: 'low', volatilityPattern: 'consistent', standardDeviation: 0, meanDemand: 0 },
          anomalies: [],
          forecastability: { score: 0, challenges: ['No historical data'], recommendations: [], confidence: 0 }
        };
        
        jest.spyOn(demandAnalysisEngine, 'analyzeDemandPatterns').mockResolvedValueOnce(mockPattern);

        const executedPlan = await agentCore.executePlan(plan, sessionId);

        expect(executedPlan.status).toBe('completed');
        expect(executedPlan.steps[0].status).toBe('completed');
        expect(executedPlan.steps[1].status).toBe('completed');
      });
    });

    describe('Reasoning Primitive', () => {
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
              text: 'Based on the current stock level of 5 units and reorder point of 10 units, yes, part ABC123 should be reordered immediately. With an average demand of 2 units and lead time of 14 days, the current stock will not cover demand during the lead time period.'
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
  });

  describe('Demand Analysis Engine Tests', () => {
    describe('Historical Data Processing', () => {
      test('should retrieve and process historical demand data', async () => {
        const mockHistoricalData = [
          {
            partNumber: 'TEST123',
            invoiceDate: '2024-01-15',
            invoiceType: 'sales' as const,
            quantity: 10,
            unitPrice: 25.50
          },
          {
            partNumber: 'TEST123',
            invoiceDate: '2024-02-15',
            invoiceType: 'sales' as const,
            quantity: 15,
            unitPrice: 26.00
          }
        ];

        const mockDynamoResponse = {
          Items: mockHistoricalData.map(item => ({
            partNumber: { S: item.partNumber },
            invoiceDate: { S: item.invoiceDate },
            invoiceType: { S: item.invoiceType },
            quantity: { N: item.quantity.toString() },
            unitPrice: { N: item.unitPrice.toString() },
            totalAmount: { N: (item.quantity * item.unitPrice).toString() },
            invoiceId: { S: `INV-${Math.random()}` },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Test part' },
            originalDescription: { S: 'Test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.95' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }))
        };

        mockSend.mockResolvedValueOnce(mockDynamoResponse);

        const historicalData = await demandAnalysisEngine.getHistoricalDemand('TEST123', 12);

        expect(historicalData).toHaveLength(2);
        expect(historicalData[0].partNumber).toBe('TEST123');
        expect(historicalData[0].quantity).toBe(10);
        expect(historicalData[1].quantity).toBe(15);
      });

      test('should handle empty historical data gracefully', async () => {
        mockSend.mockResolvedValueOnce({ Items: [] });

        const historicalData = await demandAnalysisEngine.getHistoricalDemand('NONEXISTENT', 12);

        expect(historicalData).toHaveLength(0);
      });
    });

    describe('Demand Pattern Analysis', () => {
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

      test('should handle insufficient data for pattern analysis', async () => {
        mockSend.mockResolvedValueOnce({ Items: [] });

        const pattern = await demandAnalysisEngine.analyzeDemandPatterns('NODATA123', 24);

        expect(pattern.partNumber).toBe('NODATA123');
        expect(pattern.trend.direction).toBe('stable');
        expect(pattern.seasonality.detected).toBe(false);
        expect(pattern.forecastability.score).toBe(0);
        expect(pattern.forecastability.challenges).toContain('No historical data available');
      });
    });

    describe('Demand Forecasting', () => {
      test('should generate demand forecasts based on patterns', async () => {
        const mockPattern: DemandPattern = {
          partNumber: 'FORECAST123',
          analysisDate: new Date(),
          trend: {
            direction: 'increasing',
            strength: 0.6,
            changePoints: [],
            confidence: 0.8,
            monthlyGrowthRate: 3.5
          },
          seasonality: {
            detected: true,
            pattern: 'monthly',
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
            classification: 'medium',
            volatilityPattern: 'consistent',
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
    });
  });

  describe('Supplier Evaluation Engine Tests', () => {
    describe('Supplier Performance Analysis', () => {
      test('should evaluate supplier performance with historical data', async () => {
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

      test('should handle supplier with no historical data', async () => {
        mockSend.mockResolvedValueOnce({ Items: [] });

        const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('NEWSUP001');

        expect(analysis.supplierId).toBe('NEWSUP001');
        expect(analysis.overallScore).toBe(0);
        expect(analysis.recommendation).toBe('avoid');
        expect(analysis.riskFactors).toHaveLength(1);
        expect(analysis.riskFactors[0].description).toContain('No historical data');
      });
    });

    describe('Supplier Ranking', () => {
      test('should rank suppliers for a specific part', async () => {
        // Mock suppliers for part
        const mockSuppliersQuery = {
          Items: [
            { supplierId: { S: 'SUP001' } },
            { supplierId: { S: 'SUP002' } },
            { supplierId: { S: 'SUP003' } }
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
          .mockResolvedValueOnce(mockPurchaseHistory) // SUP002 history  
          .mockResolvedValueOnce(mockPurchaseHistory); // SUP003 history

        const ranking = await supplierEvaluationEngine.rankSuppliersForPart('RANK123');

        expect(ranking.partNumber).toBe('RANK123');
        expect(ranking.rankings).toHaveLength(3);
        expect(ranking.rankings[0].ranking).toBe(1);
        expect(ranking.rankings[1].ranking).toBe(2);
        expect(ranking.rankings[2].ranking).toBe(3);
        expect(ranking.recommendedSupplier.supplierId).toBeTruthy();
        expect(ranking.marketAnalysis).toBeDefined();
        expect(ranking.marketAnalysis.competitivePosition).toMatch(/strong|moderate|weak/);
      });

      test('should handle part with no suppliers', async () => {
        mockSend.mockResolvedValueOnce({ Items: [] });

        const ranking = await supplierEvaluationEngine.rankSuppliersForPart('NOSUPPLIERS123');

        expect(ranking.partNumber).toBe('NOSUPPLIERS123');
        expect(ranking.rankings).toHaveLength(0);
        expect(ranking.recommendedSupplier.supplierId).toBe('');
        expect(ranking.recommendedSupplier.reasoning).toContain('No suppliers found');
        expect(ranking.marketAnalysis.competitivePosition).toBe('weak');
      });
    });

    describe('Market Analysis', () => {
      test('should calculate market analysis from supplier evaluations', async () => {
        const mockSupplierEvaluations: SupplierPerformanceAnalysis[] = [
          {
            supplierId: 'SUP001',
            supplierName: 'Supplier 001',
            analysisDate: new Date(),
            deliveryPerformance: {
              onTimeDeliveryRate: 95,
              averageLeadTime: 10,
              leadTimeVariability: 2,
              leadTimeConsistency: 0.8,
              deliveryReliabilityScore: 90,
              recentTrend: 'stable'
            },
            costPerformance: {
              averageUnitCost: 25.00,
              priceCompetitiveness: 105,
              priceStability: 0.9,
              costTrend: 'stable',
              totalCostOfOwnership: 28.75,
              paymentTerms: 'Net 30',
              discountOpportunities: []
            },
            qualityMetrics: {
              qualityRating: 92,
              defectRate: 1.5,
              returnRate: 0.5,
              qualityTrend: 'improving',
              certifications: ['ISO 9001'],
              qualityIncidents: 1
            },
            relationshipFactors: {
              communicationScore: 85,
              responsiveness: 4,
              flexibility: 80,
              strategicAlignment: 75,
              contractCompliance: 90,
              innovationSupport: 70
            },
            capacityAssessment: {
              productionCapacity: 5000,
              currentUtilization: 75,
              scalabilityScore: 80,
              geographicCoverage: ['North America'],
              financialStability: 85,
              technologyCapabilities: ['Advanced Manufacturing']
            },
            overallScore: 85,
            ranking: 1,
            recommendation: 'preferred',
            riskFactors: []
          }
        ];

        // Use private method through bracket notation for testing
        const marketAnalysis = (supplierEvaluationEngine as any).calculateMarketAnalysis(mockSupplierEvaluations);

        expect(marketAnalysis.competitivePosition).toBe('strong');
        expect(marketAnalysis.priceRange.average).toBe(25.00);
        expect(marketAnalysis.leadTimeRange.average).toBe(10);
        expect(marketAnalysis.supplierConcentration).toBe(1); // Single supplier = full concentration
      });
    });
  });

  describe('Integration Tests', () => {
    test('should integrate AgentCore with demand analysis and supplier evaluation', async () => {
      const sessionId = 'integration-test';
      const partNumber = 'INTEGRATION123';

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
            invoiceId: { S: 'INT001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Integration test part' },
            originalDescription: { S: 'Integration test part' },
            category: { S: 'Electronics' },
            unitOfMeasure: { S: 'EA' },
            qualityScore: { N: '0.93' },
            normalizationTimestamp: { S: new Date().toISOString() },
            dataSource: { S: 'test' }
          }
        ]
      };

      const mockSuppliersData = {
        Items: [{ supplierId: { S: 'INTSUP001' } }]
      };

      const mockSupplierHistory = {
        Items: [
          {
            partNumber: { S: partNumber },
            invoiceDate: { S: '2024-01-10' },
            invoiceType: { S: 'purchase' },
            supplierId: { S: 'INTSUP001' },
            quantity: { N: '100' },
            unitPrice: { N: '22.00' },
            totalAmount: { N: '2200.00' },
            invoiceId: { S: 'PINV001' },
            currency: { S: 'USD' },
            normalizedDescription: { S: 'Integration test part' },
            originalDescription: { S: 'Integration test part' },
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

      // Create and execute a comprehensive plan
      const objective = `Analyze inventory replenishment needs for part ${partNumber}`;
      const context = { partNumber, urgency: 'high' };

      // Mock Bedrock planning response
      const mockPlanResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              steps: [
                {
                  stepId: 'step_1',
                  description: 'Get historical demand',
                  toolName: 'get_historical_demand',
                  parameters: { partNumber, timeRange: '12months' },
                  dependencies: []
                },
                {
                  stepId: 'step_2',
                  description: 'Analyze demand patterns',
                  toolName: 'calculate_demand_patterns',
                  parameters: { partNumber },
                  dependencies: ['step_1']
                },
                {
                  stepId: 'step_3',
                  description: 'Evaluate suppliers',
                  toolName: 'evaluate_supplier_performance',
                  parameters: { partNumber },
                  dependencies: []
                }
              ]
            })
          }]
        }))
      };

      mockSend.mockResolvedValueOnce(mockPlanResponse);

      const plan = await agentCore.createPlan(objective, context);
      const executedPlan = await agentCore.executePlan(plan, sessionId);

      expect(executedPlan.status).toBe('completed');
      expect(executedPlan.steps).toHaveLength(3);
      
      // Verify step results
      const demandStep = executedPlan.steps.find(s => s.toolName === 'get_historical_demand');
      expect(demandStep?.result.partNumber).toBe(partNumber);
      expect(demandStep?.result.totalDemand).toBe(25);

      const patternStep = executedPlan.steps.find(s => s.toolName === 'calculate_demand_patterns');
      expect(patternStep?.result.partNumber).toBe(partNumber);

      const supplierStep = executedPlan.steps.find(s => s.toolName === 'evaluate_supplier_performance');
      expect(supplierStep?.result.partNumber).toBe(partNumber);
      expect(supplierStep?.result.supplierRankings).toBeDefined();
    });

    test('should handle errors gracefully in integrated workflow', async () => {
      const sessionId = 'error-test';
      const partNumber = 'ERROR123';

      // Mock DynamoDB error
      mockSend.mockRejectedValueOnce(new Error('DynamoDB connection failed'));

      const tool = agentCore['tools'].get('get_historical_demand');
      const memory = agentCore.getOrCreateMemory(sessionId);

      const result = await tool!.execute(
        { partNumber, timeRange: '12months' },
        memory
      );

      // Should return empty array on error
      expect(result.demandHistory).toHaveLength(0);
      expect(result.totalDemand).toBe(0);
    });
  });
});