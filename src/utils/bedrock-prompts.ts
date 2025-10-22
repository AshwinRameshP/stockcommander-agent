export interface PromptTemplate {
  name: string;
  description: string;
  template: string;
  variables: string[];
}

export const INVOICE_PARSING_PROMPTS = {
  SALES_INVOICE: {
    name: 'Sales Invoice Parser',
    description: 'Extract structured data from sales invoices',
    variables: ['extractedText'],
    template: `
You are an expert invoice data extraction system specialized in sales invoices. Please analyze the following sales invoice text and extract structured data with high accuracy.

Invoice Text:
{{extractedText}}

Please extract the following information and return it as a JSON object:

{
  "invoiceId": "string - invoice number or ID",
  "type": "sales",
  "date": "string - invoice date in YYYY-MM-DD format",
  "customer": "string - customer name or company",
  "customerAddress": "string - customer billing address if available",
  "lineItems": [
    {
      "partNumber": "string - part/item number, SKU, or model number",
      "description": "string - detailed item description",
      "quantity": number,
      "unitPrice": number,
      "totalAmount": number,
      "category": "string - item category (spare_parts, components, tools, etc.)"
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "totalAmount": number,
  "currency": "string - currency code (USD, EUR, etc.)",
  "paymentTerms": "string - payment terms if specified",
  "confidence": number - your confidence in the extraction (0.0 to 1.0)
}

Extraction Guidelines:
1. Focus on spare parts, components, and inventory-related items
2. Look for part numbers in various formats (SKU, model, product code)
3. Extract all line items, even if some fields are missing
4. Calculate totals if not explicitly stated
5. Use standard 3-letter currency codes
6. Date format must be YYYY-MM-DD
7. If a field cannot be found, use null
8. Confidence should reflect extraction certainty
9. Category should be one of: spare_parts, components, tools, consumables, other

Return only the JSON object, no additional text.
`
  },

  PURCHASE_INVOICE: {
    name: 'Purchase Invoice Parser',
    description: 'Extract structured data from purchase invoices',
    variables: ['extractedText'],
    template: `
You are an expert invoice data extraction system specialized in purchase invoices. Please analyze the following purchase invoice text and extract structured data with high accuracy.

Invoice Text:
{{extractedText}}

Please extract the following information and return it as a JSON object:

{
  "invoiceId": "string - invoice number or ID",
  "type": "purchase",
  "date": "string - invoice date in YYYY-MM-DD format",
  "supplier": "string - supplier/vendor name or company",
  "supplierAddress": "string - supplier address if available",
  "purchaseOrderNumber": "string - PO number if referenced",
  "lineItems": [
    {
      "partNumber": "string - part/item number, SKU, or model number",
      "description": "string - detailed item description",
      "quantity": number,
      "unitPrice": number,
      "totalAmount": number,
      "category": "string - item category (spare_parts, components, tools, etc.)",
      "leadTime": "string - delivery lead time if mentioned"
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "shippingAmount": number,
  "totalAmount": number,
  "currency": "string - currency code (USD, EUR, etc.)",
  "paymentTerms": "string - payment terms if specified",
  "deliveryDate": "string - expected delivery date in YYYY-MM-DD format",
  "confidence": number - your confidence in the extraction (0.0 to 1.0)
}

Extraction Guidelines:
1. Focus on spare parts, components, and inventory-related items
2. Look for part numbers in various formats (manufacturer part numbers, SKUs)
3. Extract supplier information carefully for vendor management
4. Include lead times and delivery information when available
5. Calculate totals including tax and shipping if not explicit
6. Use standard 3-letter currency codes
7. All dates must be in YYYY-MM-DD format
8. If a field cannot be found, use null
9. Confidence should reflect extraction certainty
10. Category should be one of: spare_parts, components, tools, consumables, raw_materials, other

Return only the JSON object, no additional text.
`
  },

  RECEIPT_PARSER: {
    name: 'Receipt Parser',
    description: 'Extract data from receipts and simple invoices',
    variables: ['extractedText'],
    template: `
You are an expert receipt data extraction system. Please analyze the following receipt text and extract structured data.

Receipt Text:
{{extractedText}}

Please extract the following information and return it as a JSON object:

{
  "invoiceId": "string - receipt number or transaction ID",
  "type": "purchase",
  "date": "string - transaction date in YYYY-MM-DD format",
  "supplier": "string - store/vendor name",
  "lineItems": [
    {
      "partNumber": "string - item code or SKU if available",
      "description": "string - item description",
      "quantity": number,
      "unitPrice": number,
      "totalAmount": number,
      "category": "string - best guess at item category"
    }
  ],
  "subtotal": number,
  "taxAmount": number,
  "totalAmount": number,
  "currency": "string - currency code",
  "paymentMethod": "string - payment method if identifiable",
  "confidence": number - your confidence in the extraction (0.0 to 1.0)
}

Extraction Guidelines:
1. Receipts may have less structured data than formal invoices
2. Look for any item codes, SKUs, or product numbers
3. Extract all purchased items
4. Infer categories based on item descriptions
5. Handle various receipt formats (retail, hardware stores, etc.)
6. Use standard currency codes
7. Date format must be YYYY-MM-DD
8. If a field cannot be found, use null
9. Lower confidence is acceptable for receipts

Return only the JSON object, no additional text.
`
  }
};

