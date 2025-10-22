import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export interface DemandDataPoint {
  partNumber: string;
  timestamp: string;
  demand: number;
  category?: string;
  seasonalityFactor?: number;
}

export interface PreprocessedDataset {
  trainingData: DeepARRecord[];
  validationData: DeepARRecord[];
  metadata: DatasetMetadata;
}

export interface DeepARRecord {
  start: string;
  target: number[];
  cat?: number[];
  dynamic_feat?: number[][];
}

export interface DatasetMetadata {
  totalRecords: number;
  trainingRecords: number;
  validationRecords: number;
  timeSeriesLength: number;
  categories: string[];
  dateRange: {
    start: string;
    end: string;
  };
}

export class MLDataPreprocessor {
  private s3Client: S3Client;

  constructor(region: string = 'us-east-1') {
    this.s3Client = new S3Client({ region });
  }

  /**
   * Preprocess demand data for DeepAR training
   */
  async preprocessDemandData(
    demandData: DemandDataPoint[],
    options: {
      minTimeSeriesLength: number;
      trainValidationSplit: number;
      aggregationPeriod: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<PreprocessedDataset> {
    // Group data by part number
    const groupedData = this.groupByPartNumber(demandData);
    
    // Filter out time series that are too short
    const filteredData = this.filterShortTimeSeries(groupedData, options.minTimeSeriesLength);
    
    // Aggregate data by specified period
    const aggregatedData = this.aggregateByPeriod(filteredData, options.aggregationPeriod);
    
    // Create category mappings
    const categoryMapping = this.createCategoryMapping(aggregatedData);
    
    // Convert to DeepAR format
    const deepARRecords = this.convertToDeepARFormat(aggregatedData, categoryMapping);
    
    // Split into training and validation sets
    const { trainingData, validationData } = this.splitTrainValidation(
      deepARRecords, 
      options.trainValidationSplit
    );

    // Generate metadata
    const metadata = this.generateMetadata(
      demandData, 
      trainingData, 
      validationData, 
      categoryMapping
    );

    return {
      trainingData,
      validationData,
      metadata
    };
  }

  /**
   * Upload preprocessed data to S3 for SageMaker training
   */
  async uploadTrainingData(
    bucketName: string,
    keyPrefix: string,
    dataset: PreprocessedDataset
  ): Promise<{
    trainingDataS3Uri: string;
    validationDataS3Uri: string;
    metadataS3Uri: string;
  }> {
    const trainingKey = `${keyPrefix}/train/train.jsonl`;
    const validationKey = `${keyPrefix}/validation/validation.jsonl`;
    const metadataKey = `${keyPrefix}/metadata.json`;

    // Convert to JSONL format (one JSON object per line)
    const trainingJsonl = dataset.trainingData.map(record => JSON.stringify(record)).join('\n');
    const validationJsonl = dataset.validationData.map(record => JSON.stringify(record)).join('\n');

    // Upload training data
    await this.s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: trainingKey,
      Body: trainingJsonl,
      ContentType: 'application/jsonlines'
    }));

