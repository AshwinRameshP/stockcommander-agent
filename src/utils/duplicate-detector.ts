import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SparePart } from '../types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingPartNumber?: string;
  similarParts: Array<{
    partNumber: string;
    similarity: number;
    matchType: 'exact' | 'fuzzy' | 'description';
  }>;
  confidence: number;
}

export interface DuplicateDetectionConfig {
  partNumberSimilarityThreshold: number;
  descriptionSimilarityThreshold: number;
  enableFuzzyMatching: boolean;
  maxSimilarParts: number;
}

export class DuplicateDetector {
  private dynamoClient: DynamoDBClient;
  private config: DuplicateDetectionConfig;
  private sparePartsTable: string;

  constructor(dynamoClient: DynamoDBClient, config?: Partial<DuplicateDetectionConfig>) {
    this.dynamoClient = dynamoClient;
    this.sparePartsTable = process.env.SPARE_PARTS_TABLE || 'SpareParts';
    
    this.config = {
      partNumberSimilarityThreshold: 0.85,
      descriptionSimilarityThreshold: 0.80,
      enableFuzzyMatching: true,
      maxSimilarParts: 10,
      ...config
    };
  }

  async checkForDuplicates(sparePart: SparePart): Promise<DuplicateCheckResult> {
    const result: DuplicateCheckResult = {
      isDuplicate: false,
      similarParts: [],
      confidence: 0
    };

    try {
      // Step 1: Check for exact part number match
      const exactMatch = await this.checkExactPartNumberMatch(sparePart.partNumber);
      if (exactMatch) {
        result.isDuplicate = true;
        result.existingPartNumber = exactMatch;
        result.confidence = 1.0;
        result.similarParts.push({
          partNumber: exactMatch,
          similarity: 1.0,
          matchType: 'exact'
        });
        return result;
      }

      // Step 2: Check for fuzzy part number matches
      if (this.config.enableFuzzyMatching) {
        const fuzzyMatches = await this.findFuzzyPartNumberMatches(sparePart.partNumber);
        
        for (const match of fuzzyMatches) {
          if (match.similarity >= this.config.partNumberSimilarityThreshold) {
            result.isDuplicate = true;
            result.existingPartNumber = match.partNumber;
            result.confidence = match.similarity;
            break;
          }
          result.similarParts.push(match);
        }
      }

      // Step 3: Check for description-based matches (if not already a duplicate)
      if (!result.isDuplicate) {
        const descriptionMatches = await this.findDescriptionMatches(sparePart.description, sparePart.category);
        
        for (const match of descriptionMatches) {
          if (match.similarity >= this.config.descriptionSimilarityThreshold) {
            result.isDuplicate = true;
            result.existingPartNumber = match.partNumber;
            result.confidence = match.similarity * 0.9; // Slightly lower confidence for description matches
            break;
          }
          result.similarParts.push(match);
        }
      }

      // Limit the number of similar parts returned
      result.similarParts = result.similarParts
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.config.maxSimilarParts);

    } catch (error) {
      console.error('Error checking for duplicates:', error);
      // Return non-duplicate result on error to avoid blocking processing
      result.confidence = 0.1;
    }

