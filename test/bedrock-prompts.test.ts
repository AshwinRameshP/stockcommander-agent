import { BedrockPromptBuilder, INVOICE_PARSING_PROMPTS, ERROR_HANDLING_PROMPTS } from '../src/utils/bedrock-prompts';

describe('Bedrock Prompts Tests', () => {
  describe('Prompt Template Building', () => {
    test('should build prompt with variables correctly', () => {
      const template = {
        name: 'Test Template',
        description: 'Test description',
        template: 'Hello {{name}}, your age is {{age}}',
        variables: ['name', 'age']
      };

      const variables = {
        name: 'John',
        age: '30'
      };

      const result = BedrockPromptBuilder.buildPrompt(template, variables);

      expect(result).toBe('Hello John, your age is 30');
    });

    test('should handle missing variables gracefully', () => {
      const template = {
        name: 'Test Template',
        description: 'Test description',
        template: 'Hello {{name}}, your age is {{age}}',
        variables: ['name', 'age']
      };

      const variables = {
        name: 'John'
        // age is missing
      };

      const result = BedrockPromptBuilder.buildPrompt(template, variables);

      expect(result).toBe('Hello John, your age is ');
    });

    test('should handle multiple occurrences of same variable', () => {
      const template = {
        name: 'Test Template',
        description: 'Test description',
        template: 'Hello {{name}}, nice to meet you {{name}}!',
        variables: ['name']
      };

      const variables = {
        name: 'Alice'
      };

      const result = BedrockPromptBuilder.buildPrompt(template, variables);

      expect(result).toBe('Hello Alice, nice to meet you Alice!');
    });
  });

  describe('Sales Invoice Prompts', () => {
    test('should generate sales invoice prompt correctly', () => {
      const extractedText = 'Invoice #INV-001\nDate: 2023-01-01\nCustomer: Test Customer\nItem: Widget, Qty: 5, Price: $10.00';

      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', extractedText);

      expect(prompt).toContain('sales invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "sales"');
      expect(prompt).toContain('customer');
      expect(prompt).toContain('JSON object');
      expect(prompt).not.toContain('supplier');
      expect(prompt).not.toContain('purchaseOrderNumber');
    });

    test('should include all required fields for sales invoice', () => {
      const extractedText = 'Sample invoice text';
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', extractedText);

      const requiredFields = [
        'invoiceId',
        'type',
        'date',
        'customer',
        'lineItems',
        'partNumber',
        'description',
        'quantity',
        'unitPrice',
        'totalAmount',
        'currency',
        'confidence'
      ];

      requiredFields.forEach(field => {
        expect(prompt).toContain(field);
      });
    });

    test('should include extraction guidelines for sales invoice', () => {
      const extractedText = 'Sample invoice text';
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', extractedText);

      expect(prompt).toContain('Extraction Guidelines');
      expect(prompt).toContain('spare parts');
      expect(prompt).toContain('part numbers');
      expect(prompt).toContain('YYYY-MM-DD');
      expect(prompt).toContain('confidence');
    });
  });

  describe('Purchase Invoice Prompts', () => {
    test('should generate purchase invoice prompt correctly', () => {
      const extractedText = 'Invoice #PO-001\nDate: 2023-01-01\nSupplier: Test Supplier\nItem: Component, Qty: 10, Price: $25.00';

      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);

      expect(prompt).toContain('purchase invoice');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('"type": "purchase"');
      expect(prompt).toContain('supplier');
      expect(prompt).toContain('purchaseOrderNumber');
      expect(prompt).not.toContain('customer');
    });

    test('should include purchase-specific fields', () => {
      const extractedText = 'Sample purchase invoice text';
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);

      const purchaseSpecificFields = [
        'supplier',
        'supplierAddress',
        'purchaseOrderNumber',
        'leadTime',
        'shippingAmount',
        'deliveryDate'
      ];

      purchaseSpecificFields.forEach(field => {
        expect(prompt).toContain(field);
      });
    });

    test('should include purchase-specific guidelines', () => {
      const extractedText = 'Sample purchase invoice text';
      const prompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', extractedText);

      expect(prompt).toContain('supplier information');
      expect(prompt).toContain('lead times');
      expect(prompt).toContain('delivery information');
      expect(prompt).toContain('vendor management');
    });
  });

  describe('Receipt Prompts', () => {
    test('should generate receipt prompt correctly', () => {
      const extractedText = 'Receipt #12345\nStore: Hardware Store\nItem: Screws, $5.99';

      const prompt = BedrockPromptBuilder.getReceiptPrompt(extractedText);

      expect(prompt).toContain('receipt');
      expect(prompt).toContain(extractedText);
      expect(prompt).toContain('paymentMethod');
      expect(prompt).toContain('less structured data');
    });

    test('should include receipt-specific guidelines', () => {
      const extractedText = 'Sample receipt text';
      const prompt = BedrockPromptBuilder.getReceiptPrompt(extractedText);

      expect(prompt).toContain('Receipts may have less structured data');
      expect(prompt).toContain('retail, hardware stores');
      expect(prompt).toContain('Lower confidence is acceptable');
    });
  });

  describe('Extraction Result Validation', () => {
    test('should validate complete sales invoice result', () => {
      const validSalesResult = {
        invoiceId: 'INV-001',
        type: 'sales',
        date: '2023-01-01',
        customer: 'Test Customer',
        lineItems: [
          {
            partNumber: 'ABC-123',
            description: 'Test Widget',
            quantity: 5,
            unitPrice: 10.00,
            totalAmount: 50.00
          }
        ],
        totalAmount: 50.00,
        currency: 'USD',
        confidence: 0.9
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(validSalesResult, 'sales');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should validate complete purchase invoice result', () => {
      const validPurchaseResult = {
        invoiceId: 'PO-001',
        type: 'purchase',
        date: '2023-01-01',
        supplier: 'Test Supplier',
        lineItems: [
          {
            partNumber: 'XYZ-456',
            description: 'Test Component',
            quantity: 10,
            unitPrice: 25.00,
            totalAmount: 250.00
          }
        ],
        totalAmount: 250.00,
        currency: 'USD',
        confidence: 0.85
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(validPurchaseResult, 'purchase');

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidResult = {
        // Missing invoiceId
        type: 'sales',
        // Missing date
        customer: 'Test Customer',
        lineItems: [],
        totalAmount: 0,
        currency: 'USD'
        // Missing confidence
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(invalidResult, 'sales');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain(expect.stringContaining('Missing invoice ID'));
      expect(validation.errors).toContain(expect.stringContaining('Missing or invalid date'));
      expect(validation.errors).toContain(expect.stringContaining('Invalid confidence score'));
    });

    test('should detect invalid date formats', () => {
      const invalidDateResults = [
        { date: '01/01/2023' }, // Wrong format
        { date: '2023-13-01' }, // Invalid month
        { date: '2023-01-32' }, // Invalid day
        { date: 'January 1, 2023' }, // Text format
        { date: '' } // Empty
      ];

      invalidDateResults.forEach(result => {
        const fullResult = {
          invoiceId: 'INV-001',
          type: 'sales',
          ...result,
          customer: 'Test',
          lineItems: [],
          totalAmount: 100,
          currency: 'USD',
          confidence: 0.8
        };

        const validation = BedrockPromptBuilder.validateExtractionResult(fullResult, 'sales');
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(expect.stringContaining('Missing or invalid date'));
      });
    });

    test('should validate confidence score range', () => {
      const invalidConfidenceResults = [
        { confidence: -0.1 }, // Below 0
        { confidence: 1.1 }, // Above 1
        { confidence: 'high' }, // Non-numeric
        { confidence: null } // Null
      ];

      invalidConfidenceResults.forEach(result => {
        const fullResult = {
          invoiceId: 'INV-001',
          type: 'sales',
          date: '2023-01-01',
          customer: 'Test',
          lineItems: [],
          totalAmount: 100,
          currency: 'USD',
          ...result
        };

        const validation = BedrockPromptBuilder.validateExtractionResult(fullResult, 'sales');
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain(expect.stringContaining('Invalid confidence score'));
      });
    });

    test('should generate warnings for missing optional fields', () => {
      const resultWithMissingOptionals = {
        invoiceId: 'INV-001',
        type: 'sales',
        date: '2023-01-01',
        // Missing customer for sales invoice
        lineItems: [], // Empty line items
        totalAmount: 0, // Zero total
        // Missing currency
        confidence: 0.5
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(resultWithMissingOptionals, 'sales');

      expect(validation.warnings).toContain(expect.stringContaining('Missing customer information'));
      expect(validation.warnings).toContain(expect.stringContaining('No line items found'));
      expect(validation.warnings).toContain(expect.stringContaining('Missing or invalid total amount'));
      expect(validation.warnings).toContain(expect.stringContaining('Missing currency information'));
    });

    test('should validate line items structure', () => {
      const resultWithInvalidLineItems = {
        invoiceId: 'INV-001',
        type: 'sales',
        date: '2023-01-01',
        customer: 'Test Customer',
        lineItems: [
          {
            // Missing description
            quantity: 0, // Invalid quantity
            unitPrice: -5, // Invalid price
            totalAmount: 10
          },
          {
            description: 'Valid item',
            quantity: 5,
            unitPrice: 10,
            totalAmount: 50
          }
        ],
        totalAmount: 60,
        currency: 'USD',
        confidence: 0.8
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(resultWithInvalidLineItems, 'sales');

      expect(validation.warnings).toContain(expect.stringContaining('Line item 1: Missing description'));
      expect(validation.warnings).toContain(expect.stringContaining('Line item 1: Invalid quantity'));
      expect(validation.warnings).toContain(expect.stringContaining('Line item 1: Invalid unit price'));
    });

    test('should handle purchase invoice specific validations', () => {
      const purchaseResultMissingSupplier = {
        invoiceId: 'PO-001',
        type: 'purchase',
        date: '2023-01-01',
        // Missing supplier for purchase invoice
        lineItems: [{
          partNumber: 'ABC-123',
          description: 'Test Part',
          quantity: 1,
          unitPrice: 10,
          totalAmount: 10
        }],
        totalAmount: 10,
        currency: 'USD',
        confidence: 0.8
      };

      const validation = BedrockPromptBuilder.validateExtractionResult(purchaseResultMissingSupplier, 'purchase');

      expect(validation.warnings).toContain(expect.stringContaining('Missing supplier information'));
    });
  });

  describe('Error Handling Prompts', () => {
    test('should provide retry extraction prompt', () => {
      const retryPrompt = ERROR_HANDLING_PROMPTS.RETRY_EXTRACTION;

      expect(retryPrompt).toContain('previous extraction attempt failed');
      expect(retryPrompt).toContain('Focus on');
      expect(retryPrompt).toContain('invoice/receipt number');
      expect(retryPrompt).toContain('reasonable assumptions');
      expect(retryPrompt).toContain('confidence score');
    });

    test('should provide low confidence retry prompt', () => {
      const lowConfidencePrompt = ERROR_HANDLING_PROMPTS.LOW_CONFIDENCE_RETRY;

      expect(lowConfidencePrompt).toContain('low confidence');
      expect(lowConfidencePrompt).toContain('re-analyze');
      expect(lowConfidencePrompt).toContain('partially obscured');
      expect(lowConfidencePrompt).toContain('complex layouts');
    });
  });

  describe('Prompt Template Structure', () => {
    test('should have valid sales invoice template structure', () => {
      const template = INVOICE_PARSING_PROMPTS.SALES_INVOICE;

      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.template).toBeDefined();
      expect(template.variables).toContain('extractedText');
      expect(template.template).toContain('{{extractedText}}');
    });

    test('should have valid purchase invoice template structure', () => {
      const template = INVOICE_PARSING_PROMPTS.PURCHASE_INVOICE;

      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.template).toBeDefined();
      expect(template.variables).toContain('extractedText');
      expect(template.template).toContain('{{extractedText}}');
    });

    test('should have valid receipt template structure', () => {
      const template = INVOICE_PARSING_PROMPTS.RECEIPT_PARSER;

      expect(template.name).toBeDefined();
      expect(template.description).toBeDefined();
      expect(template.template).toBeDefined();
      expect(template.variables).toContain('extractedText');
      expect(template.template).toContain('{{extractedText}}');
    });
  });

  describe('Category Validation', () => {
    test('should include valid categories in prompts', () => {
      const salesPrompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', 'test');
      const purchasePrompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', 'test');

      const expectedCategories = [
        'spare_parts',
        'components',
        'tools',
        'consumables',
        'other'
      ];

      expectedCategories.forEach(category => {
        expect(salesPrompt).toContain(category);
        expect(purchasePrompt).toContain(category);
      });

      // Purchase invoices should also include raw_materials
      expect(purchasePrompt).toContain('raw_materials');
    });
  });

  describe('JSON Format Validation', () => {
    test('should request valid JSON format in prompts', () => {
      const salesPrompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', 'test');
      const purchasePrompt = BedrockPromptBuilder.getPromptForInvoiceType('purchase', 'test');

      expect(salesPrompt).toContain('Return only the JSON object');
      expect(salesPrompt).toContain('no additional text');
      expect(purchasePrompt).toContain('Return only the JSON object');
      expect(purchasePrompt).toContain('no additional text');
    });

    test('should include proper JSON structure examples', () => {
      const salesPrompt = BedrockPromptBuilder.getPromptForInvoiceType('sales', 'test');

      expect(salesPrompt).toContain('{');
      expect(salesPrompt).toContain('}');
      expect(salesPrompt).toContain('"invoiceId":');
      expect(salesPrompt).toContain('"lineItems": [');
      expect(salesPrompt).toContain('"confidence":');
    });
  });
});