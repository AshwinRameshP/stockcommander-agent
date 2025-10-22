import { DynamoDBClient, QueryCommand, PutItemCommand, UpdateItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { dynamoDBClient, awsConfig } from './aws-clients';
import { ReplenishmentRecommendation } from '../types';

// Approval workflow interfaces
export interface ApprovalWorkflow {
  workflowId: string;
  recommendationId: string;
  partNumber: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'expired';
  steps: ApprovalStep[];
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  metadata: WorkflowMetadata;
}

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  approverUserId?: string;
  approverName?: string;
  requiredApprovals: number;
  currentApprovals: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  approvalThreshold: ApprovalThreshold;
  approvals: ApprovalAction[];
  createdAt: Date;
  completedAt?: Date;
  timeoutHours: number;
}

export interface ApprovalThreshold {
  minAmount?: number;
  maxAmount?: number;
  urgencyLevels: string[];
  partCategories: string[];
  supplierTypes: string[];
  requiresJustification: boolean;
}

export interface ApprovalAction {
  actionId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'approve' | 'reject' | 'request_changes' | 'delegate';
  timestamp: Date;
  comments?: string;
  reasoning?: string;
  conditions?: string[];
  delegatedTo?: string;
  attachments?: string[];
}

export interface WorkflowMetadata {
  originalRecommendation: ReplenishmentRecommendation;
  businessJustification: string;
  riskAssessment: string;
  budgetImpact: number;
  alternativesConsidered: string[];
  stakeholderNotifications: string[];
}

