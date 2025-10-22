import { LineItem, SparePart, NormalizedInvoiceData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-1 quality score
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  field?: string;
  suggestedFix?: string;
}

export interface DataQualityRules {
  partNumber: {
    minLength: number;
    maxLength: number;
    allowedPatterns: RegExp[];
    requiredFormat?: RegExp;
  };
  description: {
    minLength: number;
    maxLength: number;
    forbiddenWords: string[];
    requiredWords?: string[];
  };
  pricing: {
    minPrice: number;
    maxPrice: number;
    currencyValidation: boolean;
  };
  quantity: {
    minQuantity: number;
    maxQuantity: number;
    allowDecimals: boolean;
  };
  category: {
    allowedCategories: string[];
    requireCategory: boolean;
  };
}

export class DataQualityValidator {
  private rules: DataQualityRules;

  constructor(customRules?: Partial<DataQualityRules>) {
    this.rules = {
      ...this.getDefaultRules(),
      ...customRules
    };
  }

  validateLineItem(lineItem: LineItem): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Validate part number
    const partNumberValidation = this.validatePartNumber(lineItem.partNumber);
    issues.push(...partNumberValidation.issues);
    score *= partNumberValidation.score;

    // Validate description
    const descriptionValidation = this.validateDescription(lineItem.description);
    issues.push(...descriptionValidation.issues);
    score *= descriptionValidation.score;

    // Validate pricing
    const pricingValidation = this.validatePricing(lineItem.unitPrice, lineItem.totalAmount, lineItem.quantity);
    issues.push(...pricingValidation.issues);
    score *= pricingValidation.score;

    // Validate quantity
    const quantityValidation = this.validateQuantity(lineItem.quantity);
    issues.push(...quantityValidation.issues);
    score *= quantityValidation.score;

    // Validate category
    if (lineItem.category) {
      const categoryValidation = this.validateCategory(lineItem.category);
      issues.push(...categoryValidation.issues);
      score *= categoryValidation.score;
    }

    // Cross-field validations
    const crossFieldValidation = this.validateCrossFields(lineItem);
    issues.push(...crossFieldValidation.issues);
    score *= crossFieldValidation.score;

    const recommendations = this.generateRecommendations(issues);

