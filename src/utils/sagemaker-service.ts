import {
  SageMakerClient,
  CreateTrainingJobCommand,
  CreateModelCommand,
  CreateEndpointConfigCommand,
  CreateEndpointCommand,
  DescribeTrainingJobCommand,
  DescribeEndpointCommand,
  TrainingJobStatus,
  EndpointStatus,
  TrainingInstanceType,
  CompressionType
} from '@aws-sdk/client-sagemaker';
import { 
  SageMakerRuntimeClient,
  InvokeEndpointCommand 
} from '@aws-sdk/client-sagemaker-runtime';

export interface DemandForecastingConfig {
  trainingJobName: string;
  modelName: string;
  endpointConfigName: string;
  endpointName: string;
  roleArn: string;
  trainingImage: string;
  instanceType: TrainingInstanceType;
  instanceCount: number;
  volumeSizeInGB: number;
  maxRuntimeInSeconds: number;
}

export interface TrainingDataConfig {
  s3InputPath: string;
  s3OutputPath: string;
  contentType: string;
  compressionType?: CompressionType;
}

export interface ForecastRequest {
  partNumber: string;
  historicalData: Array<{
    timestamp: string;
    demand: number;
  }>;
  forecastHorizon: number;
}

export interface ForecastResponse {
  partNumber: string;
  predictions: Array<{
    timestamp: string;
    mean: number;
    p10: number;
    p50: number;
    p90: number;
  }>;
  confidence: number;
}

export class SageMakerService {
  private sagemakerClient: SageMakerClient;
  private runtimeClient: SageMakerRuntimeClient;

  constructor(region: string = 'us-east-1') {
    this.sagemakerClient = new SageMakerClient({ region });
    this.runtimeClient = new SageMakerRuntimeClient({ region });
  }

  /**
   * Create and start a DeepAR training job for demand forecasting
   */
  async createTrainingJob(
    config: DemandForecastingConfig,
    trainingData: TrainingDataConfig
  ): Promise<string> {
    const hyperParameters = {
      'time_freq': 'D', // Daily frequency
      'epochs': '100',
      'early_stopping_patience': '10',
      'mini_batch_size': '32',
      'learning_rate': '0.001',
      'context_length': '30', // 30 days of historical context
      'prediction_length': '14', // 14 days forecast
      'num_layers': '2',
      'num_cells': '40',
      'dropout_rate': '0.1'
    };

    const command = new CreateTrainingJobCommand({
      TrainingJobName: config.trainingJobName,
      RoleArn: config.roleArn,
      AlgorithmSpecification: {
        TrainingImage: config.trainingImage,
        TrainingInputMode: 'File'
      },
      InputDataConfig: [
        {
          ChannelName: 'training',
          DataSource: {
            S3DataSource: {
              S3DataType: 'S3Prefix',
              S3Uri: trainingData.s3InputPath,
              S3DataDistributionType: 'FullyReplicated'
            }
          },
          ContentType: trainingData.contentType,
          CompressionType: trainingData.compressionType || CompressionType.NONE
        }
      ],
      OutputDataConfig: {
        S3OutputPath: trainingData.s3OutputPath
      },
      ResourceConfig: {
        InstanceType: config.instanceType,
        InstanceCount: config.instanceCount,
        VolumeSizeInGB: config.volumeSizeInGB
      },
      StoppingCondition: {
        MaxRuntimeInSeconds: config.maxRuntimeInSeconds
      },
      HyperParameters: hyperParameters
    });

    const response = await this.sagemakerClient.send(command);
    return response.TrainingJobArn!;
  }

  /**
   * Monitor training job status
   */
  async getTrainingJobStatus(trainingJobName: string): Promise<TrainingJobStatus> {
    const command = new DescribeTrainingJobCommand({
      TrainingJobName: trainingJobName
    });

    const response = await this.sagemakerClient.send(command);
    return response.TrainingJobStatus!;
  }

  /**
   * Create a model from completed training job
   */
  async createModel(
    config: DemandForecastingConfig,
    modelArtifactsS3Path: string
  ): Promise<string> {
    const command = new CreateModelCommand({
      ModelName: config.modelName,
      ExecutionRoleArn: config.roleArn,
      PrimaryContainer: {
        Image: config.trainingImage,
        ModelDataUrl: modelArtifactsS3Path,
        Environment: {
          'SAGEMAKER_PROGRAM': 'inference.py',
          'SAGEMAKER_SUBMIT_DIRECTORY': '/opt/ml/code'
        }
      }
    });

    const response = await this.sagemakerClient.send(command);
    return response.ModelArn!;
  }