export interface ApprovalRule {
  ruleId: string;
  name: string;
  description: string;
  conditions: ApprovalCondition[];
  requiredApprovers: ApprovalLevel[];
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalCondition {
  field: string; // 'amount', 'urgency', 'category', 'supplier'
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ApprovalLevel {
  level: number;
  role: string;
  requiredApprovals: number;
  timeoutHours: number;
  canDelegate: boolean;
  autoApproveConditions?: ApprovalCondition[];
}

export interface ManualOverride {
  overrideId: string;
  recommendationId: string;
  userId: string;
  userName: string;
  userRole: string;
  overrideType: 'quantity' | 'supplier' | 'timing' | 'complete_rejection';
  originalValue: any;
  newValue: any;
  reasoning: string;
  businessJustification: string;
  riskAcknowledgment: string;
  approvedBy?: string;
  approvedAt?: Date;
  timestamp: Date;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  entryId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Default approval rules configuration
const DEFAULT_APPROVAL_RULES: ApprovalRule[] = [
  {
    ruleId: 'high-value-orders',
    name: 'High Value Orders',
    description: 'Orders above $10,000 require manager approval',
    conditions: [
      { field: 'amount', operator: 'greater_than', value: 10000 }
    ],
    requiredApprovers: [
      {
        level: 1,
        role: 'inventory_manager',
        requiredApprovals: 1,
        timeoutHours: 24,
        canDelegate: true
      },
      {
        level: 2,
        role: 'procurement_manager',
        requiredApprovals: 1,
        timeoutHours: 48,
        canDelegate: false
      }
    ],
    isActive: true,
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ruleId: 'critical-parts',
    name: 'Critical Parts',
    description: 'Critical parts require expedited approval',
    conditions: [
      { field: 'urgency', operator: 'equals', value: 'critical' }
    ],
    requiredApprovers: [
      {
        level: 1,
        role: 'inventory_manager',
        requiredApprovals: 1,
        timeoutHours: 4,
        canDelegate: true,
        autoApproveConditions: [
          { field: 'amount', operator: 'less_than', value: 5000 }
        ]
      }
    ],
    isActive: true,
    priority: 2,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    ruleId: 'new-suppliers',
    name: 'New Suppliers',
    description: 'Orders from new suppliers require additional approval',
    conditions: [
      { field: 'supplier_status', operator: 'equals', value: 'new' }
    ],
    requiredApprovers: [
      {
        level: 1,
        role: 'procurement_specialist',
        requiredApprovals: 1,
        timeoutHours: 24,
        canDelegate: false
      },
      {
        level: 2,
        role: 'procurement_manager',
        requiredApprovals: 1,
        timeoutHours: 48,
        canDelegate: false
      }
    ],
    isActive: true,
    priority: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Main approval workflow engine
export class ApprovalWorkflowEngine {
  private dynamoClient: DynamoDBClient;
  private snsClient: SNSClient;

  constructor() {
    this.dynamoClient = dynamoDBClient;
    this.snsClient = new SNSClient({ region: awsConfig.region });
  }

  // Create approval workflow for a recommendation
  async createApprovalWorkflow(
    recommendation: ReplenishmentRecommendation,
    businessJustification: string = '',
    requestedBy: string = 'system'
  ): Promise<ApprovalWorkflow> {
    
    try {
      // Determine applicable approval rules
      const applicableRules = await this.getApplicableRules(recommendation);
      
      // Create workflow steps based on rules
      const steps = this.createWorkflowSteps(applicableRules, recommendation);
      
      // Generate workflow metadata
      const metadata = await this.generateWorkflowMetadata(
        recommendation,
        businessJustification
      );

      const workflow: ApprovalWorkflow = {
        workflowId: this.generateWorkflowId(),
        recommendationId: recommendation.recommendationId,
        partNumber: recommendation.partNumber,
        currentStep: 1,
        totalSteps: steps.length,
        status: steps.length > 0 ? 'pending' : 'approved', // Auto-approve if no steps required
        steps,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: this.calculateExpirationDate(steps),
        metadata
      };

      // Save workflow to database
      await this.saveWorkflow(workflow);
      
      // Send notifications for first step
      if (steps.length > 0) {
        await this.notifyApprovers(workflow, steps[0]);
      }
      
      // Create audit entry
      await this.createAuditEntry({
        entryId: this.generateAuditId(),
        timestamp: new Date(),
        userId: requestedBy,
        userName: requestedBy,
        action: 'workflow_created',
        details: {
          workflowId: workflow.workflowId,
          recommendationId: recommendation.recommendationId,
          totalSteps: steps.length
        }
      });

      return workflow;
      
    } catch (error) {
      console.error('Error creating approval workflow:', error);
      throw new Error(`Failed to create approval workflow: ${error.message}`);
    }
  }

  // Process approval action
  async processApprovalAction(
    workflowId: string,
    stepNumber: number,
    action: ApprovalAction
  ): Promise<{ workflow: ApprovalWorkflow; nextStep?: ApprovalStep }> {
    
    try {
      // Get current workflow
      const workflow = await this.getWorkflow(workflowId);
      if (!workflow) {
        throw new Error('Workflow not found');
      }

      // Validate action
      this.validateApprovalAction(workflow, stepNumber, action);
      
      // Get current step
      const currentStep = workflow.steps.find(step => step.stepNumber === stepNumber);
      if (!currentStep) {
        throw new Error('Step not found');
      }

      // Add approval action to step
      currentStep.approvals.push(action);
      currentStep.currentApprovals++;

      // Update step status based on action
      if (action.action === 'reject') {
        currentStep.status = 'rejected';
        workflow.status = 'rejected';
      } else if (action.action === 'approve') {
        // Check if step is complete
        if (currentStep.currentApprovals >= currentStep.requiredApprovals) {
          currentStep.status = 'approved';
          currentStep.completedAt = new Date();
          
          // Move to next step or complete workflow
          const nextStep = this.getNextStep(workflow);
          if (nextStep) {
            workflow.currentStep = nextStep.stepNumber;
            workflow.status = 'in_progress';
            await this.notifyApprovers(workflow, nextStep);
          } else {
            workflow.status = 'approved';
            await this.executeApprovedRecommendation(workflow);
          }
        }
      }

      workflow.updatedAt = new Date();
      
      // Save updated workflow
      await this.saveWorkflow(workflow);
      
      // Create audit entry
      await this.createAuditEntry({
        entryId: this.generateAuditId(),
        timestamp: new Date(),
        userId: action.userId,
        userName: action.userName,
        action: `step_${action.action}`,
        details: {
          workflowId,
          stepNumber,
          action: action.action,
          comments: action.comments
        }
      });

      const nextStep = this.getNextStep(workflow);
      return { workflow, nextStep };
      
    } catch (error) {
      console.error('Error processing approval action:', error);
      throw new Error(`Failed to process approval: ${error.message}`);
    }
  }

  // Create manual override
  async createManualOverride(
    recommendationId: string,
    overrideData: Omit<ManualOverride, 'overrideId' | 'timestamp' | 'auditTrail'>
  ): Promise<ManualOverride> {
    
    const override: ManualOverride = {
      ...overrideData,
      overrideId: this.generateOverrideId(),
      timestamp: new Date(),
      auditTrail: []
    };

    // Create initial audit entry
    const auditEntry: AuditEntry = {
      entryId: this.generateAuditId(),
      timestamp: new Date(),
      userId: override.userId,
      userName: override.userName,
      action: 'override_created',
      details: {
        overrideType: override.overrideType,
        originalValue: override.originalValue,
        newValue: override.newValue,
        reasoning: override.reasoning
      }
    };

    override.auditTrail.push(auditEntry);

    // Save override to database
    await this.saveManualOverride(override);
    
    // If override requires approval, create approval workflow
    if (this.requiresOverrideApproval(override)) {
      await this.createOverrideApprovalWorkflow(override);
    }

    return override;
  }

  // Get applicable approval rules for a recommendation
  private async getApplicableRules(recommendation: ReplenishmentRecommendation): Promise<ApprovalRule[]> {
    // In real implementation, this would fetch from database
    const allRules = DEFAULT_APPROVAL_RULES;
    
    return allRules.filter(rule => {
      if (!rule.isActive) return false;
      
      return rule.conditions.every(condition => {
        switch (condition.field) {
          case 'amount':
            return this.evaluateCondition(
              recommendation.estimatedCost,
              condition.operator,
              condition.value
            );
          case 'urgency':
            return this.evaluateCondition(
              recommendation.urgencyLevel,
              condition.operator,
              condition.value
            );
          case 'category':
            // Would need to get part category from recommendation context
            return true; // Simplified for now
          default:
            return true;
        }
      });
    }).sort((a, b) => a.priority - b.priority);
  }

  // Create workflow steps from applicable rules
  private createWorkflowSteps(
    rules: ApprovalRule[],
    recommendation: ReplenishmentRecommendation
  ): ApprovalStep[] {
    
    const steps: ApprovalStep[] = [];
    let stepNumber = 1;

    // Combine all approval levels from applicable rules
    const allLevels: Array<{ rule: ApprovalRule; level: ApprovalLevel }> = [];
    
    rules.forEach(rule => {
      rule.requiredApprovers.forEach(level => {
        allLevels.push({ rule, level });
      });
    });

    // Sort by level number and create steps
    allLevels.sort((a, b) => a.level.level - b.level.level);
    
    // Group by level and role to avoid duplicates
    const groupedLevels = new Map<string, { rule: ApprovalRule; level: ApprovalLevel }>();
    
    allLevels.forEach(item => {
      const key = `${item.level.level}-${item.level.role}`;
      if (!groupedLevels.has(key) || item.rule.priority < groupedLevels.get(key)!.rule.priority) {
        groupedLevels.set(key, item);
      }
    });

    // Create steps from grouped levels
    Array.from(groupedLevels.values()).forEach(({ rule, level }) => {
      const step: ApprovalStep = {
        stepNumber: stepNumber++,
        approverRole: level.role,
        requiredApprovals: level.requiredApprovals,
        currentApprovals: 0,
        status: 'pending',
        approvalThreshold: this.createApprovalThreshold(rule, level),
        approvals: [],
        createdAt: new Date(),
        timeoutHours: level.timeoutHours
      };

      // Check for auto-approval conditions
      if (level.autoApproveConditions && this.checkAutoApprovalConditions(level.autoApproveConditions, recommendation)) {
        step.status = 'approved';
        step.currentApprovals = step.requiredApprovals;
        step.completedAt = new Date();
        step.approvals.push({
          actionId: this.generateActionId(),
          userId: 'system',
          userName: 'System Auto-Approval',
          userRole: 'system',
          action: 'approve',
          timestamp: new Date(),
          comments: 'Auto-approved based on predefined conditions'
        });
      }

      steps.push(step);
    });

    return steps;
  }

  // Create approval threshold from rule and level
  private createApprovalThreshold(rule: ApprovalRule, level: ApprovalLevel): ApprovalThreshold {
    return {
      urgencyLevels: rule.conditions
        .filter(c => c.field === 'urgency')
        .map(c => c.value),
      partCategories: rule.conditions
        .filter(c => c.field === 'category')
        .map(c => c.value),
      supplierTypes: rule.conditions
        .filter(c => c.field === 'supplier')
        .map(c => c.value),
      requiresJustification: rule.conditions.some(c => c.field === 'amount' && c.value > 5000)
    };
  }

  // Check auto-approval conditions
  private checkAutoApprovalConditions(
    conditions: ApprovalCondition[],
    recommendation: ReplenishmentRecommendation
  ): boolean {
    
    return conditions.every(condition => {
      switch (condition.field) {
        case 'amount':
          return this.evaluateCondition(
            recommendation.estimatedCost,
            condition.operator,
            condition.value
          );
        case 'urgency':
          return this.evaluateCondition(
            recommendation.urgencyLevel,
            condition.operator,
            condition.value
          );
        default:
          return true;
      }
    });
  }

  // Evaluate condition
  private evaluateCondition(actualValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'greater_than':
        return actualValue > expectedValue;
      case 'less_than':
        return actualValue < expectedValue;
      case 'contains':
        return actualValue.toString().includes(expectedValue.toString());
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      default:
        return false;
    }
  }

  // Generate workflow metadata
  private async generateWorkflowMetadata(
    recommendation: ReplenishmentRecommendation,
    businessJustification: string
  ): Promise<WorkflowMetadata> {
    
    return {
      originalRecommendation: recommendation,
      businessJustification: businessJustification || 'Automated inventory replenishment recommendation',
      riskAssessment: this.generateRiskAssessment(recommendation),
      budgetImpact: recommendation.estimatedCost,
      alternativesConsidered: ['Alternative suppliers evaluated', 'Quantity optimization performed'],
      stakeholderNotifications: ['inventory_manager', 'procurement_team']
    };
  }

  // Generate risk assessment
  private generateRiskAssessment(recommendation: ReplenishmentRecommendation): string {
    const risks: string[] = [];
    
    if (recommendation.urgencyLevel === 'critical') {
      risks.push('High stockout risk if not approved quickly');
    }
    
    if (recommendation.estimatedCost > 10000) {
      risks.push('Significant budget impact');
    }
    
    if (recommendation.confidence < 0.7) {
      risks.push('Lower confidence in demand forecast');
    }

    return risks.length > 0 ? risks.join('; ') : 'Standard inventory replenishment risks';
  }

  // Calculate workflow expiration date
  private calculateExpirationDate(steps: ApprovalStep[]): Date {
    const totalTimeoutHours = steps.reduce((sum, step) => sum + step.timeoutHours, 0);
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + Math.max(totalTimeoutHours, 168)); // Minimum 1 week
    return expirationDate;
  }

  // Get next pending step
  private getNextStep(workflow: ApprovalWorkflow): ApprovalStep | undefined {
    return workflow.steps.find(step => step.status === 'pending');
  }

  // Validate approval action
  private validateApprovalAction(
    workflow: ApprovalWorkflow,
    stepNumber: number,
    action: ApprovalAction
  ): void {
    
    if (workflow.status !== 'pending' && workflow.status !== 'in_progress') {
      throw new Error('Workflow is not in a state that allows approval actions');
    }

    const step = workflow.steps.find(s => s.stepNumber === stepNumber);
    if (!step) {
      throw new Error('Invalid step number');
    }

    if (step.status !== 'pending') {
      throw new Error('Step is not pending approval');
    }

    if (workflow.currentStep !== stepNumber) {
      throw new Error('Step is not currently active');
    }

    // Check if user already approved this step
    const existingApproval = step.approvals.find(a => a.userId === action.userId);
    if (existingApproval) {
      throw new Error('User has already provided approval for this step');
    }
  }

  // Execute approved recommendation
  private async executeApprovedRecommendation(workflow: ApprovalWorkflow): Promise<void> {
    try {
      // Update recommendation status
      await this.updateRecommendationStatus(
        workflow.recommendationId,
        'approved',
        workflow.workflowId
      );

      // Send notification about approval
      await this.notifyStakeholders(workflow, 'approved');
      
      // Create audit entry
      await this.createAuditEntry({
        entryId: this.generateAuditId(),
        timestamp: new Date(),
        userId: 'system',
        userName: 'System',
        action: 'recommendation_approved',
        details: {
          workflowId: workflow.workflowId,
          recommendationId: workflow.recommendationId,
          totalCost: workflow.metadata.originalRecommendation.estimatedCost
        }
      });

    } catch (error) {
      console.error('Error executing approved recommendation:', error);
      throw error;
    }
  }

  // Check if override requires approval
  private requiresOverrideApproval(override: ManualOverride): boolean {
    // Significant changes require approval
    if (override.overrideType === 'complete_rejection') {
      return true;
    }
    
    // Large cost changes require approval
    if (typeof override.originalValue === 'number' && typeof override.newValue === 'number') {
      const changePercent = Math.abs((override.newValue - override.originalValue) / override.originalValue);
      if (changePercent > 0.2) { // 20% change threshold
        return true;
      }
    }

    return false;
  }

  // Create override approval workflow
  private async createOverrideApprovalWorkflow(override: ManualOverride): Promise<void> {
    // Create a simplified approval workflow for overrides
    const overrideWorkflow: ApprovalWorkflow = {
      workflowId: this.generateWorkflowId(),
      recommendationId: override.recommendationId,
      partNumber: '', // Would be fetched from recommendation
      currentStep: 1,
      totalSteps: 1,
      status: 'pending',
      steps: [{
        stepNumber: 1,
        approverRole: 'procurement_manager',
        requiredApprovals: 1,
        currentApprovals: 0,
        status: 'pending',
        approvalThreshold: {
          urgencyLevels: [],
          partCategories: [],
          supplierTypes: [],
          requiresJustification: true
        },
        approvals: [],
        createdAt: new Date(),
        timeoutHours: 48
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
      metadata: {
        originalRecommendation: {} as ReplenishmentRecommendation, // Would be fetched
        businessJustification: `Manual override: ${override.reasoning}`,
        riskAssessment: 'Manual override requires management approval',
        budgetImpact: 0,
        alternativesConsidered: [],
        stakeholderNotifications: ['procurement_manager']
      }
    };

    await this.saveWorkflow(overrideWorkflow);
  }

  // Notification methods
  private async notifyApprovers(workflow: ApprovalWorkflow, step: ApprovalStep): Promise<void> {
    const message = {
      workflowId: workflow.workflowId,
      stepNumber: step.stepNumber,
      approverRole: step.approverRole,
      partNumber: workflow.partNumber,
      urgency: workflow.metadata.originalRecommendation.urgencyLevel,
      amount: workflow.metadata.originalRecommendation.estimatedCost,
      timeoutHours: step.timeoutHours
    };

    try {
      await this.snsClient.send(new PublishCommand({
        TopicArn: `arn:aws:sns:${awsConfig.region}:${awsConfig.accountId}:approval-notifications`,
        Message: JSON.stringify(message),
        Subject: `Approval Required: ${workflow.partNumber}`
      }));
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async notifyStakeholders(workflow: ApprovalWorkflow, status: string): Promise<void> {
    const message = {
      workflowId: workflow.workflowId,
      recommendationId: workflow.recommendationId,
      partNumber: workflow.partNumber,
      status,
      totalCost: workflow.metadata.originalRecommendation.estimatedCost
    };

    try {
      await this.snsClient.send(new PublishCommand({
        TopicArn: `arn:aws:sns:${awsConfig.region}:${awsConfig.accountId}:workflow-updates`,
        Message: JSON.stringify(message),
        Subject: `Workflow ${status}: ${workflow.partNumber}`
      }));
    } catch (error) {
      console.error('Error sending stakeholder notification:', error);
    }
  }

  // Database operations
  private async saveWorkflow(workflow: ApprovalWorkflow): Promise<void> {
    const params = {
      TableName: awsConfig.approvalWorkflowsTable || 'ApprovalWorkflows',
      Item: {
        workflowId: { S: workflow.workflowId },
        recommendationId: { S: workflow.recommendationId },
        partNumber: { S: workflow.partNumber },
        currentStep: { N: workflow.currentStep.toString() },
        totalSteps: { N: workflow.totalSteps.toString() },
        status: { S: workflow.status },
        steps: { S: JSON.stringify(workflow.steps) },
        createdAt: { S: workflow.createdAt.toISOString() },
        updatedAt: { S: workflow.updatedAt.toISOString() },
        expiresAt: { S: workflow.expiresAt.toISOString() },
        metadata: { S: JSON.stringify(workflow.metadata) },
        ttl: { N: Math.floor(workflow.expiresAt.getTime() / 1000).toString() }
      }
    };

    await this.dynamoClient.send(new PutItemCommand(params));
  }

  private async getWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
    const params = {
      TableName: awsConfig.approvalWorkflowsTable || 'ApprovalWorkflows',
      Key: {
        workflowId: { S: workflowId }
      }
    };

    try {
      const result = await this.dynamoClient.send(new QueryCommand(params));
      
      if (result.Item) {
        return {
          workflowId: result.Item.workflowId?.S || '',
          recommendationId: result.Item.recommendationId?.S || '',
          partNumber: result.Item.partNumber?.S || '',
          currentStep: parseInt(result.Item.currentStep?.N || '1'),
          totalSteps: parseInt(result.Item.totalSteps?.N || '1'),
          status: result.Item.status?.S as any || 'pending',
          steps: JSON.parse(result.Item.steps?.S || '[]'),
          createdAt: new Date(result.Item.createdAt?.S || ''),
          updatedAt: new Date(result.Item.updatedAt?.S || ''),
          expiresAt: new Date(result.Item.expiresAt?.S || ''),
          metadata: JSON.parse(result.Item.metadata?.S || '{}')
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }
  }

  private async saveManualOverride(override: ManualOverride): Promise<void> {
    const params = {
      TableName: awsConfig.manualOverridesTable || 'ManualOverrides',
      Item: {
        overrideId: { S: override.overrideId },
        recommendationId: { S: override.recommendationId },
        userId: { S: override.userId },
        userName: { S: override.userName },
        userRole: { S: override.userRole },
        overrideType: { S: override.overrideType },
        originalValue: { S: JSON.stringify(override.originalValue) },
        newValue: { S: JSON.stringify(override.newValue) },
        reasoning: { S: override.reasoning },
        businessJustification: { S: override.businessJustification },
        riskAcknowledgment: { S: override.riskAcknowledgment },
        timestamp: { S: override.timestamp.toISOString() },
        auditTrail: { S: JSON.stringify(override.auditTrail) },
        ttl: { N: Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000).toString() } // 1 year TTL
      }
    };

    await this.dynamoClient.send(new PutItemCommand(params));
  }

  private async updateRecommendationStatus(
    recommendationId: string,
    status: string,
    workflowId: string
  ): Promise<void> {
    
    const params = {
      TableName: awsConfig.recommendationsTable || 'ReplenishmentRecommendations',
      Key: {
        recommendationId: { S: recommendationId }
      },
      UpdateExpression: 'SET #status = :status, approvedAt = :approvedAt, workflowId = :workflowId',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': { S: status },
        ':approvedAt': { S: new Date().toISOString() },
        ':workflowId': { S: workflowId }
      }
    };

    await this.dynamoClient.send(new UpdateItemCommand(params));
  }

  private async createAuditEntry(entry: AuditEntry): Promise<void> {
    const params = {
      TableName: awsConfig.auditTrailTable || 'AuditTrail',
      Item: {
        entryId: { S: entry.entryId },
        timestamp: { S: entry.timestamp.toISOString() },
        userId: { S: entry.userId },
        userName: { S: entry.userName },
        action: { S: entry.action },
        details: { S: JSON.stringify(entry.details) },
        ipAddress: { S: entry.ipAddress || 'unknown' },
        userAgent: { S: entry.userAgent || 'unknown' },
        ttl: { N: Math.floor((Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) / 1000).toString() } // 2 years TTL
      }
    };

    await this.dynamoClient.send(new PutItemCommand(params));
  }

  // ID generation methods
  private generateWorkflowId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `WF-${timestamp}-${random}`.toUpperCase();
  }

  private generateOverrideId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `OVR-${timestamp}-${random}`.toUpperCase();
  }

  private generateActionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `ACT-${timestamp}-${random}`.toUpperCase();
  }

  private generateAuditId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `AUD-${timestamp}-${random}`.toUpperCase();
  }

  // Public query methods
  async getPendingApprovals(userId: string, userRole: string): Promise<ApprovalWorkflow[]> {
    // In real implementation, this would query DynamoDB with proper indexes
    // For now, return empty array
    return [];
  }

  async getWorkflowHistory(recommendationId: string): Promise<ApprovalWorkflow[]> {
    // In real implementation, this would query DynamoDB
    return [];
  }

  async getAuditTrail(workflowId: string): Promise<AuditEntry[]> {
    // In real implementation, this would query DynamoDB
    return [];
  }
}

// Export singleton instance
export const approvalWorkflowEngine = new ApprovalWorkflowEngine();