"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const assertions_1 = require("aws-cdk-lib/assertions");
const inventory_replenishment_stack_1 = require("../src/stacks/inventory-replenishment-stack");
describe('InventoryReplenishmentStack', () => {
    let template;
    beforeAll(() => {
        const app = new cdk.App();
        const stack = new inventory_replenishment_stack_1.InventoryReplenishmentStack(app, 'TestStack');
        template = assertions_1.Template.fromStack(stack);
    });
    test('should create S3 buckets for invoice and processed data storage', () => {
        template.hasResourceProperties('AWS::S3::Bucket', {
            BucketEncryption: {
                ServerSideEncryptionConfiguration: [{
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }]
            },
            PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                BlockPublicPolicy: true,
                IgnorePublicAcls: true,
                RestrictPublicBuckets: true
            }
        });
    });
    test('should create DynamoDB tables with encryption', () => {
        template.hasResourceProperties('AWS::DynamoDB::Table', {
            BillingMode: 'PAY_PER_REQUEST',
            SSESpecification: {
                SSEEnabled: true
            }
        });
    });
    test('should create Lambda functions with proper configuration', () => {
        template.hasResourceProperties('AWS::Lambda::Function', {
            Runtime: 'nodejs18.x',
            Timeout: 900 // 15 minutes
        });
    });
    test('should create API Gateway with CORS configuration', () => {
        template.hasResourceProperties('AWS::ApiGateway::RestApi', {
            Name: 'Inventory Replenishment API'
        });
    });
    test('should create SNS topic for notifications', () => {
        template.hasResourceProperties('AWS::SNS::Topic', {
            TopicName: 'inventory-alerts'
        });
    });
    test('should create SQS queue for message processing', () => {
        template.hasResourceProperties('AWS::SQS::Queue', {
            QueueName: 'inventory-processing-queue'
        });
    });
    test('should create EventBridge event bus', () => {
        template.hasResourceProperties('AWS::Events::EventBus', {
            Name: 'inventory-replenishment-events'
        });
    });
    test('should create IAM role with Bedrock permissions', () => {
        template.hasResourceProperties('AWS::IAM::Role', {
            AssumeRolePolicyDocument: {
                Statement: [{
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com'
                        },
                        Action: 'sts:AssumeRole'
                    }]
            }
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52ZW50b3J5LXJlcGxlbmlzaG1lbnQtc3RhY2sudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludmVudG9yeS1yZXBsZW5pc2htZW50LXN0YWNrLnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBa0Q7QUFDbEQsK0ZBQTBGO0FBRTFGLFFBQVEsQ0FBQyw2QkFBNkIsRUFBRSxHQUFHLEVBQUU7SUFDM0MsSUFBSSxRQUFrQixDQUFDO0lBRXZCLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMxQixNQUFNLEtBQUssR0FBRyxJQUFJLDJEQUEyQixDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNoRSxRQUFRLEdBQUcscUJBQVEsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsaUVBQWlFLEVBQUUsR0FBRyxFQUFFO1FBQzNFLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxpQkFBaUIsRUFBRTtZQUNoRCxnQkFBZ0IsRUFBRTtnQkFDaEIsaUNBQWlDLEVBQUUsQ0FBQzt3QkFDbEMsNkJBQTZCLEVBQUU7NEJBQzdCLFlBQVksRUFBRSxRQUFRO3lCQUN2QjtxQkFDRixDQUFDO2FBQ0g7WUFDRCw4QkFBOEIsRUFBRTtnQkFDOUIsZUFBZSxFQUFFLElBQUk7Z0JBQ3JCLGlCQUFpQixFQUFFLElBQUk7Z0JBQ3ZCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLHFCQUFxQixFQUFFLElBQUk7YUFDNUI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQywrQ0FBK0MsRUFBRSxHQUFHLEVBQUU7UUFDekQsUUFBUSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixFQUFFO1lBQ3JELFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRSxJQUFJO2FBQ2pCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsMERBQTBELEVBQUUsR0FBRyxFQUFFO1FBQ3BFLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtZQUN0RCxPQUFPLEVBQUUsWUFBWTtZQUNyQixPQUFPLEVBQUUsR0FBRyxDQUFDLGFBQWE7U0FDM0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsbURBQW1ELEVBQUUsR0FBRyxFQUFFO1FBQzdELFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQywwQkFBMEIsRUFBRTtZQUN6RCxJQUFJLEVBQUUsNkJBQTZCO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtRQUNyRCxRQUFRLENBQUMscUJBQXFCLENBQUMsaUJBQWlCLEVBQUU7WUFDaEQsU0FBUyxFQUFFLGtCQUFrQjtTQUM5QixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxnREFBZ0QsRUFBRSxHQUFHLEVBQUU7UUFDMUQsUUFBUSxDQUFDLHFCQUFxQixDQUFDLGlCQUFpQixFQUFFO1lBQ2hELFNBQVMsRUFBRSw0QkFBNEI7U0FDeEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO1FBQy9DLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyx1QkFBdUIsRUFBRTtZQUN0RCxJQUFJLEVBQUUsZ0NBQWdDO1NBQ3ZDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLGlEQUFpRCxFQUFFLEdBQUcsRUFBRTtRQUMzRCxRQUFRLENBQUMscUJBQXFCLENBQUMsZ0JBQWdCLEVBQUU7WUFDL0Msd0JBQXdCLEVBQUU7Z0JBQ3hCLFNBQVMsRUFBRSxDQUFDO3dCQUNWLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsc0JBQXNCO3lCQUNoQzt3QkFDRCxNQUFNLEVBQUUsZ0JBQWdCO3FCQUN6QixDQUFDO2FBQ0g7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgVGVtcGxhdGUgfSBmcm9tICdhd3MtY2RrLWxpYi9hc3NlcnRpb25zJztcclxuaW1wb3J0IHsgSW52ZW50b3J5UmVwbGVuaXNobWVudFN0YWNrIH0gZnJvbSAnLi4vc3JjL3N0YWNrcy9pbnZlbnRvcnktcmVwbGVuaXNobWVudC1zdGFjayc7XHJcblxyXG5kZXNjcmliZSgnSW52ZW50b3J5UmVwbGVuaXNobWVudFN0YWNrJywgKCkgPT4ge1xyXG4gIGxldCB0ZW1wbGF0ZTogVGVtcGxhdGU7XHJcblxyXG4gIGJlZm9yZUFsbCgoKSA9PiB7XHJcbiAgICBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xyXG4gICAgY29uc3Qgc3RhY2sgPSBuZXcgSW52ZW50b3J5UmVwbGVuaXNobWVudFN0YWNrKGFwcCwgJ1Rlc3RTdGFjaycpO1xyXG4gICAgdGVtcGxhdGUgPSBUZW1wbGF0ZS5mcm9tU3RhY2soc3RhY2spO1xyXG4gIH0pO1xyXG5cclxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIFMzIGJ1Y2tldHMgZm9yIGludm9pY2UgYW5kIHByb2Nlc3NlZCBkYXRhIHN0b3JhZ2UnLCAoKSA9PiB7XHJcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6UzM6OkJ1Y2tldCcsIHtcclxuICAgICAgQnVja2V0RW5jcnlwdGlvbjoge1xyXG4gICAgICAgIFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbjogW3tcclxuICAgICAgICAgIFNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XHJcbiAgICAgICAgICAgIFNTRUFsZ29yaXRobTogJ0FFUzI1NidcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XVxyXG4gICAgICB9LFxyXG4gICAgICBQdWJsaWNBY2Nlc3NCbG9ja0NvbmZpZ3VyYXRpb246IHtcclxuICAgICAgICBCbG9ja1B1YmxpY0FjbHM6IHRydWUsXHJcbiAgICAgICAgQmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXHJcbiAgICAgICAgSWdub3JlUHVibGljQWNsczogdHJ1ZSxcclxuICAgICAgICBSZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgRHluYW1vREIgdGFibGVzIHdpdGggZW5jcnlwdGlvbicsICgpID0+IHtcclxuICAgIHRlbXBsYXRlLmhhc1Jlc291cmNlUHJvcGVydGllcygnQVdTOjpEeW5hbW9EQjo6VGFibGUnLCB7XHJcbiAgICAgIEJpbGxpbmdNb2RlOiAnUEFZX1BFUl9SRVFVRVNUJyxcclxuICAgICAgU1NFU3BlY2lmaWNhdGlvbjoge1xyXG4gICAgICAgIFNTRUVuYWJsZWQ6IHRydWVcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgTGFtYmRhIGZ1bmN0aW9ucyB3aXRoIHByb3BlciBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xyXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkxhbWJkYTo6RnVuY3Rpb24nLCB7XHJcbiAgICAgIFJ1bnRpbWU6ICdub2RlanMxOC54JyxcclxuICAgICAgVGltZW91dDogOTAwIC8vIDE1IG1pbnV0ZXNcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIEFQSSBHYXRld2F5IHdpdGggQ09SUyBjb25maWd1cmF0aW9uJywgKCkgPT4ge1xyXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkFwaUdhdGV3YXk6OlJlc3RBcGknLCB7XHJcbiAgICAgIE5hbWU6ICdJbnZlbnRvcnkgUmVwbGVuaXNobWVudCBBUEknXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBTTlMgdG9waWMgZm9yIG5vdGlmaWNhdGlvbnMnLCAoKSA9PiB7XHJcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6U05TOjpUb3BpYycsIHtcclxuICAgICAgVG9waWNOYW1lOiAnaW52ZW50b3J5LWFsZXJ0cydcclxuICAgIH0pO1xyXG4gIH0pO1xyXG5cclxuICB0ZXN0KCdzaG91bGQgY3JlYXRlIFNRUyBxdWV1ZSBmb3IgbWVzc2FnZSBwcm9jZXNzaW5nJywgKCkgPT4ge1xyXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OlNRUzo6UXVldWUnLCB7XHJcbiAgICAgIFF1ZXVlTmFtZTogJ2ludmVudG9yeS1wcm9jZXNzaW5nLXF1ZXVlJ1xyXG4gICAgfSk7XHJcbiAgfSk7XHJcblxyXG4gIHRlc3QoJ3Nob3VsZCBjcmVhdGUgRXZlbnRCcmlkZ2UgZXZlbnQgYnVzJywgKCkgPT4ge1xyXG4gICAgdGVtcGxhdGUuaGFzUmVzb3VyY2VQcm9wZXJ0aWVzKCdBV1M6OkV2ZW50czo6RXZlbnRCdXMnLCB7XHJcbiAgICAgIE5hbWU6ICdpbnZlbnRvcnktcmVwbGVuaXNobWVudC1ldmVudHMnXHJcbiAgICB9KTtcclxuICB9KTtcclxuXHJcbiAgdGVzdCgnc2hvdWxkIGNyZWF0ZSBJQU0gcm9sZSB3aXRoIEJlZHJvY2sgcGVybWlzc2lvbnMnLCAoKSA9PiB7XHJcbiAgICB0ZW1wbGF0ZS5oYXNSZXNvdXJjZVByb3BlcnRpZXMoJ0FXUzo6SUFNOjpSb2xlJywge1xyXG4gICAgICBBc3N1bWVSb2xlUG9saWN5RG9jdW1lbnQ6IHtcclxuICAgICAgICBTdGF0ZW1lbnQ6IFt7XHJcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXHJcbiAgICAgICAgICBQcmluY2lwYWw6IHtcclxuICAgICAgICAgICAgU2VydmljZTogJ2xhbWJkYS5hbWF6b25hd3MuY29tJ1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJ1xyXG4gICAgICAgIH1dXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH0pO1xyXG59KTsiXX0=