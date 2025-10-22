import { LineItem, SparePart } from '../types';

export interface NormalizationResult {
  success: boolean;
  normalizedData?: SparePart;
  errors: string[];
  warnings: string[];
  confidence: number;
}

export interface NormalizationRules {
  partNumberPatterns: RegExp[];
  categoryMappings: Record<string, string>;
  unitOfMeasureMappings: Record<string, string>;
  descriptionCleanupRules: Array<{ pattern: RegExp; replacement: string }>;
}

export class DataNormalizer {
  private rules: NormalizationRules;

  constructor() {
    this.rules = this.getDefaultNormalizationRules();
  }

  async normalizeLineItem(lineItem: LineItem): Promise<NormalizationResult> {
    const result: NormalizationResult = {
      success: false,
      errors: [],
      warnings: [],
      confidence: 0
    };

    try {
      // Normalize part number
      const normalizedPartNumber = this.normalizePartNumber(lineItem.partNumber);
      if (!normalizedPartNumber) {
        result.errors.push('Invalid or empty part number');
        return result;
      }

      // Normalize description
      const normalizedDescription = this.normalizeDescription(lineItem.description);
      if (!normalizedDescription) {
        result.errors.push('Invalid or empty description');
        return result;
      }

      // Determine category
      const category = this.determineCategory(lineItem.category, normalizedDescription);
      
      // Determine unit of measure
      const unitOfMeasure = this.determineUnitOfMeasure(normalizedDescription);

      // Calculate default inventory parameters
      const inventoryParams = this.calculateDefaultInventoryParameters(lineItem, category);

      // Create normalized spare part
      const normalizedSparePart: SparePart = {
        partNumber: normalizedPartNumber,
        description: normalizedDescription,
        category: category,
        unitOfMeasure: unitOfMeasure,
        currentStock: 0, // Will be updated by inventory management
        safetyStock: inventoryParams.safetyStock,
        reorderPoint: inventoryParams.reorderPoint,
        leadTimeDays: inventoryParams.leadTimeDays,
        lastUpdated: new Date(),
        isActive: true
      };

      // Validate the normalized data
      const validation = this.validateNormalizedData(normalizedSparePart);
      result.errors.push(...validation.errors);
      result.warnings.push(...validation.warnings);

      if (validation.errors.length === 0) {
        result.success = true;
        result.normalizedData = normalizedSparePart;
        result.confidence = this.calculateConfidence(lineItem, normalizedSparePart, validation.warnings.length);
      }

    } catch (error) {
      result.errors.push(`Normalization error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  private normalizePartNumber(partNumber: string): string | null {
    if (!partNumber || typeof partNumber !== 'string') {
      return null;
    }

    // Clean up the part number
    let normalized = partNumber
      .trim()
      .toUpperCase()
      .replace(/[^\w\-\.]/g, '') // Remove special characters except hyphens and dots
      .replace(/\s+/g, ''); // Remove spaces

    // Apply part number patterns
    for (const pattern of this.rules.partNumberPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        normalized = match[0];
        break;
      }
    }

    return normalized.length > 0 ? normalized : null;
  }

  private normalizeDescription(description: string): string | null {
    if (!description || typeof description !== 'string') {
      return null;
    }

    let normalized = description.trim();

    // Apply cleanup rules
    for (const rule of this.rules.descriptionCleanupRules) {
      normalized = normalized.replace(rule.pattern, rule.replacement);
    }

    // Capitalize first letter of each word
    normalized = normalized.replace(/\b\w/g, char => char.toUpperCase());

    return normalized.length > 0 ? normalized : null;
  }

  private determineCategory(providedCategory?: string, description?: string): string {
    // Use provided category if it exists and is valid
    if (providedCategory && this.rules.categoryMappings[providedCategory.toLowerCase()]) {
      return this.rules.categoryMappings[providedCategory.toLowerCase()];
    }

    // Try to infer category from description
    if (description) {
      const lowerDesc = description.toLowerCase();
      
      // Check for category keywords in description
      for (const [keyword, category] of Object.entries(this.rules.categoryMappings)) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }

    return 'other'; // Default category
  }

  private determineUnitOfMeasure(description: string): string {
    const lowerDesc = description.toLowerCase();
    
    // Check for unit of measure keywords
    for (const [keyword, unit] of Object.entries(this.rules.unitOfMeasureMappings)) {
      if (lowerDesc.includes(keyword)) {
        return unit;
      }
    }

    return 'each'; // Default unit
  }

  private calculateDefaultInventoryParameters(lineItem: LineItem, category: string): {
    safetyStock: number;
    reorderPoint: number;
    leadTimeDays: number;
  } {
    // Base parameters by category
    const categoryDefaults: Record<string, { safetyStock: number; reorderPoint: number; leadTimeDays: number }> = {
      'spare_parts': { safetyStock: 2, reorderPoint: 5, leadTimeDays: 14 },
      'components': { safetyStock: 5, reorderPoint: 10, leadTimeDays: 7 },
      'tools': { safetyStock: 1, reorderPoint: 2, leadTimeDays: 21 },
      'consumables': { safetyStock: 10, reorderPoint: 25, leadTimeDays: 5 },
      'raw_materials': { safetyStock: 20, reorderPoint: 50, leadTimeDays: 10 },
      'other': { safetyStock: 1, reorderPoint: 3, leadTimeDays: 14 }
    };

    const defaults = categoryDefaults[category] || categoryDefaults['other'];
    
    // Adjust based on unit price (higher value items get lower safety stock)
    let safetyStockMultiplier = 1;
    if (lineItem.unitPrice > 1000) {
      safetyStockMultiplier = 0.5;
    } else if (lineItem.unitPrice > 100) {
      safetyStockMultiplier = 0.75;
    }

    return {
      safetyStock: Math.max(1, Math.round(defaults.safetyStock * safetyStockMultiplier)),
      reorderPoint: Math.max(1, Math.round(defaults.reorderPoint * safetyStockMultiplier)),
      leadTimeDays: defaults.leadTimeDays
    };
  }

  private validateNormalizedData(sparePart: SparePart): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!sparePart.partNumber || sparePart.partNumber.length < 2) {
      errors.push('Part number too short or invalid');
    }

    if (!sparePart.description || sparePart.description.length < 3) {
      errors.push('Description too short or invalid');
    }

    if (!sparePart.category) {
      errors.push('Category is required');
    }

    if (!sparePart.unitOfMeasure) {
      errors.push('Unit of measure is required');
    }

    // Logical validation
    if (sparePart.safetyStock < 0) {
      errors.push('Safety stock cannot be negative');
    }

    if (sparePart.reorderPoint < sparePart.safetyStock) {
      warnings.push('Reorder point is less than safety stock');
    }

    if (sparePart.leadTimeDays < 1) {
      warnings.push('Lead time is very short (less than 1 day)');
    }

    if (sparePart.leadTimeDays > 365) {
      warnings.push('Lead time is very long (more than 1 year)');
    }

    // Part number format validation
    if (sparePart.partNumber.length > 50) {
      warnings.push('Part number is unusually long');
    }

    if (!/^[A-Z0-9\-\.]+$/.test(sparePart.partNumber)) {
      warnings.push('Part number contains unusual characters');
    }

    return { errors, warnings };
  }

  private calculateConfidence(
    originalLineItem: LineItem, 
    normalizedSparePart: SparePart, 
    warningCount: number
  ): number {
    let confidence = 1.0;

    // Reduce confidence based on data quality issues
    confidence -= warningCount * 0.1;

    // Reduce confidence if part number was heavily modified
    const originalPartNumber = originalLineItem.partNumber.toUpperCase().replace(/[^\w]/g, '');
    const normalizedPartNumber = normalizedSparePart.partNumber.replace(/[^\w]/g, '');
    
    if (originalPartNumber !== normalizedPartNumber) {
      confidence -= 0.2;
    }

    // Reduce confidence if category was inferred
    if (!originalLineItem.category) {
      confidence -= 0.1;
    }

    // Reduce confidence if description was heavily cleaned
    const originalDesc = originalLineItem.description.toLowerCase();
    const normalizedDesc = normalizedSparePart.description.toLowerCase();
    
    if (Math.abs(originalDesc.length - normalizedDesc.length) > originalDesc.length * 0.3) {
      confidence -= 0.15;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private getDefaultNormalizationRules(): NormalizationRules {
    return {
      partNumberPatterns: [
        /^[A-Z0-9]{2,}-[A-Z0-9]{2,}/, // Standard format: ABC-123
        /^[A-Z]{2,}[0-9]{2,}/, // Alphanumeric: ABC123
        /^[0-9]{4,}/, // Numeric: 12345
        /^[A-Z0-9\-\.]{3,}/ // General pattern
      ],
      
      categoryMappings: {
        'spare': 'spare_parts',
        'part': 'spare_parts',
        'component': 'components',
        'tool': 'tools',
        'consumable': 'consumables',
        'material': 'raw_materials',
        'bearing': 'spare_parts',
        'seal': 'spare_parts',
        'gasket': 'spare_parts',
        'filter': 'spare_parts',
        'belt': 'spare_parts',
        'motor': 'components',
        'pump': 'components',
        'valve': 'components',
        'sensor': 'components',
        'switch': 'components',
        'cable': 'components',
        'wire': 'components',
        'screw': 'consumables',
        'bolt': 'consumables',
        'nut': 'consumables',
        'washer': 'consumables',
        'oil': 'consumables',
        'grease': 'consumables',
        'lubricant': 'consumables'
      },
      
      unitOfMeasureMappings: {
        'piece': 'each',
        'pieces': 'each',
        'unit': 'each',
        'units': 'each',
        'meter': 'meter',
        'meters': 'meter',
        'foot': 'foot',
        'feet': 'foot',
        'inch': 'inch',
        'inches': 'inch',
        'liter': 'liter',
        'liters': 'liter',
        'gallon': 'gallon',
        'gallons': 'gallon',
        'kilogram': 'kilogram',
        'kilograms': 'kilogram',
        'pound': 'pound',
        'pounds': 'pound',
        'set': 'set',
        'kit': 'kit',
        'roll': 'roll',
        'sheet': 'sheet'
      },
      
      descriptionCleanupRules: [
        { pattern: /\s+/g, replacement: ' ' }, // Multiple spaces to single space
        { pattern: /[^\w\s\-\.\,\(\)]/g, replacement: '' }, // Remove special characters
        { pattern: /\b(new|used|refurbished)\b/gi, replacement: '' }, // Remove condition words
        { pattern: /\b(oem|aftermarket|genuine)\b/gi, replacement: '' }, // Remove type words
        { pattern: /^\s+|\s+$/g, replacement: '' } // Trim whitespace
      ]
    };
  }
}