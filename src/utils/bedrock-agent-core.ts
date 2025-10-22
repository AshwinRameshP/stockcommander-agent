import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { bedrockRuntimeClient, bedrockConfig } from './aws-clients';
import { 
  SparePart, 
  DemandForecast, 
  ReplenishmentRecommendation, 
  SupplierMetrics,
  NormalizedInvoiceData 
} from '../types';

// AgentCore Planning Primitive
export interface AgentPlan {
  planId: string;
  objective: string;
  steps: PlanStep[];
  context: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
}

export interface PlanStep {
  stepId: string;
  description: string;
  toolName: string;
  parameters: Record<string, any>;
  dependencies: string[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
  reasoning?: string;
}

// AgentCore Memory Primitive
export interface AgentMemory {
  sessionId: string;
  context: Record<string, any>;
  conversationHistory: ConversationEntry[];
  workingMemory: Record<string, any>;
  longTermMemory: Record<string, any>;
  lastUpdated: Date;
}

export interface ConversationEntry {
  timestamp: Date;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

// Tool definitions for AgentCore
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any, context: AgentMemory) => Promise<any>;
}

// Main AgentCore class
export class BedrockAgentCore {
  private client: BedrockRuntimeClient;
  private tools: Map<string, AgentTool>;
  private memory: Map<string, AgentMemory>;

  constructor() {
    this.client = bedrockRuntimeClient;
    this.tools = new Map();
    this.memory = new Map();
    this.initializeTools();
  }

  // Initialize available tools for the agent
  private initializeTools(): void {
    // Data access tools
    this.registerTool({
      name: 'get_historical_demand',
      description: 'Retrieve historical demand data for a specific part',
      parameters: {
        partNumber: { type: 'string', required: true },
        timeRange: { type: 'string', required: false, default: '12months' }
      },
      execute: this.getHistoricalDemand.bind(this)
    });

    this.registerTool({
      name: 'get_supplier_metrics',
      description: 'Get performance metrics for suppliers',
      parameters: {
        supplierId: { type: 'string', required: false },
        partNumber: { type: 'string', required: false }
      },
      execute: this.getSupplierMetrics.bind(this)
    });

    this.registerTool({
      name: 'calculate_demand_patterns',
      description: 'Analyze demand patterns and seasonality',
      parameters: {
        partNumber: { type: 'string', required: true },
        analysisType: { type: 'string', required: false, default: 'full' }
      },
      execute: this.calculateDemandPatterns.bind(this)
    });

    this.registerTool({
      name: 'evaluate_supplier_performance',
      description: 'Evaluate and rank supplier performance',
      parameters: {
        partNumber: { type: 'string', required: true },
        criteria: { type: 'array', required: false }
      },
      execute: this.evaluateSupplierPerformance.bind(this)
    });

    this.registerTool({
      name: 'generate_recommendation',
      description: 'Generate replenishment recommendation based on analysis',
      parameters: {
        partNumber: { type: 'string', required: true },
        demandForecast: { type: 'object', required: true },
        supplierMetrics: { type: 'object', required: true }
      },
      execute: this.generateRecommendation.bind(this)
    });
  }

  // Register a new tool
  public registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  // Planning primitive - create execution plan
  public async createPlan(objective: string, context: Record<string, any>): Promise<AgentPlan> {
    const planningPrompt = this.buildPlanningPrompt(objective, context);
    
    const response = await this.invokeModel(planningPrompt);
    const planData = this.parsePlanResponse(response);

    const plan: AgentPlan = {
      planId: `plan_${Date.now()}`,
      objective,
      steps: planData.steps,
      context,
      status: 'pending',
      createdAt: new Date()
    };

    return plan;
  }

