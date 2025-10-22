import { DataNormalizer } from '../src/utils/data-normalizer';
import { LineItem } from '../src/types';

describe('Data Normalizer Tests', () => {
  let dataNormalizer: DataNormalizer;

  beforeEach(() => {
    dataNormalizer = new DataNormalizer();
  });

  describe('Part Number Normalization', () => {
    test('should normalize part numbers to uppercase', async () => {
      const lineItem: LineItem = {
        partNumber: 'abc-123',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.partNumber).toBe('ABC-123');
    });

    test('should remove special characters from part numbers', async () => {
      const lineItem: LineItem = {
        partNumber: 'abc@123#def',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.partNumber).toBe('ABC123DEF');
    });

    test('should preserve hyphens and dots in part numbers', async () => {
      const lineItem: LineItem = {
        partNumber: 'abc-123.def',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.partNumber).toBe('ABC-123.DEF');
    });

    test('should reject empty part numbers', async () => {
      const lineItem: LineItem = {
        partNumber: '',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid or empty part number'))).toBe(true);
    });

    test('should reject null or undefined part numbers', async () => {
      const lineItems = [
        { partNumber: null as any, description: 'Test', quantity: 1, unitPrice: 10, totalAmount: 10 },
        { partNumber: undefined as any, description: 'Test', quantity: 1, unitPrice: 10, totalAmount: 10 }
      ];

      for (const lineItem of lineItems) {
        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(false);
        expect(result.errors.some(error => error.includes('Invalid or empty part number'))).toBe(true);
      }
    });

    test('should handle various part number patterns', async () => {
      const testCases = [
        { input: 'ABC123', expected: 'ABC123' },
        { input: 'ABC-123', expected: 'ABC-123' },
        { input: '12345', expected: '12345' },
        { input: 'A1B2C3', expected: 'A1B2C3' },
        { input: 'PART.123.ABC', expected: 'PART.123.ABC' }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: testCase.input,
          description: 'Test Widget',
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(true);
        expect(result.normalizedData!.partNumber).toBe(testCase.expected);
      }
    });
  });

  describe('Description Normalization', () => {
    test('should capitalize first letter of each word', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'test widget part',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.description).toBe('Test Widget Part');
    });

    test('should clean up multiple spaces', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'test    widget     part',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.description).toBe('Test Widget Part');
    });

    test('should remove special characters from descriptions', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'test@widget#part$',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.description).toBe('Testwidgetpart');
    });

    test('should trim whitespace from descriptions', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: '   test widget part   ',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.description).toBe('Test Widget Part');
    });

    test('should reject empty descriptions', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: '',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid or empty description'))).toBe(true);
    });
  });

  describe('Category Determination', () => {
    test('should use provided category when valid', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00,
        category: 'spare'
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.category).toBe('spare_parts');
    });

    test('should infer category from description keywords', async () => {
      const testCases = [
        { description: 'Ball bearing for motor', expectedCategory: 'spare_parts' },
        { description: 'Motor pump assembly', expectedCategory: 'components' },
        { description: 'Wrench tool set', expectedCategory: 'tools' },
        { description: 'Screw bolt fastener', expectedCategory: 'consumables' },
        { description: 'Steel raw material', expectedCategory: 'raw_materials' },
        { description: 'Unknown item', expectedCategory: 'other' }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: 'TEST-123',
          description: testCase.description,
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(true);
        expect(result.normalizedData!.category).toBe(testCase.expectedCategory);
      }
    });

    test('should default to other category when no match found', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Mysterious unknown item',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.category).toBe('other');
    });
  });

  describe('Unit of Measure Determination', () => {
    test('should infer unit of measure from description', async () => {
      const testCases = [
        { description: 'Widget sold by piece', expectedUnit: 'each' },
        { description: 'Cable 5 meters long', expectedUnit: 'meter' },
        { description: 'Pipe 10 feet length', expectedUnit: 'foot' },
        { description: 'Oil 2 liters container', expectedUnit: 'liter' },
        { description: 'Steel 5 kilograms weight', expectedUnit: 'kilogram' },
        { description: 'Tool kit set', expectedUnit: 'kit' },
        { description: 'Unknown item', expectedUnit: 'each' }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: 'TEST-123',
          description: testCase.description,
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(true);
        expect(result.normalizedData!.unitOfMeasure).toBe(testCase.expectedUnit);
      }
    });

    test('should default to each when no unit found', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Generic widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.unitOfMeasure).toBe('each');
    });
  });

  describe('Inventory Parameters Calculation', () => {
    test('should calculate appropriate safety stock for different categories', async () => {
      const testCases = [
        { category: 'spare_parts', expectedSafetyStock: 2 },
        { category: 'components', expectedSafetyStock: 5 },
        { category: 'tools', expectedSafetyStock: 1 },
        { category: 'consumables', expectedSafetyStock: 10 },
        { category: 'raw_materials', expectedSafetyStock: 20 }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: 'TEST-123',
          description: 'Test item',
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00,
          category: testCase.category.replace('_', '')
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(true);
        expect(result.normalizedData!.safetyStock).toBe(testCase.expectedSafetyStock);
      }
    });

    test('should adjust safety stock based on unit price', async () => {
      const expensiveItem: LineItem = {
        partNumber: 'EXPENSIVE-001',
        description: 'High value motor',
        quantity: 1,
        unitPrice: 1500.00,
        totalAmount: 1500.00,
        category: 'components'
      };

      const cheapItem: LineItem = {
        partNumber: 'CHEAP-001',
        description: 'Low value screw',
        quantity: 1,
        unitPrice: 0.50,
        totalAmount: 0.50,
        category: 'consumables'
      };

      const expensiveResult = await dataNormalizer.normalizeLineItem(expensiveItem);
      const cheapResult = await dataNormalizer.normalizeLineItem(cheapItem);

      expect(expensiveResult.success).toBe(true);
      expect(cheapResult.success).toBe(true);

      // Expensive items should have lower safety stock
      expect(expensiveResult.normalizedData!.safetyStock).toBeLessThan(cheapResult.normalizedData!.safetyStock);
    });

    test('should set appropriate lead times by category', async () => {
      const testCases = [
        { category: 'spare_parts', expectedLeadTime: 14 },
        { category: 'components', expectedLeadTime: 7 },
        { category: 'tools', expectedLeadTime: 21 },
        { category: 'consumables', expectedLeadTime: 5 },
        { category: 'raw_materials', expectedLeadTime: 10 }
      ];

      for (const testCase of testCases) {
        const lineItem: LineItem = {
          partNumber: 'TEST-123',
          description: 'Test item',
          quantity: 1,
          unitPrice: 10.00,
          totalAmount: 10.00,
          category: testCase.category.replace('_', '')
        };

        const result = await dataNormalizer.normalizeLineItem(lineItem);
        expect(result.success).toBe(true);
        expect(result.normalizedData!.leadTimeDays).toBe(testCase.expectedLeadTime);
      }
    });

    test('should ensure reorder point is at least safety stock', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.reorderPoint).toBeGreaterThanOrEqual(result.normalizedData!.safetyStock);
    });
  });

  describe('Data Validation', () => {
    test('should validate normalized data structure', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Test Widget',
        quantity: 5,
        unitPrice: 10.00,
        totalAmount: 50.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData).toBeDefined();
      expect(result.normalizedData!.partNumber).toBeDefined();
      expect(result.normalizedData!.description).toBeDefined();
      expect(result.normalizedData!.category).toBeDefined();
      expect(result.normalizedData!.unitOfMeasure).toBeDefined();
      expect(result.normalizedData!.safetyStock).toBeGreaterThanOrEqual(0);
      expect(result.normalizedData!.reorderPoint).toBeGreaterThanOrEqual(0);
      expect(result.normalizedData!.leadTimeDays).toBeGreaterThan(0);
      expect(result.normalizedData!.isActive).toBe(true);
      expect(result.normalizedData!.lastUpdated).toBeInstanceOf(Date);
    });

    test('should generate warnings for unusual values', async () => {
      const lineItem: LineItem = {
        partNumber: 'A'.repeat(60), // Very long part number
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('Part number is unusually long'))).toBe(true);
    });

    test('should detect part numbers with unusual characters', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC@123#DEF',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.warnings.some(warning => warning.includes('Part number contains unusual characters'))).toBe(true);
    });

    test('should validate safety stock is not negative', async () => {
      // This test ensures the validation logic works correctly
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.normalizedData!.safetyStock).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Confidence Calculation', () => {
    test('should provide high confidence for clean data', async () => {
      const perfectLineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Perfect Widget',
        quantity: 5,
        unitPrice: 10.00,
        totalAmount: 50.00,
        category: 'spare_parts'
      };

      const result = await dataNormalizer.normalizeLineItem(perfectLineItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    test('should reduce confidence for modified part numbers', async () => {
      const modifiedPartNumberItem: LineItem = {
        partNumber: 'abc@123#def', // Will be heavily modified
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(modifiedPartNumberItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('should reduce confidence for inferred categories', async () => {
      const noCategoryItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Unknown item type',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
        // No category provided
      };

      const result = await dataNormalizer.normalizeLineItem(noCategoryItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeLessThan(0.9);
    });

    test('should reduce confidence for heavily cleaned descriptions', async () => {
      const messyDescriptionItem: LineItem = {
        partNumber: 'ABC-123',
        description: '!!!MESSY@@@DESCRIPTION###WITH$$$LOTS%%%OF^^^SPECIAL&&&CHARACTERS***',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(messyDescriptionItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeLessThan(0.8);
    });

    test('should reduce confidence for warnings', async () => {
      const warningItem: LineItem = {
        partNumber: 'A'.repeat(60), // Will generate warning
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(warningItem);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(1.0);
    });

    test('should ensure confidence is within valid range', async () => {
      const lineItem: LineItem = {
        partNumber: 'ABC-123',
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(lineItem);

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.1);
      expect(result.confidence).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Error Handling', () => {
    test('should handle null line item gracefully', async () => {
      const result = await dataNormalizer.normalizeLineItem(null as any);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle undefined line item gracefully', async () => {
      const result = await dataNormalizer.normalizeLineItem(undefined as any);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle line item with missing required fields', async () => {
      const incompleteLineItem = {
        // Missing partNumber
        description: 'Test Widget',
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      } as LineItem;

      const result = await dataNormalizer.normalizeLineItem(incompleteLineItem);

      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid or empty part number'))).toBe(true);
    });

    test('should collect multiple errors', async () => {
      const badLineItem: LineItem = {
        partNumber: '', // Invalid
        description: '', // Invalid
        quantity: 1,
        unitPrice: 10.00,
        totalAmount: 10.00
      };

      const result = await dataNormalizer.normalizeLineItem(badLineItem);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors.some(error => error.includes('Invalid or empty part number'))).toBe(true);
      expect(result.errors.some(error => error.includes('Invalid or empty description'))).toBe(true);
    });
  });
});