  /**
   * Create endpoint configuration
   */
  async createEndpointConfig(config: DemandForecastingConfig): Promise<string> {
    const command = new CreateEndpointConfigCommand({
      EndpointConfigName: config.endpointConfigName,
      ProductionVariants: [
        {
          VariantName: 'primary',
          ModelName: config.modelName,
          InitialInstanceCount: 1,
          InstanceType: 'ml.t2.medium',
          InitialVariantWeight: 1.0
        }
      ]
    });

    const response = await this.sagemakerClient.send(command);
    return response.EndpointConfigArn!;
  }

  /**
   * Create and deploy endpoint
   */
  async createEndpoint(config: DemandForecastingConfig): Promise<string> {
    const command = new CreateEndpointCommand({
      EndpointName: config.endpointName,
      EndpointConfigName: config.endpointConfigName
    });

    const response = await this.sagemakerClient.send(command);
    return response.EndpointArn!;
  }

  /**
   * Check endpoint status
   */
  async getEndpointStatus(endpointName: string): Promise<EndpointStatus> {
    const command = new DescribeEndpointCommand({
      EndpointName: endpointName
    });

    const response = await this.sagemakerClient.send(command);
    return response.EndpointStatus!;
  }

  /**
   * Generate demand forecast using deployed endpoint
   */
  async generateForecast(
    endpointName: string,
    request: ForecastRequest
  ): Promise<ForecastResponse> {
    // Prepare input data in DeepAR format
    const inputData = {
      instances: [
        {
          start: request.historicalData[0].timestamp,
          target: request.historicalData.map(d => d.demand)
        }
      ],
      configuration: {
        num_samples: 100,
        output_types: ['mean', 'quantiles'],
        quantiles: ['0.1', '0.5', '0.9']
      }
    };

    const command = new InvokeEndpointCommand({
      EndpointName: endpointName,
      ContentType: 'application/json',
      Body: JSON.stringify(inputData)
    });

    const response = await this.runtimeClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Body as Uint8Array));

    // Transform response to our format
    const predictions = result.predictions[0];
    const forecastData: ForecastResponse['predictions'] = [];

    for (let i = 0; i < request.forecastHorizon; i++) {
      const timestamp = new Date(request.historicalData[request.historicalData.length - 1].timestamp);
      timestamp.setDate(timestamp.getDate() + i + 1);

      forecastData.push({
        timestamp: timestamp.toISOString(),
        mean: predictions.mean[i],
        p10: predictions.quantiles['0.1'][i],
        p50: predictions.quantiles['0.5'][i],
        p90: predictions.quantiles['0.9'][i]
      });
    }

    return {
      partNumber: request.partNumber,
      predictions: forecastData,
      confidence: this.calculateConfidence(predictions)
    };
  }

  /**
   * Calculate confidence score based on prediction intervals
   */
  private calculateConfidence(predictions: any): number {
    const intervals = predictions.quantiles['0.9'].map((upper: number, i: number) => 
      upper - predictions.quantiles['0.1'][i]
    );
    
    const avgInterval = intervals.reduce((sum: number, interval: number) => sum + interval, 0) / intervals.length;
    const avgMean = predictions.mean.reduce((sum: number, val: number) => sum + val, 0) / predictions.mean.length;
    
    // Confidence inversely related to interval width relative to mean
    return Math.max(0, Math.min(1, 1 - (avgInterval / avgMean)));
  }

  /**
   * Wait for training job completion
   */
  async waitForTrainingCompletion(
    trainingJobName: string,
    maxWaitTimeMinutes: number = 60
  ): Promise<boolean> {
    const maxAttempts = maxWaitTimeMinutes * 2; // Check every 30 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getTrainingJobStatus(trainingJobName);
      
      if (status === 'Completed') {
        return true;
      } else if (status === 'Failed' || status === 'Stopped') {
        throw new Error(`Training job failed with status: ${status}`);
      }

      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      attempts++;
    }

    throw new Error(`Training job did not complete within ${maxWaitTimeMinutes} minutes`);
  }

  /**
   * Wait for endpoint deployment
   */
  async waitForEndpointDeployment(
    endpointName: string,
    maxWaitTimeMinutes: number = 30
  ): Promise<boolean> {
    const maxAttempts = maxWaitTimeMinutes * 2; // Check every 30 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.getEndpointStatus(endpointName);
      
      if (status === 'InService') {
        return true;
      } else if (status === 'Failed') {
        throw new Error('Endpoint deployment failed');
      }

      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      attempts++;
    }

    throw new Error(`Endpoint did not deploy within ${maxWaitTimeMinutes} minutes`);
  }
}