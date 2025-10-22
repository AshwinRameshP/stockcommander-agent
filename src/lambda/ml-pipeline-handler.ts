import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SageMakerService, DemandForecastingConfig, ForecastRequest } from '../utils/sagemaker-service';
import { MLDataPreprocessor, DemandDataPoint } from '../utils/ml-data-preprocessor';
import { DataStorageService } from '../utils/data-storage-service';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

interface TrainingJobRequest {
  partNumbers?: string[];
  trainingConfig?: Partial<DemandForecastingConfig>;
  preprocessingOptions?: {
    minTimeSeriesLength: number;
    trainValidationSplit: number;
    aggregationPeriod: 'daily' | 'weekly' | 'monthly';
  };
}

interface ForecastJobRequest {
  endpointName: string;
  requests: ForecastRequest[];
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const path = event.path;
    const method = event.httpMethod;

    // Initialize services
    const sagemakerService = new SageMakerService();
    const dataPreprocessor = new MLDataPreprocessor();
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const dataStorage = new DataStorageService(dynamoClient);

    switch (`${method} ${path}`) {
      case 'POST /ml/training/start':
        return await startTrainingJob(event, sagemakerService, dataPreprocessor, dataStorage);
      
      case 'GET /ml/training/status':
        return await getTrainingJobStatus(event, sagemakerService);
      
      case 'POST /ml/model/deploy':
        return await deployModel(event, sagemakerService);
      
      case 'POST /ml/forecast':
        return await generateForecast(event, sagemakerService);
      
      case 'GET /ml/endpoints':
        return await listEndpoints(event, sagemakerService);

      default:
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('ML Pipeline Handler Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

/**
 * Start a new training job
 */
async function startTrainingJob(
  event: APIGatewayProxyEvent,
  sagemakerService: SageMakerService,
  dataPreprocessor: MLDataPreprocessor,
  dataStorage: DataStorageService
): Promise<APIGatewayProxyResult> {
  const request: TrainingJobRequest = JSON.parse(event.body || '{}');
  
  // Default configuration
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultConfig: DemandForecastingConfig = {
    trainingJobName: `demand-forecasting-${timestamp}`,
    modelName: `demand-model-${timestamp}`,
    endpointConfigName: `demand-endpoint-config-${timestamp}`,
    endpointName: `demand-endpoint-${timestamp}`,
    roleArn: process.env.SAGEMAKER_EXECUTION_ROLE_ARN!,
    trainingImage: '522234722520.dkr.ecr.us-east-1.amazonaws.com/forecasting-deepar:latest',
    instanceType: 'ml.m5.large' as any,
    instanceCount: 1,
    volumeSizeInGB: 30,
    maxRuntimeInSeconds: 3600
  };

  const config = { ...defaultConfig, ...request.trainingConfig };
  
  // Default preprocessing options
  const preprocessingOptions = {
    minTimeSeriesLength: 30,
    trainValidationSplit: 0.8,
    aggregationPeriod: 'daily' as const,
    ...request.preprocessingOptions
  };

  try {
    // 1. Retrieve demand data from storage
    console.log('Retrieving demand data...');
    const demandData = await retrieveDemandData(dataStorage, request.partNumbers);
    
    if (demandData.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'No demand data found for training',
          partNumbers: request.partNumbers
        })
      };
    }

    // 2. Preprocess data for ML training
    console.log(`Preprocessing ${demandData.length} demand data points...`);
    const preprocessedDataset = await dataPreprocessor.preprocessDemandData(
      demandData,
      preprocessingOptions
    );

    // 3. Upload training data to S3
    console.log('Uploading training data to S3...');
    const bucketName = process.env.ML_DATA_BUCKET_NAME!;
    const keyPrefix = `training-data/${config.trainingJobName}`;
    
    const s3Uris = await dataPreprocessor.uploadTrainingData(
      bucketName,
      keyPrefix,
      preprocessedDataset
    );

    // 4. Start SageMaker training job
    console.log('Starting SageMaker training job...');
    const trainingJobArn = await sagemakerService.createTrainingJob(config, {
      s3InputPath: s3Uris.trainingDataS3Uri,
      s3OutputPath: `s3://${bucketName}/model-artifacts/${config.trainingJobName}`,
      contentType: 'application/jsonlines'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        trainingJobArn,
        trainingJobName: config.trainingJobName,
        modelName: config.modelName,
        datasetMetadata: preprocessedDataset.metadata,
        s3Uris
      })
    };

  } catch (error) {
    console.error('Training job start failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to start training job',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Get training job status
 */
async function getTrainingJobStatus(
  event: APIGatewayProxyEvent,
  sagemakerService: SageMakerService
): Promise<APIGatewayProxyResult> {
  const trainingJobName = event.queryStringParameters?.trainingJobName;
  
  if (!trainingJobName) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'trainingJobName parameter is required' })
    };
  }

  try {
    const status = await sagemakerService.getTrainingJobStatus(trainingJobName);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        trainingJobName,
        status,
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('Failed to get training job status:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to get training job status',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Deploy trained model to endpoint
 */
async function deployModel(
  event: APIGatewayProxyEvent,
  sagemakerService: SageMakerService
): Promise<APIGatewayProxyResult> {
  const { trainingJobName, modelArtifactsS3Path } = JSON.parse(event.body || '{}');
  
  if (!trainingJobName || !modelArtifactsS3Path) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'trainingJobName and modelArtifactsS3Path are required' 
      })
    };
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const config: DemandForecastingConfig = {
      trainingJobName,
      modelName: `demand-model-${timestamp}`,
      endpointConfigName: `demand-endpoint-config-${timestamp}`,
      endpointName: `demand-endpoint-${timestamp}`,
      roleArn: process.env.SAGEMAKER_EXECUTION_ROLE_ARN!,
      trainingImage: '522234722520.dkr.ecr.us-east-1.amazonaws.com/forecasting-deepar:latest',
      instanceType: 'ml.m5.large' as any,
      instanceCount: 1,
      volumeSizeInGB: 30,
      maxRuntimeInSeconds: 3600
    };

    // 1. Create model
    console.log('Creating SageMaker model...');
    const modelArn = await sagemakerService.createModel(config, modelArtifactsS3Path);

    // 2. Create endpoint configuration
    console.log('Creating endpoint configuration...');
    const endpointConfigArn = await sagemakerService.createEndpointConfig(config);

    // 3. Create and deploy endpoint
    console.log('Deploying endpoint...');
    const endpointArn = await sagemakerService.createEndpoint(config);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        modelArn,
        endpointConfigArn,
        endpointArn,
        endpointName: config.endpointName,
        status: 'Creating'
      })
    };

  } catch (error) {
    console.error('Model deployment failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to deploy model',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * Generate demand forecast using deployed endpoint
 */
async function generateForecast(
  event: APIGatewayProxyEvent,
  sagemakerService: SageMakerService
): Promise<APIGatewayProxyResult> {
  const request: ForecastJobRequest = JSON.parse(event.body || '{}');
  
  if (!request.endpointName || !request.requests || request.requests.length === 0) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'endpointName and requests array are required' 
      })
    };
  }

  try {
    const forecasts = [];
    
    for (const forecastRequest of request.requests) {
      console.log(`Generating forecast for part: ${forecastRequest.partNumber}`);
      const forecast = await sagemakerService.generateForecast(
        request.endpointName,
        forecastRequest
      );
      forecasts.push(forecast);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        endpointName: request.endpointName,
        forecasts,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Forecast generation failed:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Failed to generate forecast',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

/**
 * List available endpoints
 */
async function listEndpoints(
  event: APIGatewayProxyEvent,
  sagemakerService: SageMakerService
): Promise<APIGatewayProxyResult> {
  // This is a simplified implementation - in practice you'd want to list all endpoints
  // For now, return a placeholder response
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      endpoints: [],
      message: 'Endpoint listing not yet implemented'
    })
  };
}

/**
 * Retrieve demand data from storage
 */
async function retrieveDemandData(
  dataStorage: DataStorageService,
  partNumbers?: string[]
): Promise<DemandDataPoint[]> {
  try {
    // Query normalized invoice data for sales invoices
    const queryOptions = {
      invoiceType: 'sales' as const,
      limit: 10000 // Adjust based on needs
    };

    const result = await dataStorage.queryNormalizedData(queryOptions);
    const demandData: DemandDataPoint[] = [];

    for (const item of result.items) {
      // Filter by part numbers if specified
      if (partNumbers && !partNumbers.includes(item.partNumber)) {
        continue;
      }

      demandData.push({
        partNumber: item.partNumber,
        timestamp: item.invoiceDate,
        demand: item.quantity,
        category: item.category || 'unknown'
      });
    }

    return demandData;
  } catch (error) {
    console.error('Failed to retrieve demand data:', error);
    throw new Error('Failed to retrieve demand data from storage');
  }
}