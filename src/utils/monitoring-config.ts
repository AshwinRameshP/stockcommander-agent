import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as xray from 'aws-cdk-lib/aws-xray';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface MonitoringConfigProps {
  stackName: string;
  environment: string;
  alertingTopic: sns.Topic;
}

export class MonitoringConfig {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alarmTopic: sns.Topic;
  public readonly logGroups: logs.LogGroup[];

  constructor(scope: Construct, props: MonitoringConfigProps) {
    this.alarmTopic = props.alertingTopic;
    this.logGroups = [];

    // Create main CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(scope, 'InventoryMonitoringDashboard', {
      dashboardName: `${props.stackName}-${props.environment}-monitoring`,
    });

    // Create log groups for different components
    this.createLogGroups(scope, props);

    // Set up X-Ray tracing
    this.setupXRayTracing(scope, props);
  }

  /**
   * Creates CloudWatch log groups for different components
   */
  private createLogGroups(scope: Construct, props: MonitoringConfigProps): void {
    const logGroupConfigs = [
      { name: 'api-gateway', retention: logs.RetentionDays.ONE_MONTH },
      { name: 'lambda-functions', retention: logs.RetentionDays.TWO_WEEKS },
      { name: 'ml-pipeline', retention: logs.RetentionDays.THREE_MONTHS },
      { name: 'ai-reasoning', retention: logs.RetentionDays.ONE_MONTH },
      { name: 'data-processing', retention: logs.RetentionDays.TWO_WEEKS },
      { name: 'notifications', retention: logs.RetentionDays.ONE_WEEK },
      { name: 'performance-metrics', retention: logs.RetentionDays.ONE_MONTH },
      { name: 'cost-metrics', retention: logs.RetentionDays.THREE_MONTHS },
    ];

    logGroupConfigs.forEach(config => {
      const logGroup = new logs.LogGroup(scope, `${config.name}LogGroup`, {
        logGroupName: `/aws/inventory-replenishment/${props.environment}/${config.name}`,
        retention: config.retention,
      });
      this.logGroups.push(logGroup);
    });
  }

  /**
   * Sets up X-Ray tracing configuration
   */
  private setupXRayTracing(scope: Construct, props: MonitoringConfigProps): void {
    // X-Ray service map will be automatically created when Lambda functions have tracing enabled
    // This is configured in the Lambda function creation
  }

  /**
   * Adds Lambda function monitoring
   */
  public addLambdaMonitoring(
    scope: Construct,
    functionName: string,
    lambdaFunction: lambda.Function
  ): void {
    // Enable X-Ray tracing
    lambdaFunction.addEnvironment('_X_AMZN_TRACE_ID', '');

    // Create custom metrics
    const errorMetric = lambdaFunction.metricErrors({
      period: cdk.Duration.minutes(5),
    });

    const durationMetric = lambdaFunction.metricDuration({
      period: cdk.Duration.minutes(5),
    });

    const throttleMetric = lambdaFunction.metricThrottles({
      period: cdk.Duration.minutes(5),
    });

    // Create alarms
    const errorAlarm = new cloudwatch.Alarm(scope, `${functionName}ErrorAlarm`, {
      metric: errorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High error rate for ${functionName}`,
    });

    const durationAlarm = new cloudwatch.Alarm(scope, `${functionName}DurationAlarm`, {
      metric: durationMetric,
      threshold: 30000, // 30 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High duration for ${functionName}`,
    });

    const throttleAlarm = new cloudwatch.Alarm(scope, `${functionName}ThrottleAlarm`, {
      metric: throttleMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Throttling detected for ${functionName}`,
    });

    // Add alarm actions
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    throttleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Add to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${functionName} - Errors and Duration`,
        left: [errorMetric],
        right: [durationMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: `${functionName} - Throttles`,
        metrics: [throttleMetric],
        width: 6,
        height: 6,
      })
    );
  }

  /**
   * Adds DynamoDB table monitoring
   */
  public addDynamoDBMonitoring(
    scope: Construct,
    tableName: string,
    table: dynamodb.Table
  ): void {
    // Create custom metrics
    const readThrottleMetric = table.metricUserErrors({
      period: cdk.Duration.minutes(5),
    });

    const writeThrottleMetric = table.metricSystemErrors({
      period: cdk.Duration.minutes(5),
    });

    const consumedReadCapacityMetric = table.metricConsumedReadCapacityUnits({
      period: cdk.Duration.minutes(5),
    });

    const consumedWriteCapacityMetric = table.metricConsumedWriteCapacityUnits({
      period: cdk.Duration.minutes(5),
    });

    // Create alarms
    const readThrottleAlarm = new cloudwatch.Alarm(scope, `${tableName}ReadThrottleAlarm`, {
      metric: readThrottleMetric,
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Read throttling detected for ${tableName}`,
    });

    const writeThrottleAlarm = new cloudwatch.Alarm(scope, `${tableName}WriteThrottleAlarm`, {
      metric: writeThrottleMetric,
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Write throttling detected for ${tableName}`,
    });

    // Add alarm actions
    readThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    writeThrottleAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Add to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${tableName} - Capacity Consumption`,
        left: [consumedReadCapacityMetric],
        right: [consumedWriteCapacityMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: `${tableName} - Throttles`,
        left: [readThrottleMetric, writeThrottleMetric],
        width: 12,
        height: 6,
      })
    );
  }

  /**
   * Adds S3 bucket monitoring
   */
  public addS3Monitoring(
    scope: Construct,
    bucketName: string,
    bucket: s3.Bucket
  ): void {
    // Create custom metrics for S3
    const bucketSizeMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: bucket.bucketName,
        StorageType: 'StandardStorage',
      },
      period: cdk.Duration.days(1),
      statistic: 'Average',
    });

    const numberOfObjectsMetric = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'NumberOfObjects',
      dimensionsMap: {
        BucketName: bucket.bucketName,
        StorageType: 'AllStorageTypes',
      },
      period: cdk.Duration.days(1),
      statistic: 'Average',
    });

    // Add to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${bucketName} - Storage Metrics`,
        left: [bucketSizeMetric],
        right: [numberOfObjectsMetric],
        width: 12,
        height: 6,
      })
    );
  }

  /**
   * Adds API Gateway monitoring
   */
  public addAPIGatewayMonitoring(
    scope: Construct,
    apiName: string,
    api: any // apigateway.RestApi
  ): void {
    // Create custom metrics
    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Count',
      dimensionsMap: {
        ApiName: apiName,
      },
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    const latencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: apiName,
      },
      period: cdk.Duration.minutes(5),
      statistic: 'Average',
    });

    const errorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: apiName,
      },
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    const serverErrorMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: apiName,
      },
      period: cdk.Duration.minutes(5),
      statistic: 'Sum',
    });

    // Create alarms
    const highLatencyAlarm = new cloudwatch.Alarm(scope, `${apiName}HighLatencyAlarm`, {
      metric: latencyMetric,
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High latency detected for ${apiName}`,
    });

    const serverErrorAlarm = new cloudwatch.Alarm(scope, `${apiName}ServerErrorAlarm`, {
      metric: serverErrorMetric,
      threshold: 5,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Server errors detected for ${apiName}`,
    });

    // Add alarm actions
    highLatencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));
    serverErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Add to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `${apiName} - Request Metrics`,
        left: [requestCountMetric],
        right: [latencyMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: `${apiName} - Error Metrics`,
        left: [errorMetric, serverErrorMetric],
        width: 12,
        height: 6,
      })
    );
  }

  /**
   * Adds cost monitoring
   */
  public addCostMonitoring(scope: Construct, stackName: string): void {
    // Create cost metrics (these would typically be created via AWS Cost Explorer API)
    const estimatedChargesMetric = new cloudwatch.Metric({
      namespace: 'AWS/Billing',
      metricName: 'EstimatedCharges',
      dimensionsMap: {
        Currency: 'USD',
      },
      period: cdk.Duration.days(1),
      statistic: 'Maximum',
    });

    // Create cost alarm
    const costAlarm = new cloudwatch.Alarm(scope, 'HighCostAlarm', {
      metric: estimatedChargesMetric,
      threshold: 100, // $100 per day
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High AWS costs detected',
    });

    costAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

    // Add to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'Estimated Daily Charges',
        metrics: [estimatedChargesMetric],
        width: 6,
        height: 6,
      })
    );
  }

  /**
   * Creates a comprehensive system health widget
   */
  public addSystemHealthWidget(): void {
    // This would include overall system health metrics
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `
# Inventory Replenishment System Health

## Key Metrics
- **System Uptime**: Monitor overall system availability
- **Processing Latency**: Track end-to-end processing times
- **Error Rates**: Monitor system-wide error rates
- **Cost Efficiency**: Track cost per processed invoice

## Alert Thresholds
- Lambda errors > 5 in 10 minutes
- API latency > 5 seconds
- DynamoDB throttling detected
- Daily costs > $100
        `,
        width: 24,
        height: 8,
      })
    );
  }
}