    return result;
  }

  private async checkExactPartNumberMatch(partNumber: string): Promise<string | null> {
    try {
      const queryCommand = new QueryCommand({
        TableName: this.sparePartsTable,
        KeyConditionExpression: 'partNumber = :partNumber',
        ExpressionAttributeValues: {
          ':partNumber': { S: partNumber }
        },
        ProjectionExpression: 'partNumber'
      });

      const response = await this.dynamoClient.send(queryCommand);
      
      if (response.Items && response.Items.length > 0) {
        return response.Items[0].partNumber.S!;
      }

      return null;

    } catch (error) {
      console.error('Error checking exact part number match:', error);
      return null;
    }
  }

  private async findFuzzyPartNumberMatches(partNumber: string): Promise<Array<{
    partNumber: string;
    similarity: number;
    matchType: 'fuzzy';
  }>> {
    const matches: Array<{ partNumber: string; similarity: number; matchType: 'fuzzy' }> = [];

    try {
      // Get all part numbers for fuzzy matching
      // In production, you might want to use a more efficient approach like ElasticSearch
      const scanCommand = new ScanCommand({
        TableName: this.sparePartsTable,
        ProjectionExpression: 'partNumber',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':active': { BOOL: true }
        }
      });

      const response = await this.dynamoClient.send(scanCommand);
      
      if (response.Items) {
        for (const item of response.Items) {
          const existingPartNumber = item.partNumber.S!;
          const similarity = this.calculatePartNumberSimilarity(partNumber, existingPartNumber);
          
          if (similarity > 0.5) { // Only consider reasonably similar parts
            matches.push({
              partNumber: existingPartNumber,
              similarity,
              matchType: 'fuzzy'
            });
          }
        }
      }

    } catch (error) {
      console.error('Error finding fuzzy part number matches:', error);
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private async findDescriptionMatches(description: string, category: string): Promise<Array<{
    partNumber: string;
    similarity: number;
    matchType: 'description';
  }>> {
    const matches: Array<{ partNumber: string; similarity: number; matchType: 'description' }> = [];

    try {
      // Query parts in the same category
      const scanCommand = new ScanCommand({
        TableName: this.sparePartsTable,
        ProjectionExpression: 'partNumber, description',
        FilterExpression: 'category = :category AND isActive = :active',
        ExpressionAttributeValues: {
          ':category': { S: category },
          ':active': { BOOL: true }
        }
      });

      const response = await this.dynamoClient.send(scanCommand);
      
      if (response.Items) {
        for (const item of response.Items) {
          const existingPartNumber = item.partNumber.S!;
          const existingDescription = item.description.S!;
          const similarity = this.calculateDescriptionSimilarity(description, existingDescription);
          
          if (similarity > 0.6) { // Only consider reasonably similar descriptions
            matches.push({
              partNumber: existingPartNumber,
              similarity,
              matchType: 'description'
            });
          }
        }
      }

    } catch (error) {
      console.error('Error finding description matches:', error);
    }

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  private calculatePartNumberSimilarity(partNumber1: string, partNumber2: string): number {
    // Normalize part numbers for comparison
    const normalize = (pn: string) => pn.toUpperCase().replace(/[^\w]/g, '');
    const norm1 = normalize(partNumber1);
    const norm2 = normalize(partNumber2);

    // Exact match
    if (norm1 === norm2) {
      return 1.0;
    }

    // Check if one is a substring of the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 0.9;
    }

    // Use Levenshtein distance for fuzzy matching
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    
    if (maxLength === 0) return 0;
    
    return 1 - (distance / maxLength);
  }

  private calculateDescriptionSimilarity(description1: string, description2: string): number {
    // Normalize descriptions
    const normalize = (desc: string) => desc.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const norm1 = normalize(description1);
    const norm2 = normalize(description2);

    // Exact match
    if (norm1 === norm2) {
      return 1.0;
    }

    // Tokenize and compare
    const tokens1 = new Set(norm1.split(' '));
    const tokens2 = new Set(norm2.split(' '));

    // Calculate Jaccard similarity
    const intersection = new Set([...tokens1].filter(token => tokens2.has(token)));
    const union = new Set([...tokens1, ...tokens2]);

    if (union.size === 0) return 0;

    const jaccardSimilarity = intersection.size / union.size;

    // Also consider substring similarity
    const substringScore = this.calculateSubstringSimilarity(norm1, norm2);

    // Combine both scores
    return Math.max(jaccardSimilarity, substringScore);
  }

  private calculateSubstringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    // Find the longest common substring
    let maxLength = 0;
    for (let i = 0; i < shorter.length; i++) {
      for (let j = i + 1; j <= shorter.length; j++) {
        const substring = shorter.substring(i, j);
        if (longer.includes(substring) && substring.length > maxLength) {
          maxLength = substring.length;
        }
      }
    }

    return maxLength / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Method to get quality metrics for duplicate detection
  async getQualityMetrics(): Promise<{
    totalParts: number;
    potentialDuplicates: number;
    qualityScore: number;
  }> {
    try {
      const scanCommand = new ScanCommand({
        TableName: this.sparePartsTable,
        ProjectionExpression: 'partNumber, description, category',
        FilterExpression: 'isActive = :active',
        ExpressionAttributeValues: {
          ':active': { BOOL: true }
        }
      });

      const response = await this.dynamoClient.send(scanCommand);
      const totalParts = response.Items?.length || 0;
      
      // Simple heuristic: count parts with very similar descriptions in the same category
      let potentialDuplicates = 0;
      
      if (response.Items) {
        const partsByCategory: Record<string, Array<{ partNumber: string; description: string }>> = {};
        
        for (const item of response.Items) {
          const category = item.category.S!;
          const partNumber = item.partNumber.S!;
          const description = item.description.S!;
          
          if (!partsByCategory[category]) {
            partsByCategory[category] = [];
          }
          partsByCategory[category].push({ partNumber, description });
        }

        for (const parts of Object.values(partsByCategory)) {
          for (let i = 0; i < parts.length; i++) {
            for (let j = i + 1; j < parts.length; j++) {
              const similarity = this.calculateDescriptionSimilarity(parts[i].description, parts[j].description);
              if (similarity > 0.85) {
                potentialDuplicates++;
              }
            }
          }
        }
      }

      const qualityScore = totalParts > 0 ? Math.max(0, 1 - (potentialDuplicates / totalParts)) : 1;

      return {
        totalParts,
        potentialDuplicates,
        qualityScore
      };

    } catch (error) {
      console.error('Error calculating quality metrics:', error);
      return {
        totalParts: 0,
        potentialDuplicates: 0,
        qualityScore: 0
      };
    }
  }
}