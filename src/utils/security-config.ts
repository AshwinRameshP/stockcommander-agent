import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

export interface SecurityConfigProps {
  stackName: string;
  environment: string;
}

export class SecurityConfig {
  public readonly kmsKey: kms.Key;
  public readonly auditLogGroup: logs.LogGroup;
  public readonly cloudTrail: cloudtrail.Trail;
  public readonly dataEncryptionPolicy: iam.PolicyDocument;
  public readonly apiAuthPolicy: iam.PolicyDocument;

  constructor(scope: Construct, props: SecurityConfigProps) {
    // KMS Key for data encryption
    this.kmsKey = new kms.Key(scope, 'InventoryDataEncryptionKey', {
      alias: `${props.stackName}-data-encryption-key`,
      description: 'KMS key for encrypting sensitive inventory and invoice data',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'EnableRootAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'AllowLambdaAccess',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': [
                  `s3.${scope.node.tryGetContext('region') || 'us-east-1'}.amazonaws.com`,
                  `dynamodb.${scope.node.tryGetContext('region') || 'us-east-1'}.amazonaws.com`,
                ],
              },
            },
          }),
        ],
      }),
    });

    // CloudWatch Log Group for audit logging
    this.auditLogGroup = new logs.LogGroup(scope, 'AuditLogGroup', {
      logGroupName: `/aws/inventory-replenishment/${props.environment}/audit`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
    });

    // CloudTrail for API and data access auditing
    this.cloudTrail = new cloudtrail.Trail(scope, 'InventoryAuditTrail', {
      trailName: `${props.stackName}-audit-trail`,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      encryptionKey: this.kmsKey,
      cloudWatchLogGroup: this.auditLogGroup,
      eventSelectors: [
        {
          readWriteType: cloudtrail.ReadWriteType.ALL,
          includeManagementEvents: true,
          dataResources: [
            {
              type: 's3:object',
              values: ['arn:aws:s3:::*/*'],
            },
            {
              type: 'dynamodb:table',
              values: ['arn:aws:dynamodb:*:*:table/*'],
            },
          ],
        },
      ],
    });

    // Data encryption policy for Lambda functions
    this.dataEncryptionPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'KMSAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:GenerateDataKey',
            'kms:ReEncrypt*',
          ],
          resources: [this.kmsKey.keyArn],
        }),
        new iam.PolicyStatement({
          sid: 'AuditLogging',
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resources: [this.auditLogGroup.logGroupArn + ':*'],
        }),
      ],
    });

    // API authentication and authorization policy
    this.apiAuthPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'APIGatewayAccess',
          effect: iam.Effect.ALLOW,
          actions: [
            'execute-api:Invoke',
          ],
          resources: ['*'],
          conditions: {
            IpAddress: {
              'aws:SourceIp': [
                // Add your organization's IP ranges here
                '10.0.0.0/8',
                '172.16.0.0/12',
                '192.168.0.0/16',
              ],
            },
          },
        }),
        new iam.PolicyStatement({
          sid: 'DenyUnencryptedUploads',
          effect: iam.Effect.DENY,
          actions: ['s3:PutObject'],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'aws:kms',
            },
          },
        }),
      ],
    });
  }

  /**
   * Creates a secure IAM role for Lambda functions with minimal required permissions
   */
  public createSecureLambdaRole(
    scope: Construct,
    roleId: string,
    additionalPolicies?: iam.PolicyDocument[]
  ): iam.Role {
    const policies: { [key: string]: iam.PolicyDocument } = {
      DataEncryption: this.dataEncryptionPolicy,
    };

    if (additionalPolicies) {
      additionalPolicies.forEach((policy, index) => {
        policies[`AdditionalPolicy${index}`] = policy;
      });
    }

    return new iam.Role(scope, roleId, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: policies,
    });
  }

  /**
   * Creates security headers for API Gateway responses
   */
  public getSecurityHeaders(): { [key: string]: string } {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
  }
}