    // Upload validation data
    await this.s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: validationKey,
      Body: validationJsonl,
      ContentType: 'application/jsonlines'
    }));

    // Upload metadata
    await this.s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: metadataKey,
      Body: JSON.stringify(dataset.metadata, null, 2),
      ContentType: 'application/json'
    }));

    return {
      trainingDataS3Uri: `s3://${bucketName}/${trainingKey}`,
      validationDataS3Uri: `s3://${bucketName}/${validationKey}`,
      metadataS3Uri: `s3://${bucketName}/${metadataKey}`
    };
  }

  /**
   * Group demand data by part number
   */
  private groupByPartNumber(data: DemandDataPoint[]): Map<string, DemandDataPoint[]> {
    const grouped = new Map<string, DemandDataPoint[]>();
    
    for (const point of data) {
      if (!grouped.has(point.partNumber)) {
        grouped.set(point.partNumber, []);
      }
      grouped.get(point.partNumber)!.push(point);
    }

    // Sort each group by timestamp
    for (const [partNumber, points] of grouped) {
      points.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return grouped;
  }

  /**
   * Filter out time series that are too short for meaningful training
   */
  private filterShortTimeSeries(
    groupedData: Map<string, DemandDataPoint[]>,
    minLength: number
  ): Map<string, DemandDataPoint[]> {
    const filtered = new Map<string, DemandDataPoint[]>();
    
    for (const [partNumber, points] of groupedData) {
      if (points.length >= minLength) {
        filtered.set(partNumber, points);
      }
    }

    return filtered;
  }

  /**
   * Aggregate data by specified time period
   */
  private aggregateByPeriod(
    groupedData: Map<string, DemandDataPoint[]>,
    period: 'daily' | 'weekly' | 'monthly'
  ): Map<string, DemandDataPoint[]> {
    const aggregated = new Map<string, DemandDataPoint[]>();

    for (const [partNumber, points] of groupedData) {
      const aggregatedPoints = this.aggregateTimeSeries(points, period);
      aggregated.set(partNumber, aggregatedPoints);
    }

    return aggregated;
  }

  /**
   * Aggregate individual time series by period
   */
  private aggregateTimeSeries(
    points: DemandDataPoint[],
    period: 'daily' | 'weekly' | 'monthly'
  ): DemandDataPoint[] {
    const aggregated = new Map<string, DemandDataPoint>();

    for (const point of points) {
      const periodKey = this.getPeriodKey(point.timestamp, period);
      
      if (!aggregated.has(periodKey)) {
        aggregated.set(periodKey, {
          ...point,
          timestamp: periodKey,
          demand: 0
        });
      }

      const existing = aggregated.get(periodKey)!;
      existing.demand += point.demand;
    }

    return Array.from(aggregated.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  /**
   * Get period key for aggregation
   */
  private getPeriodKey(timestamp: string, period: 'daily' | 'weekly' | 'monthly'): string {
    const date = new Date(timestamp);
    
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Create category mapping for categorical features
   */
  private createCategoryMapping(
    groupedData: Map<string, DemandDataPoint[]>
  ): Map<string, number> {
    const categories = new Set<string>();
    
    for (const points of groupedData.values()) {
      for (const point of points) {
        if (point.category) {
          categories.add(point.category);
        }
      }
    }

    const mapping = new Map<string, number>();
    Array.from(categories).sort().forEach((category, index) => {
      mapping.set(category, index);
    });

    return mapping;
  }

  /**
   * Convert to DeepAR format
   */
  private convertToDeepARFormat(
    groupedData: Map<string, DemandDataPoint[]>,
    categoryMapping: Map<string, number>
  ): DeepARRecord[] {
    const records: DeepARRecord[] = [];

    for (const [partNumber, points] of groupedData) {
      if (points.length === 0) continue;

      const record: DeepARRecord = {
        start: points[0].timestamp,
        target: points.map(p => p.demand)
      };

      // Add categorical features if available
      if (points[0].category && categoryMapping.has(points[0].category)) {
        record.cat = [categoryMapping.get(points[0].category)!];
      }

      // Add dynamic features (seasonality factors) if available
      const seasonalityFactors = points.map(p => p.seasonalityFactor || 1.0);
      if (seasonalityFactors.some(f => f !== 1.0)) {
        record.dynamic_feat = [seasonalityFactors];
      }

      records.push(record);
    }

    return records;
  }

  /**
   * Split data into training and validation sets
   */
  private splitTrainValidation(
    records: DeepARRecord[],
    trainRatio: number
  ): { trainingData: DeepARRecord[]; validationData: DeepARRecord[] } {
    const shuffled = [...records].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(shuffled.length * trainRatio);

    return {
      trainingData: shuffled.slice(0, splitIndex),
      validationData: shuffled.slice(splitIndex)
    };
  }

  /**
   * Generate dataset metadata
   */
  private generateMetadata(
    originalData: DemandDataPoint[],
    trainingData: DeepARRecord[],
    validationData: DeepARRecord[],
    categoryMapping: Map<string, number>
  ): DatasetMetadata {
    const timestamps = originalData.map(d => new Date(d.timestamp).getTime());
    const avgTimeSeriesLength = trainingData.reduce((sum, record) => sum + record.target.length, 0) / trainingData.length;

    return {
      totalRecords: originalData.length,
      trainingRecords: trainingData.length,
      validationRecords: validationData.length,
      timeSeriesLength: Math.round(avgTimeSeriesLength),
      categories: Array.from(categoryMapping.keys()),
      dateRange: {
        start: new Date(Math.min(...timestamps)).toISOString(),
        end: new Date(Math.max(...timestamps)).toISOString()
      }
    };
  }

  /**
   * Load and parse training data from S3
   */
  async loadTrainingDataFromS3(
    bucketName: string,
    key: string
  ): Promise<DeepARRecord[]> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    const response = await this.s3Client.send(command);
    const content = await response.Body!.transformToString();
    
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as DeepARRecord);
  }
}