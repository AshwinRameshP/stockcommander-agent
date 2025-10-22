import { BedrockAgentCore } from '../src/utils/bedrock-agent-core';
import { demandAnalysisEngine, DemandPattern } from '../src/utils/demand-analysis';
import { supplierEvaluationEngine, SupplierPerformanceAnalysis } from '../src/utils/supplier-evaluation';
import { NormalizedInvoiceData, DemandForecast } from '../src/types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime');
jest.mock('@aws-sdk/client-dynamodb');

describe('AI Reasoning Engine Tests', () => {
  let agentCore: BedrockAgentCore;

  beforeEach(() => {
    agentCore = new BedrockAgentCore();
  });

  describe('BedrockAgentCore', () => {
    test('should create a new agent core instance', () => {
      expect(agentCore).toBeInstanceOf(BedrockAgentCore);
    });

    test('should create a plan for inventory analysis', async () => {
      const objective = 'Analyze demand patterns for part ABC-123';
      const context = { partNumber: 'ABC-123', timeRange: '12months' };

      // Mock the model response
      const mockPlan = {
        steps: [
          {
            stepId: 'step_1',
            description: 'Get historical demand data',
            toolName: 'get_historical_demand',
            parameters: { partNumber: 'ABC-123', timeRange: '12months' },
            dependencies: []
          }
        ]
      };

      // Mock the invokeModel method
      jest.spyOn(agentCore as any, 'invokeModel').mockResolvedValue(JSON.stringify(mockPlan));

      const plan = await agentCore.createPlan(objective, context);

      expect(plan.objective).toBe(objective);
      expect(plan.steps).toHaveLength(1);
      expect(plan.steps[0].toolName).toBe('get_historical_demand');
      expect(plan.status).toBe('pending');
    });

    test('should create and manage agent memory', () => {
      const sessionId = 'test-session-123';
      
      const memory = agentCore.getOrCreateMemory(sessionId);
      
      expect(memory.sessionId).toBe(sessionId);
      expect(memory.conversationHistory).toEqual([]);
      expect(memory.workingMemory).toEqual({});
      
      // Update memory
      agentCore.updateMemory(sessionId, {
        context: { partNumber: 'ABC-123' },
        workingMemory: { step1Result: 'completed' }
      });
      
      const updatedMemory = agentCore.getOrCreateMemory(sessionId);
      expect(updatedMemory.context.partNumber).toBe('ABC-123');
      expect(updatedMemory.workingMemory.step1Result).toBe('completed');
    });

    test('should perform reasoning with context', async () => {
      const prompt = 'Analyze the demand pattern for this part';
      const context = { partNumber: 'ABC-123', historicalData: [] };

      // Mock the model response
      jest.spyOn(agentCore as any, 'invokeModel').mockResolvedValue('Based on the analysis, the demand pattern shows...');

      const result = await agentCore.reason(prompt, context);

      expect(result).toContain('Based on the analysis');
    });
  });

  describe('Demand Analysis Engine', () => {
    test('should create demand analysis engine instance', () => {
      expect(demandAnalysisEngine).toBeDefined();
    });

    test('should handle empty historical data gracefully', async () => {
      // Mock empty DynamoDB response
      const mockSend = jest.fn().mockResolvedValue({ Items: [] });
      jest.spyOn(demandAnalysisEngine as any, 'dynamoClient', 'get').mockReturnValue({ send: mockSend });

      const pattern = await demandAnalysisEngine.analyzeDemandPatterns('NONEXISTENT-PART');

      expect(pattern.partNumber).toBe('NONEXISTENT-PART');
      expect(pattern.trend.direction).toBe('stable');
      expect(pattern.seasonality.detected).toBe(false);
      expect(pattern.forecastability.score).toBe(0);
    });

    test('should generate demand forecast based on patterns', async () => {
      const mockPattern = {
        partNumber: 'ABC-123',
        analysisDate: new Date(),
        trend: {
          direction: 'increasing' as const,
          strength: 0.7,
          changePoints: [],
          confidence: 0.8,
          monthlyGrowthRate: 5
        },
        seasonality: {
          detected: false,
          pattern: 'none' as const,
          indices: {},
          strength: 0,
          confidence: 0,
          peakPeriods: [],
          lowPeriods: []
        },
        variability: {
          coefficient: 0.3,
          classification: 'low' as const,
          volatilityPattern: 'consistent' as const,
          standardDeviation: 2,
          meanDemand: 10
        },
        anomalies: [],
        forecastability: {
          score: 0.8,
          challenges: [],
          recommendations: [],
          confidence: 0.8
        }
      };

      const forecasts = await demandAnalysisEngine.generateDemandForecast('ABC-123', mockPattern, 6);

      expect(forecasts).toHaveLength(6);
      expect(forecasts[0].partNumber).toBe('ABC-123');
      expect(forecasts[0].predictedDemand).toBeGreaterThan(0);
      expect(forecasts[0].confidenceInterval.lower).toBeLessThanOrEqual(forecasts[0].predictedDemand);
      expect(forecasts[0].confidenceInterval.upper).toBeGreaterThanOrEqual(forecasts[0].predictedDemand);
    });
  });

  describe('Supplier Evaluation Engine', () => {
    test('should create supplier evaluation engine instance', () => {
      expect(supplierEvaluationEngine).toBeDefined();
    });

    test('should handle empty supplier data gracefully', async () => {
      // Mock empty DynamoDB response
      const mockSend = jest.fn().mockResolvedValue({ Items: [] });
      jest.spyOn(supplierEvaluationEngine as any, 'dynamoClient', 'get').mockReturnValue({ send: mockSend });

      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance('NONEXISTENT-SUPPLIER');

      expect(analysis.supplierId).toBe('NONEXISTENT-SUPPLIER');
      expect(analysis.overallScore).toBe(0);
      expect(analysis.recommendation).toBe('avoid');
      expect(analysis.riskFactors).toHaveLength(1);
      expect(analysis.riskFactors[0].description).toContain('No historical data');
    });

    test('should rank suppliers for a part', async () => {
      // Mock DynamoDB responses
      const mockSend = jest.fn()
        .mockResolvedValueOnce({ Items: [] }) // getSuppliersForPart
        .mockResolvedValue({ Items: [] }); // other queries
      
      jest.spyOn(supplierEvaluationEngine as any, 'dynamoClient', 'get').mockReturnValue({ send: mockSend });

      const ranking = await supplierEvaluationEngine.rankSuppliersForPart('ABC-123');

      expect(ranking.partNumber).toBe('ABC-123');
      expect(ranking.rankings).toHaveLength(0);
      expect(ranking.marketAnalysis.competitivePosition).toBe('weak');
      expect(ranking.recommendedSupplier.supplierId).toBe('');
      expect(ranking.recommendedSupplier.confidence).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate demand analysis with agent core tools', async () => {
      const sessionId = 'integration-test-session';
      
      // Mock DynamoDB response for historical demand
      const mockSend = jest.fn().mockResolvedValue({
        Items: [
          {
            partNumber: { S: 'ABC-123' },
            invoiceDate: { S: '2023-01-01' },
            invoiceType: { S: 'sales' },
            quantity: { N: '10' },
            unitPrice: { N: '5.00' }
          }
        ]
      });
      
      jest.spyOn(demandAnalysisEngine as any, 'dynamoClient', 'get').mockReturnValue({ send: mockSend });

      // Test the get_historical_demand tool
      const tool = (agentCore as any).tools.get('get_historical_demand');
      expect(tool).toBeDefined();

      const memory = agentCore.getOrCreateMemory(sessionId);
      const result = await tool.execute({ partNumber: 'ABC-123', timeRange: '12months' }, memory);

      expect(result.partNumber).toBe('ABC-123');
      expect(result.totalDemand).toBe(10);
      expect(result.averageMonthlyDemand).toBeCloseTo(0.83, 1); // 10/12
    });

    test('should integrate supplier evaluation with agent core tools', async () => {
      const sessionId = 'supplier-test-session';
      
      // Mock DynamoDB responses
      const mockSend = jest.fn()
        .mockResolvedValueOnce({ Items: [{ supplierId: { S: 'SUPPLIER-001' } }] }) // getSuppliersForPart
        .mockResolvedValue({ Items: [] }); // other queries
      
      jest.spyOn(supplierEvaluationEngine as any, 'dynamoClient', 'get').mockReturnValue({ send: mockSend });

      // Test the get_supplier_metrics tool
      const tool = (agentCore as any).tools.get('get_supplier_metrics');
      expect(tool).toBeDefined();

      const memory = agentCore.getOrCreateMemory(sessionId);
      const result = await tool.execute({ partNumber: 'ABC-123' }, memory);

      expect(result.suppliers).toBeDefined();
      expect(result.totalSuppliers).toBe(1);
      expect(result.marketAnalysis).toBeDefined();
    });
  });
});