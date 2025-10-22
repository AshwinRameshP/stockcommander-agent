// Specialized prompts for inventory analysis reasoning

export const INVENTORY_ANALYSIS_PROMPTS = {
  // Demand pattern analysis prompt
  DEMAND_ANALYSIS: `
You are an expert inventory analyst specializing in demand pattern recognition. Analyze the provided historical sales data and identify key patterns.

Historical Data: {historicalData}
Part Information: {partInfo}
Analysis Period: {analysisPeriod}

Perform the following analysis:

1. TREND ANALYSIS:
   - Identify overall demand trend (increasing, decreasing, stable)
   - Calculate trend strength and direction
   - Detect any significant trend changes

2. SEASONALITY DETECTION:
   - Identify seasonal patterns (monthly, quarterly, annual)
   - Calculate seasonal indices for each period
   - Determine seasonality strength and reliability

3. DEMAND VARIABILITY:
   - Calculate coefficient of variation
   - Identify demand volatility patterns
   - Classify variability level (low, medium, high)

4. ANOMALY DETECTION:
   - Identify unusual demand spikes or drops
   - Determine if anomalies are one-time events or recurring
   - Assess impact on forecasting accuracy

5. DEMAND DRIVERS:
   - Identify potential external factors affecting demand
   - Correlate with business events or market conditions
   - Assess predictability of demand changes

Return your analysis in the following JSON format:
{
  "trend": {
    "direction": "increasing|decreasing|stable",
    "strength": 0.0-1.0,
    "changePoints": ["date1", "date2"],
    "confidence": 0.0-1.0
  },
  "seasonality": {
    "detected": true|false,
    "pattern": "monthly|quarterly|annual|none",
    "indices": {"period": value},
    "strength": 0.0-1.0,
    "confidence": 0.0-1.0
  },
  "variability": {
    "coefficient": 0.0-1.0,
    "classification": "low|medium|high",
    "volatilityPattern": "consistent|increasing|decreasing"
  },
  "anomalies": [
    {
      "date": "YYYY-MM-DD",
      "type": "spike|drop",
      "magnitude": 0.0-1.0,
      "explanation": "reason"
    }
  ],
  "demandDrivers": [
    {
      "factor": "description",
      "impact": "high|medium|low",
      "predictability": "high|medium|low"
    }
  ],
  "forecastability": {
    "score": 0.0-1.0,
    "challenges": ["challenge1", "challenge2"],
    "recommendations": ["rec1", "rec2"]
  }
}
`,

  // Supplier performance evaluation prompt
  SUPPLIER_EVALUATION: `
You are a procurement expert specializing in supplier performance analysis. Evaluate the provided supplier data and generate performance rankings.

Supplier Data: {supplierData}
Part Information: {partInfo}
Evaluation Criteria: {criteria}
Historical Performance: {historicalPerformance}

Perform comprehensive supplier evaluation based on:

1. DELIVERY PERFORMANCE:
   - On-time delivery rate
   - Lead time consistency
   - Lead time trends
   - Delivery reliability score

2. COST PERFORMANCE:
   - Price competitiveness
   - Price stability over time
   - Total cost of ownership
   - Cost trend analysis

3. QUALITY METRICS:
   - Quality rating history
   - Defect rates
   - Return/rejection rates
   - Quality improvement trends

4. RELATIONSHIP FACTORS:
   - Communication responsiveness
   - Flexibility and adaptability
   - Strategic partnership potential
   - Risk factors

5. CAPACITY AND CAPABILITY:
   - Production capacity
   - Technical capabilities
   - Geographic coverage
   - Financial stability

Return your evaluation in the following JSON format:
{
  "supplierRankings": [
    {
      "supplierId": "supplier_id",
      "supplierName": "name",
      "overallScore": 0.0-100.0,
      "ranking": 1,
      "scores": {
        "delivery": 0.0-100.0,
        "cost": 0.0-100.0,
        "quality": 0.0-100.0,
        "relationship": 0.0-100.0,
        "capacity": 0.0-100.0
      },
      "strengths": ["strength1", "strength2"],
      "weaknesses": ["weakness1", "weakness2"],
      "riskFactors": ["risk1", "risk2"],
      "recommendation": "preferred|acceptable|avoid"
    }
  ],
  "recommendedSupplier": {
    "supplierId": "supplier_id",
    "reasoning": "detailed explanation",
    "confidence": 0.0-1.0,
    "alternativeSuppliers": ["supplier2", "supplier3"]
  },
  "marketAnalysis": {
    "competitivePosition": "strong|moderate|weak",
    "priceRange": {"min": 0.0, "max": 0.0, "average": 0.0},
    "leadTimeRange": {"min": 0, "max": 0, "average": 0},
    "marketTrends": ["trend1", "trend2"]
  }
}
`,

  // Replenishment recommendation prompt
  REPLENISHMENT_RECOMMENDATION: `
You are an inventory optimization expert. Generate optimal replenishment recommendations based on comprehensive analysis.

Current Inventory: {currentInventory}
Demand Forecast: {demandForecast}
Supplier Analysis: {supplierAnalysis}
Business Constraints: {constraints}
Cost Parameters: {costParameters}

Generate replenishment recommendations considering:

1. OPTIMAL REORDER POINT:
   - Calculate based on lead time and demand variability
   - Consider service level targets
   - Account for forecast uncertainty
   - Include safety stock requirements

2. OPTIMAL ORDER QUANTITY:
   - Balance ordering costs vs holding costs
   - Consider supplier minimum order quantities
   - Account for volume discounts
   - Optimize for cash flow

3. TIMING OPTIMIZATION:
   - Determine optimal order timing
   - Consider supplier lead times
   - Account for seasonal patterns
   - Minimize stockout risk

4. SUPPLIER SELECTION:
   - Choose optimal supplier based on performance
   - Consider backup suppliers
   - Evaluate total cost of ownership
   - Assess risk factors

5. URGENCY ASSESSMENT:
   - Classify urgency level
   - Identify critical stockout risks
   - Prioritize recommendations
   - Suggest expediting options if needed

Return your recommendation in the following JSON format:
{
  "recommendation": {
    "partNumber": "part_number",
    "recommendedQuantity": 0,
    "suggestedOrderDate": "YYYY-MM-DD",
    "preferredSupplier": "supplier_id",
    "estimatedCost": 0.0,
    "urgencyLevel": "low|medium|high|critical",
    "confidence": 0.0-1.0
  },
  "reasoning": {
    "demandAnalysis": "explanation",
    "supplierSelection": "explanation",
    "quantityJustification": "explanation",
    "timingRationale": "explanation",
    "riskAssessment": "explanation"
  },
  "calculations": {
    "reorderPoint": 0,
    "safetyStock": 0,
    "economicOrderQuantity": 0,
    "expectedStockoutDate": "YYYY-MM-DD",
    "totalCost": 0.0,
    "costBreakdown": {
      "orderingCost": 0.0,
      "holdingCost": 0.0,
      "stockoutCost": 0.0
    }
  },
  "alternatives": [
    {
      "supplier": "supplier_id",
      "quantity": 0,
      "cost": 0.0,
      "leadTime": 0,
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"]
    }
  ],
  "riskFactors": [
    {
      "risk": "description",
      "probability": "high|medium|low",
      "impact": "high|medium|low",
      "mitigation": "strategy"
    }
  ]
}
`,

  // Inventory optimization prompt
  INVENTORY_OPTIMIZATION: `
You are an inventory optimization specialist. Analyze the current inventory portfolio and provide optimization recommendations.

Inventory Portfolio: {inventoryData}
Performance Metrics: {performanceMetrics}
Business Objectives: {objectives}
Constraints: {constraints}

Perform portfolio-level optimization:

1. ABC ANALYSIS:
   - Classify parts by value and importance
   - Identify high-value, high-volume items
   - Recommend differentiated strategies

2. INVENTORY HEALTH ASSESSMENT:
   - Identify slow-moving inventory
   - Detect excess stock situations
   - Find potential stockout risks

3. OPTIMIZATION OPPORTUNITIES:
   - Calculate potential cost savings
   - Identify inventory reduction opportunities
   - Recommend service level adjustments

4. STRATEGIC RECOMMENDATIONS:
   - Suggest inventory policy changes
   - Recommend supplier consolidation
   - Propose automation opportunities

Return analysis in JSON format:
{
  "portfolioAnalysis": {
    "totalValue": 0.0,
    "totalItems": 0,
    "turnoverRate": 0.0,
    "carryingCost": 0.0,
    "serviceLevel": 0.0
  },
  "abcClassification": {
    "classA": {"count": 0, "value": 0.0, "percentage": 0.0},
    "classB": {"count": 0, "value": 0.0, "percentage": 0.0},
    "classC": {"count": 0, "value": 0.0, "percentage": 0.0}
  },
  "optimizationOpportunities": [
    {
      "type": "excess_inventory|slow_moving|stockout_risk",
      "partNumbers": ["part1", "part2"],
      "potentialSavings": 0.0,
      "action": "reduce|increase|optimize",
      "priority": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "category": "policy|supplier|automation",
      "description": "recommendation",
      "expectedBenefit": "benefit description",
      "implementation": "how to implement",
      "timeline": "timeframe"
    }
  ]
}
`
};

// Helper function to format prompts with data
export function formatPrompt(template: string, data: Record<string, any>): string {
  let formatted = template;
  
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{${key}}`;
    const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    formatted = formatted.replace(new RegExp(placeholder, 'g'), replacement);
  }
  
  return formatted;
}

// Prompt validation helper
export function validatePromptData(promptType: keyof typeof INVENTORY_ANALYSIS_PROMPTS, data: Record<string, any>): boolean {
  const requiredFields: Record<string, string[]> = {
    DEMAND_ANALYSIS: ['historicalData', 'partInfo', 'analysisPeriod'],
    SUPPLIER_EVALUATION: ['supplierData', 'partInfo', 'criteria', 'historicalPerformance'],
    REPLENISHMENT_RECOMMENDATION: ['currentInventory', 'demandForecast', 'supplierAnalysis', 'constraints', 'costParameters'],
    INVENTORY_OPTIMIZATION: ['inventoryData', 'performanceMetrics', 'objectives', 'constraints']
  };

  const required = requiredFields[promptType] || [];
  return required.every(field => data.hasOwnProperty(field));
}