  // Execute a plan step by step
  public async executePlan(plan: AgentPlan, sessionId: string): Promise<AgentPlan> {
    plan.status = 'executing';
    const memory = this.getOrCreateMemory(sessionId);

    for (const step of plan.steps) {
      if (step.status === 'completed') continue;

      // Check dependencies
      const dependenciesMet = step.dependencies.every(depId => 
        plan.steps.find(s => s.stepId === depId)?.status === 'completed'
      );

      if (!dependenciesMet) {
        continue;
      }

      step.status = 'executing';
      
      try {
        const tool = this.tools.get(step.toolName);
        if (!tool) {
          throw new Error(`Tool ${step.toolName} not found`);
        }

        step.result = await tool.execute(step.parameters, memory);
        step.status = 'completed';

        // Update working memory with step result
        memory.workingMemory[step.stepId] = step.result;
        
      } catch (error) {
        step.status = 'failed';
        step.result = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Check if all steps completed
    const allCompleted = plan.steps.every(step => step.status === 'completed');
    const anyFailed = plan.steps.some(step => step.status === 'failed');

    plan.status = anyFailed ? 'failed' : (allCompleted ? 'completed' : 'executing');

    return plan;
  }

  // Memory primitive - manage agent memory
  public getOrCreateMemory(sessionId: string): AgentMemory {
    if (!this.memory.has(sessionId)) {
      this.memory.set(sessionId, {
        sessionId,
        context: {},
        conversationHistory: [],
        workingMemory: {},
        longTermMemory: {},
        lastUpdated: new Date()
      });
    }
    return this.memory.get(sessionId)!;
  }

  public updateMemory(sessionId: string, updates: Partial<AgentMemory>): void {
    const memory = this.getOrCreateMemory(sessionId);
    Object.assign(memory, updates, { lastUpdated: new Date() });
  }

  // Reasoning primitive - invoke Bedrock model for reasoning
  public async reason(prompt: string, context: Record<string, any> = {}): Promise<string> {
    const enhancedPrompt = this.buildReasoningPrompt(prompt, context);
    return await this.invokeModel(enhancedPrompt);
  }

  // Core model invocation
  private async invokeModel(prompt: string): Promise<string> {
    const command = new InvokeModelCommand({
      modelId: bedrockConfig.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: bedrockConfig.maxTokens,
        temperature: bedrockConfig.temperature,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    const response = await this.client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }

  // Tool implementations
  private async getHistoricalDemand(params: any, context: AgentMemory): Promise<any> {
    const { demandAnalysisEngine } = await import('./demand-analysis');
    
    const timeRangeMonths = params.timeRange === '6months' ? 6 : 
                           params.timeRange === '18months' ? 18 : 12;
    
    const historicalData = await demandAnalysisEngine.getHistoricalDemand(
      params.partNumber, 
      timeRangeMonths
    );
    
    const totalDemand = historicalData
      .filter(item => item.invoiceType === 'sales')
      .reduce((sum, item) => sum + item.quantity, 0);
    
    const averageMonthlyDemand = totalDemand / timeRangeMonths;
    
    return {
      partNumber: params.partNumber,
      timeRange: params.timeRange,
      demandHistory: historicalData,
      totalDemand,
      averageMonthlyDemand,
      dataPoints: historicalData.length
    };
  }

  private async getSupplierMetrics(params: any, context: AgentMemory): Promise<any> {
    const { supplierEvaluationEngine } = await import('./supplier-evaluation');
    
    if (params.supplierId) {
      // Get metrics for specific supplier
      const analysis = await supplierEvaluationEngine.evaluateSupplierPerformance(
        params.supplierId, 
        params.partNumber
      );
      
      return {
        supplier: analysis,
        totalSuppliers: 1,
        averageLeadTime: analysis.deliveryPerformance.averageLeadTime
      };
    } else if (params.partNumber) {
      // Get all suppliers for a part
      const ranking = await supplierEvaluationEngine.rankSuppliersForPart(params.partNumber);
      
      return {
        suppliers: ranking.rankings,
        totalSuppliers: ranking.rankings.length,
        averageLeadTime: ranking.marketAnalysis.leadTimeRange.average,
        marketAnalysis: ranking.marketAnalysis,
        recommendedSupplier: ranking.recommendedSupplier
      };
    } else {
      return {
        suppliers: [],
        totalSuppliers: 0,
        averageLeadTime: 0,
        error: 'Either supplierId or partNumber must be provided'
      };
    }
  }

  private async calculateDemandPatterns(params: any, context: AgentMemory): Promise<any> {
    const { demandAnalysisEngine } = await import('./demand-analysis');
    
    const analysisMonths = params.analysisType === 'short' ? 12 : 24;
    const pattern = await demandAnalysisEngine.analyzeDemandPatterns(
      params.partNumber, 
      analysisMonths
    );
    
    return {
      partNumber: params.partNumber,
      analysisDate: pattern.analysisDate,
      seasonality: pattern.seasonality,
      trend: pattern.trend,
      variability: pattern.variability,
      anomalies: pattern.anomalies,
      forecastability: pattern.forecastability
    };
  }

  private async evaluateSupplierPerformance(params: any, context: AgentMemory): Promise<any> {
    const { supplierEvaluationEngine } = await import('./supplier-evaluation');
    
    const ranking = await supplierEvaluationEngine.rankSuppliersForPart(params.partNumber);
    
    return {
      partNumber: params.partNumber,
      supplierRankings: ranking.rankings,
      recommendedSupplier: ranking.recommendedSupplier,
      marketAnalysis: ranking.marketAnalysis,
      evaluationCriteria: params.criteria || ['delivery', 'cost', 'quality', 'relationship', 'capacity']
    };
  }

  private async generateRecommendation(params: any, context: AgentMemory): Promise<ReplenishmentRecommendation> {
    // This would implement the recommendation generation logic
    const recommendationId = `rec_${Date.now()}`;
    
    return {
      partNumber: params.partNumber,
      recommendationId,
      recommendedQuantity: 0, // Would be calculated
      suggestedOrderDate: new Date(),
      preferredSupplier: '',
      estimatedCost: 0,
      urgencyLevel: 'medium',
      reasoning: 'Generated by AI reasoning engine',
      confidence: 0.8,
      status: 'pending',
      createdAt: new Date()
    };
  }

  // Prompt building helpers
  private buildPlanningPrompt(objective: string, context: Record<string, any>): string {
    return `
You are an AI agent specialized in inventory replenishment planning. Your objective is: ${objective}

Context: ${JSON.stringify(context, null, 2)}

Available tools:
${Array.from(this.tools.keys()).map(name => `- ${name}: ${this.tools.get(name)?.description}`).join('\n')}

Create a step-by-step execution plan to achieve the objective. Return your response as JSON with the following structure:
{
  "steps": [
    {
      "stepId": "step_1",
      "description": "Description of what this step does",
      "toolName": "tool_to_use",
      "parameters": {"param1": "value1"},
      "dependencies": []
    }
  ]
}

Focus on data gathering first, then analysis, then recommendation generation.
`;
  }

  private buildReasoningPrompt(prompt: string, context: Record<string, any>): string {
    return `
You are an AI reasoning engine for inventory replenishment decisions. You have access to the following context:

${JSON.stringify(context, null, 2)}

User request: ${prompt}

Provide detailed reasoning for inventory replenishment decisions, considering:
1. Historical demand patterns
2. Supplier performance metrics
3. Lead times and variability
4. Cost optimization
5. Risk mitigation

Be specific and provide actionable insights.
`;
  }

  private parsePlanResponse(response: string): { steps: PlanStep[] } {
    try {
      const parsed = JSON.parse(response);
      return {
        steps: parsed.steps.map((step: any) => ({
          ...step,
          status: 'pending' as const
        }))
      };
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        steps: [{
          stepId: 'step_1',
          description: 'Analyze the request and generate recommendations',
          toolName: 'generate_recommendation',
          parameters: {},
          dependencies: [],
          status: 'pending' as const
        }]
      };
    }
  }
}

// Singleton instance
export const agentCore = new BedrockAgentCore();