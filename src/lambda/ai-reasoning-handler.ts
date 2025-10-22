import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockAgentCore, AgentPlan } from '../utils/bedrock-agent-core';
import { INVENTORY_ANALYSIS_PROMPTS, formatPrompt, validatePromptData } from '../utils/inventory-analysis-prompts';
import { validateAWSConfig } from '../utils/aws-clients';

// Initialize AgentCore
const agentCore = new BedrockAgentCore();

// Request interfaces
interface ReasoningRequest {
  type: 'demand_analysis' | 'supplier_evaluation' | 'replenishment_recommendation' | 'inventory_optimization';
  partNumber?: string;
  data: Record<string, any>;
  sessionId?: string;
}

interface PlanExecutionRequest {
  objective: string;
  context: Record<string, any>;
  sessionId: string;
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate AWS configuration
    validateAWSConfig();

    const httpMethod = event.httpMethod;
    const path = event.path;

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle preflight requests
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    // Parse request body
    const requestBody = event.body ? JSON.parse(event.body) : {};

    // Route requests based on path
    if (path.includes('/reasoning') && httpMethod === 'POST') {
      return await handleReasoningRequest(requestBody, headers);
    } else if (path.includes('/plan') && httpMethod === 'POST') {
      return await handlePlanExecution(requestBody, headers);
    } else if (path.includes('/memory') && httpMethod === 'GET') {
      return await handleMemoryRetrieval(event.queryStringParameters, headers);
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Endpoint not found' })
      };
    }

  } catch (error) {
    console.error('Error in AI reasoning handler:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

// Handle reasoning requests
async function handleReasoningRequest(
  request: ReasoningRequest, 
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {
  
  const { type, partNumber, data, sessionId = `session_${Date.now()}` } = request;

  // Validate request data
  const promptKey = type.toUpperCase() as keyof typeof INVENTORY_ANALYSIS_PROMPTS;
  if (!INVENTORY_ANALYSIS_PROMPTS[promptKey]) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Invalid reasoning type: ${type}` })
    };
  }

  if (!validatePromptData(promptKey, data)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required data fields for reasoning type' })
    };
  }

  try {
    // Get or create memory for session
    const memory = agentCore.getOrCreateMemory(sessionId);
    
    // Add current request to conversation history
    memory.conversationHistory.push({
      timestamp: new Date(),
      role: 'user',
      content: `Requesting ${type} analysis for part ${partNumber}`,
      metadata: { type, partNumber }
    });

    // Format prompt with data
    const prompt = formatPrompt(INVENTORY_ANALYSIS_PROMPTS[promptKey], data);
    
    // Perform reasoning
    const reasoning = await agentCore.reason(prompt, {
      partNumber,
      analysisType: type,
      sessionId,
      ...data
    });

    // Add response to conversation history
    memory.conversationHistory.push({
      timestamp: new Date(),
      role: 'assistant',
      content: reasoning,
      metadata: { type, partNumber, confidence: 0.8 }
    });

    // Update memory
    agentCore.updateMemory(sessionId, memory);

    // Parse reasoning result if it's JSON
    let parsedResult;
    try {
      parsedResult = JSON.parse(reasoning);
    } catch {
      parsedResult = { analysis: reasoning, raw: true };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        type,
        partNumber,
        result: parsedResult,
        timestamp: new Date().toISOString(),
        confidence: parsedResult.confidence || 0.8
      })
    };

  } catch (error) {
    console.error('Error in reasoning request:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Reasoning failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// Handle plan creation and execution
async function handlePlanExecution(
  request: PlanExecutionRequest,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {

  const { objective, context, sessionId } = request;

  if (!objective || !sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields: objective, sessionId' })
    };
  }

  try {
    // Create execution plan
    const plan = await agentCore.createPlan(objective, context);
    
    // Execute the plan
    const executedPlan = await agentCore.executePlan(plan, sessionId);

    // Get memory to include context
    const memory = agentCore.getOrCreateMemory(sessionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        plan: executedPlan,
        memory: {
          workingMemory: memory.workingMemory,
          conversationHistory: memory.conversationHistory.slice(-10) // Last 10 entries
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error in plan execution:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Plan execution failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// Handle memory retrieval
async function handleMemoryRetrieval(
  queryParams: { [name: string]: string | undefined } | null,
  headers: Record<string, string>
): Promise<APIGatewayProxyResult> {

  const sessionId = queryParams?.sessionId;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing sessionId parameter' })
    };
  }

  try {
    const memory = agentCore.getOrCreateMemory(sessionId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        sessionId,
        memory: {
          context: memory.context,
          conversationHistory: memory.conversationHistory,
          workingMemory: memory.workingMemory,
          lastUpdated: memory.lastUpdated
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Error retrieving memory:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Memory retrieval failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// Health check endpoint
export const healthCheck = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'healthy',
      service: 'ai-reasoning-engine',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  };
};