    return {
      isValid: !issues.some(issue => issue.severity === 'error'),
      score: Math.max(0.1, score), // Minimum score of 0.1
      issues,
      recommendations
    };
  }

  validateSparePart(sparePart: SparePart): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Validate part number
    const partNumberValidation = this.validatePartNumber(sparePart.partNumber);
    issues.push(...partNumberValidation.issues);
    score *= partNumberValidation.score;

    // Validate description
    const descriptionValidation = this.validateDescription(sparePart.description);
    issues.push(...descriptionValidation.issues);
    score *= descriptionValidation.score;

    // Validate category
    const categoryValidation = this.validateCategory(sparePart.category);
    issues.push(...categoryValidation.issues);
    score *= categoryValidation.score;

    // Validate inventory parameters
    const inventoryValidation = this.validateInventoryParameters(sparePart);
    issues.push(...inventoryValidation.issues);
    score *= inventoryValidation.score;

    // Validate unit of measure
    const unitValidation = this.validateUnitOfMeasure(sparePart.unitOfMeasure);
    issues.push(...unitValidation.issues);
    score *= unitValidation.score;

    const recommendations = this.generateRecommendations(issues);

    return {
      isValid: !issues.some(issue => issue.severity === 'error'),
      score: Math.max(0.1, score),
      issues,
      recommendations
    };
  }

  validateNormalizedData(data: NormalizedInvoiceData): ValidationResult {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Validate required fields
    const requiredFields = ['partNumber', 'invoiceId', 'invoiceType', 'quantity', 'unitPrice'];
    for (const field of requiredFields) {
      if (!data[field as keyof NormalizedInvoiceData]) {
        issues.push({
          severity: 'error',
          category: 'missing_data',
          message: `Required field '${field}' is missing`,
          field,
          suggestedFix: `Provide a valid value for ${field}`
        });
        score *= 0.7;
      }
    }

    // Validate data consistency
    const consistencyValidation = this.validateDataConsistency(data);
    issues.push(...consistencyValidation.issues);
    score *= consistencyValidation.score;

    // Validate date formats
    const dateValidation = this.validateDateFormats(data);
    issues.push(...dateValidation.issues);
    score *= dateValidation.score;

    // Validate quality score
    if (data.qualityScore < 0 || data.qualityScore > 1) {
      issues.push({
        severity: 'warning',
        category: 'data_quality',
        message: 'Quality score should be between 0 and 1',
        field: 'qualityScore',
        suggestedFix: 'Normalize quality score to 0-1 range'
      });
      score *= 0.9;
    }

    const recommendations = this.generateRecommendations(issues);

    return {
      isValid: !issues.some(issue => issue.severity === 'error'),
      score: Math.max(0.1, score),
      issues,
      recommendations
    };
  }

  private validatePartNumber(partNumber: string): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (!partNumber || typeof partNumber !== 'string') {
      issues.push({
        severity: 'error',
        category: 'part_number',
        message: 'Part number is required and must be a string',
        field: 'partNumber',
        suggestedFix: 'Provide a valid part number'
      });
      return { issues, score: 0.1 };
    }

    const trimmed = partNumber.trim();

    if (trimmed.length < this.rules.partNumber.minLength) {
      issues.push({
        severity: 'error',
        category: 'part_number',
        message: `Part number too short (minimum ${this.rules.partNumber.minLength} characters)`,
        field: 'partNumber',
        suggestedFix: 'Use a longer, more descriptive part number'
      });
      score *= 0.5;
    }

    if (trimmed.length > this.rules.partNumber.maxLength) {
      issues.push({
        severity: 'warning',
        category: 'part_number',
        message: `Part number very long (maximum recommended ${this.rules.partNumber.maxLength} characters)`,
        field: 'partNumber',
        suggestedFix: 'Consider using a shorter part number'
      });
      score *= 0.9;
    }

    // Check against allowed patterns
    const matchesPattern = this.rules.partNumber.allowedPatterns.some(pattern => pattern.test(trimmed));
    if (!matchesPattern) {
      issues.push({
        severity: 'warning',
        category: 'part_number',
        message: 'Part number format does not match standard patterns',
        field: 'partNumber',
        suggestedFix: 'Consider standardizing part number format'
      });
      score *= 0.8;
    }

    return { issues, score };
  }

  private validateDescription(description: string): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (!description || typeof description !== 'string') {
      issues.push({
        severity: 'error',
        category: 'description',
        message: 'Description is required and must be a string',
        field: 'description',
        suggestedFix: 'Provide a meaningful description'
      });
      return { issues, score: 0.1 };
    }

    const trimmed = description.trim();

    if (trimmed.length < this.rules.description.minLength) {
      issues.push({
        severity: 'warning',
        category: 'description',
        message: `Description too short (minimum recommended ${this.rules.description.minLength} characters)`,
        field: 'description',
        suggestedFix: 'Provide a more detailed description'
      });
      score *= 0.8;
    }

    if (trimmed.length > this.rules.description.maxLength) {
      issues.push({
        severity: 'info',
        category: 'description',
        message: `Description very long (maximum recommended ${this.rules.description.maxLength} characters)`,
        field: 'description',
        suggestedFix: 'Consider shortening the description'
      });
      score *= 0.95;
    }

    // Check for forbidden words
    const lowerDesc = trimmed.toLowerCase();
    for (const forbiddenWord of this.rules.description.forbiddenWords) {
      if (lowerDesc.includes(forbiddenWord.toLowerCase())) {
        issues.push({
          severity: 'warning',
          category: 'description',
          message: `Description contains potentially problematic word: ${forbiddenWord}`,
          field: 'description',
          suggestedFix: `Remove or replace '${forbiddenWord}' with more specific terminology`
        });
        score *= 0.9;
      }
    }

    return { issues, score };
  }

  private validatePricing(unitPrice: number, totalAmount: number, quantity: number): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (typeof unitPrice !== 'number' || unitPrice < 0) {
      issues.push({
        severity: 'error',
        category: 'pricing',
        message: 'Unit price must be a non-negative number',
        field: 'unitPrice',
        suggestedFix: 'Provide a valid unit price'
      });
      score *= 0.5;
    }

    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      issues.push({
        severity: 'error',
        category: 'pricing',
        message: 'Total amount must be a non-negative number',
        field: 'totalAmount',
        suggestedFix: 'Provide a valid total amount'
      });
      score *= 0.5;
    }

    if (unitPrice < this.rules.pricing.minPrice) {
      issues.push({
        severity: 'warning',
        category: 'pricing',
        message: `Unit price unusually low (${unitPrice})`,
        field: 'unitPrice',
        suggestedFix: 'Verify the unit price is correct'
      });
      score *= 0.9;
    }

    if (unitPrice > this.rules.pricing.maxPrice) {
      issues.push({
        severity: 'warning',
        category: 'pricing',
        message: `Unit price unusually high (${unitPrice})`,
        field: 'unitPrice',
        suggestedFix: 'Verify the unit price is correct'
      });
      score *= 0.9;
    }

    // Check price calculation consistency
    const expectedTotal = unitPrice * quantity;
    const tolerance = Math.max(0.01, expectedTotal * 0.01); // 1% tolerance or 1 cent minimum
    
    if (Math.abs(totalAmount - expectedTotal) > tolerance) {
      issues.push({
        severity: 'warning',
        category: 'pricing',
        message: `Total amount (${totalAmount}) doesn't match unit price × quantity (${expectedTotal})`,
        field: 'totalAmount',
        suggestedFix: 'Verify pricing calculations'
      });
      score *= 0.8;
    }

    return { issues, score };
  }

  private validateQuantity(quantity: number): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (typeof quantity !== 'number' || quantity <= 0) {
      issues.push({
        severity: 'error',
        category: 'quantity',
        message: 'Quantity must be a positive number',
        field: 'quantity',
        suggestedFix: 'Provide a valid positive quantity'
      });
      return { issues, score: 0.1 };
    }

    if (quantity < this.rules.quantity.minQuantity) {
      issues.push({
        severity: 'warning',
        category: 'quantity',
        message: `Quantity unusually low (${quantity})`,
        field: 'quantity',
        suggestedFix: 'Verify the quantity is correct'
      });
      score *= 0.9;
    }

    if (quantity > this.rules.quantity.maxQuantity) {
      issues.push({
        severity: 'warning',
        category: 'quantity',
        message: `Quantity unusually high (${quantity})`,
        field: 'quantity',
        suggestedFix: 'Verify the quantity is correct'
      });
      score *= 0.9;
    }

    if (!this.rules.quantity.allowDecimals && quantity % 1 !== 0) {
      issues.push({
        severity: 'info',
        category: 'quantity',
        message: 'Decimal quantities detected',
        field: 'quantity',
        suggestedFix: 'Consider if fractional quantities are appropriate'
      });
      score *= 0.95;
    }

    return { issues, score };
  }

  private validateCategory(category: string): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (!category || typeof category !== 'string') {
      if (this.rules.category.requireCategory) {
        issues.push({
          severity: 'error',
          category: 'category',
          message: 'Category is required',
          field: 'category',
          suggestedFix: 'Assign an appropriate category'
        });
        score *= 0.7;
      } else {
        issues.push({
          severity: 'warning',
          category: 'category',
          message: 'Category not specified',
          field: 'category',
          suggestedFix: 'Consider assigning a category for better organization'
        });
        score *= 0.9;
      }
    } else if (!this.rules.category.allowedCategories.includes(category.toLowerCase())) {
      issues.push({
        severity: 'warning',
        category: 'category',
        message: `Category '${category}' not in standard list`,
        field: 'category',
        suggestedFix: 'Use a standard category or add to approved list'
      });
      score *= 0.8;
    }

    return { issues, score };
  }

  private validateInventoryParameters(sparePart: SparePart): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    if (sparePart.safetyStock < 0) {
      issues.push({
        severity: 'error',
        category: 'inventory',
        message: 'Safety stock cannot be negative',
        field: 'safetyStock',
        suggestedFix: 'Set safety stock to 0 or positive value'
      });
      score *= 0.7;
    }

    if (sparePart.reorderPoint < sparePart.safetyStock) {
      issues.push({
        severity: 'warning',
        category: 'inventory',
        message: 'Reorder point is below safety stock level',
        field: 'reorderPoint',
        suggestedFix: 'Set reorder point above safety stock'
      });
      score *= 0.8;
    }

    if (sparePart.leadTimeDays < 1) {
      issues.push({
        severity: 'warning',
        category: 'inventory',
        message: 'Lead time is very short (less than 1 day)',
        field: 'leadTimeDays',
        suggestedFix: 'Verify lead time is realistic'
      });
      score *= 0.9;
    }

    if (sparePart.leadTimeDays > 365) {
      issues.push({
        severity: 'warning',
        category: 'inventory',
        message: 'Lead time is very long (more than 1 year)',
        field: 'leadTimeDays',
        suggestedFix: 'Verify lead time is correct'
      });
      score *= 0.9;
    }

    return { issues, score };
  }

  private validateUnitOfMeasure(unitOfMeasure: string): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    const standardUnits = ['each', 'piece', 'meter', 'foot', 'inch', 'liter', 'gallon', 'kilogram', 'pound', 'set', 'kit', 'roll', 'sheet'];

    if (!unitOfMeasure || typeof unitOfMeasure !== 'string') {
      issues.push({
        severity: 'error',
        category: 'unit_of_measure',
        message: 'Unit of measure is required',
        field: 'unitOfMeasure',
        suggestedFix: 'Specify appropriate unit of measure'
      });
      score *= 0.7;
    } else if (!standardUnits.includes(unitOfMeasure.toLowerCase())) {
      issues.push({
        severity: 'info',
        category: 'unit_of_measure',
        message: `Non-standard unit of measure: ${unitOfMeasure}`,
        field: 'unitOfMeasure',
        suggestedFix: 'Consider using standard units for consistency'
      });
      score *= 0.95;
    }

    return { issues, score };
  }

  private validateCrossFields(lineItem: LineItem): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Check if description matches part number pattern
    const partInDesc = lineItem.description.toLowerCase().includes(lineItem.partNumber.toLowerCase());
    if (!partInDesc && lineItem.partNumber.length > 3) {
      issues.push({
        severity: 'info',
        category: 'consistency',
        message: 'Part number not found in description',
        suggestedFix: 'Verify part number and description match'
      });
      score *= 0.95;
    }

    return { issues, score };
  }

  private validateDataConsistency(data: NormalizedInvoiceData): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Check if normalized description is significantly different from original
    const similarity = this.calculateStringSimilarity(data.normalizedDescription, data.originalDescription);
    if (similarity < 0.5) {
      issues.push({
        severity: 'warning',
        category: 'normalization',
        message: 'Normalized description differs significantly from original',
        suggestedFix: 'Review normalization process'
      });
      score *= 0.9;
    }

    return { issues, score };
  }

  private validateDateFormats(data: NormalizedInvoiceData): { issues: ValidationIssue[]; score: number } {
    const issues: ValidationIssue[] = [];
    let score = 1.0;

    // Validate ISO date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.invoiceDate)) {
      issues.push({
        severity: 'error',
        category: 'date_format',
        message: 'Invoice date must be in YYYY-MM-DD format',
        field: 'invoiceDate',
        suggestedFix: 'Convert date to ISO format'
      });
      score *= 0.8;
    }

    // Validate timestamp format
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!timestampRegex.test(data.normalizationTimestamp)) {
      issues.push({
        severity: 'warning',
        category: 'timestamp_format',
        message: 'Normalization timestamp should be in ISO format',
        field: 'normalizationTimestamp',
        suggestedFix: 'Use ISO timestamp format'
      });
      score *= 0.9;
    }

    return { issues, score };
  }

  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];
    const errorCategories = new Set(issues.filter(i => i.severity === 'error').map(i => i.category));
    const warningCategories = new Set(issues.filter(i => i.severity === 'warning').map(i => i.category));

    if (errorCategories.has('part_number')) {
      recommendations.push('Implement part number standardization rules');
    }

    if (errorCategories.has('pricing')) {
      recommendations.push('Add pricing validation and calculation checks');
    }

    if (warningCategories.has('category')) {
      recommendations.push('Create standardized category taxonomy');
    }

    if (warningCategories.has('inventory')) {
      recommendations.push('Review inventory parameter calculation logic');
    }

    if (issues.length > 5) {
      recommendations.push('Consider implementing automated data cleaning');
    }

    return recommendations;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private getDefaultRules(): DataQualityRules {
    return {
      partNumber: {
        minLength: 2,
        maxLength: 50,
        allowedPatterns: [
          /^[A-Z0-9]{2,}-[A-Z0-9]{2,}/, // ABC-123
          /^[A-Z]{2,}[0-9]{2,}/, // ABC123
          /^[0-9]{4,}/, // 12345
          /^[A-Z0-9\-\.]{3,}/ // General
        ]
      },
      description: {
        minLength: 5,
        maxLength: 200,
        forbiddenWords: ['unknown', 'misc', 'various', 'stuff', 'thing']
      },
      pricing: {
        minPrice: 0.01,
        maxPrice: 100000,
        currencyValidation: true
      },
      quantity: {
        minQuantity: 0.001,
        maxQuantity: 10000,
        allowDecimals: true
      },
      category: {
        allowedCategories: [
          'spare_parts', 'components', 'tools', 'consumables', 
          'raw_materials', 'other'
        ],
        requireCategory: false
      }
    };
  }
}