export class BedrockPromptBuilder {
  static buildPrompt(template: PromptTemplate, variables: Record<string, string>): string {
    let prompt = template.template;
    
    // Replace template variables
    template.variables.forEach(variable => {
      const placeholder = `{{${variable}}}`;
      const value = variables[variable] || '';
      prompt = prompt.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return prompt.trim();
  }

  static getPromptForInvoiceType(invoiceType: 'sales' | 'purchase', extractedText: string): string {
    const template = invoiceType === 'sales' 
      ? INVOICE_PARSING_PROMPTS.SALES_INVOICE 
      : INVOICE_PARSING_PROMPTS.PURCHASE_INVOICE;
    
    return this.buildPrompt(template, { extractedText });
  }

  static getReceiptPrompt(extractedText: string): string {
    return this.buildPrompt(INVOICE_PARSING_PROMPTS.RECEIPT_PARSER, { extractedText });
  }

  static validateExtractionResult(result: any, invoiceType: 'sales' | 'purchase'): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const validation: { isValid: boolean; errors: string[]; warnings: string[] } = { 
      isValid: true, 
      errors: [], 
      warnings: [] 
    };

    // Required fields validation
    if (!result.invoiceId) {
      validation.errors.push('Missing invoice ID');
      validation.isValid = false;
    }

    if (!result.date || !this.isValidDate(result.date)) {
      validation.errors.push('Missing or invalid date');
      validation.isValid = false;
    }

    if (invoiceType === 'sales' && !result.customer) {
      validation.warnings.push('Missing customer information');
    }

    if (invoiceType === 'purchase' && !result.supplier) {
      validation.warnings.push('Missing supplier information');
    }

    if (!result.lineItems || !Array.isArray(result.lineItems) || result.lineItems.length === 0) {
      validation.warnings.push('No line items found');
    }

    if (!result.totalAmount || result.totalAmount <= 0) {
      validation.warnings.push('Missing or invalid total amount');
    }

    if (!result.currency) {
      validation.warnings.push('Missing currency information');
    }

    if (!result.confidence || result.confidence < 0 || result.confidence > 1) {
      validation.errors.push('Invalid confidence score');
      validation.isValid = false;
    }

    // Line items validation
    if (result.lineItems && Array.isArray(result.lineItems)) {
      result.lineItems.forEach((item: any, index: number) => {
        if (!item.description) {
          validation.warnings.push(`Line item ${index + 1}: Missing description`);
        }
        if (!item.quantity || item.quantity <= 0) {
          validation.warnings.push(`Line item ${index + 1}: Invalid quantity`);
        }
        if (!item.unitPrice || item.unitPrice < 0) {
          validation.warnings.push(`Line item ${index + 1}: Invalid unit price`);
        }
      });
    }

    return validation;
  }

  private static isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

// Error handling and retry prompts
export const ERROR_HANDLING_PROMPTS = {
  RETRY_EXTRACTION: `
The previous extraction attempt failed or returned invalid data. Please try again with more careful analysis.

Focus on:
1. Finding any invoice/receipt number or ID
2. Identifying the date (look for various date formats)
3. Finding vendor/customer information
4. Extracting all line items with quantities and prices
5. Calculating or finding the total amount

If some information is unclear, make reasonable assumptions but lower the confidence score accordingly.
`,

  LOW_CONFIDENCE_RETRY: `
The previous extraction had low confidence. Please re-analyze the text more carefully.

Pay special attention to:
1. Text that might be partially obscured or unclear
2. Numbers that might be formatted unusually
3. Abbreviations or shortened terms
4. Multiple columns or complex layouts

Provide your best interpretation even if some data is uncertain, but reflect this in the confidence score.
`
};

export default {
  INVOICE_PARSING_PROMPTS,
  BedrockPromptBuilder,
  ERROR_HANDLING_PROMPTS
};