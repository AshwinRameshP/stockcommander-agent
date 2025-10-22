#!/bin/bash

# Deployment script for Inventory Replenishment System
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

# Default values
ENVIRONMENT="dev"
SKIP_TESTS=false
SKIP_BUILD=false
DRY_RUN=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [options]"
    echo ""
    echo "Environments:"
    echo "  dev         Deploy to development environment"
    echo "  staging     Deploy to staging environment"
    echo "  production  Deploy to production environment"
    echo ""
    echo "Options:"
    echo "  --skip-tests    Skip running tests"
    echo "  --skip-build    Skip building frontend"
    echo "  --dry-run       Show what would be deployed without actually deploying"
    echo "  --verbose       Enable verbose output"
    echo "  --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev"
    echo "  $0 staging --skip-tests"
    echo "  $0 production --dry-run"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|staging|production)
            ENVIRONMENT="$1"
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    show_usage
    exit 1
fi

print_status "Starting deployment to $ENVIRONMENT environment"

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check if CDK is installed
    if ! command -v cdk &> /dev/null; then
        print_error "AWS CDK is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    if [[ "$VERBOSE" == "true" ]]; then
        npm ci
        cd frontend && npm ci && cd ..
    else
        npm ci > /dev/null 2>&1
        cd frontend && npm ci > /dev/null 2>&1 && cd ..
    fi
    
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests"
        return
    fi
    
    print_status "Running tests..."
    
    # Run backend tests
    if [[ "$VERBOSE" == "true" ]]; then
        npm test -- --watchAll=false
    else
        npm test -- --watchAll=false > /dev/null 2>&1
    fi
    
    # Run frontend tests
    cd frontend
    if [[ "$VERBOSE" == "true" ]]; then
        npm test -- --watchAll=false
    else
        npm test -- --watchAll=false > /dev/null 2>&1
    fi
    cd ..
    
    print_success "Tests passed"
}

# Build frontend
build_frontend() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping frontend build"
        return
    fi
    
    print_status "Building frontend for $ENVIRONMENT..."
    
    cd frontend
    if [[ "$ENVIRONMENT" == "production" ]]; then
        BUILD_COMMAND="build:production"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        BUILD_COMMAND="build:staging"
    else
        BUILD_COMMAND="build"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        npm run $BUILD_COMMAND
    else
        npm run $BUILD_COMMAND > /dev/null 2>&1
    fi
    cd ..
    
    print_success "Frontend built successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure to $ENVIRONMENT..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run - showing CDK diff..."
        cdk diff --context environment=$ENVIRONMENT
        return
    fi
    
    # Bootstrap CDK if needed
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_status "Bootstrapping CDK for production..."
        cdk bootstrap --context environment=$ENVIRONMENT
    fi
    
    # Deploy with appropriate options
    CDK_OPTIONS="--context environment=$ENVIRONMENT"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        CDK_OPTIONS="$CDK_OPTIONS --require-approval never"
    else
        CDK_OPTIONS="$CDK_OPTIONS --require-approval never"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        cdk deploy $CDK_OPTIONS
    else
        cdk deploy $CDK_OPTIONS > /dev/null 2>&1
    fi
    
    print_success "Infrastructure deployed successfully"
}

# Deploy frontend
deploy_frontend() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run - would deploy frontend to S3"
        return
    fi
    
    print_status "Deploying frontend to $ENVIRONMENT..."
    
    # Get S3 bucket name from CDK outputs
    BUCKET_NAME=$(aws cloudformation describe-stacks \
        --stack-name "InventoryReplenishmentStack-$ENVIRONMENT" \
        --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
        --output text)
    
    if [[ -z "$BUCKET_NAME" ]]; then
        print_error "Could not find frontend bucket name"
        exit 1
    fi
    
    # Sync frontend files to S3
    aws s3 sync frontend/build/ s3://$BUCKET_NAME --delete
    
    # Invalidate CloudFront cache if distribution exists
    DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
        --stack-name "InventoryReplenishmentStack-$ENVIRONMENT" \
        --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$DISTRIBUTION_ID" ]]; then
        print_status "Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" > /dev/null 2>&1
    fi
    
    print_success "Frontend deployed successfully"
}

# Run smoke tests
run_smoke_tests() {
    if [[ "$DRY_RUN" == "true" ]]; then
        print_status "Dry run - would run smoke tests"
        return
    fi
    
    print_status "Running smoke tests for $ENVIRONMENT..."
    
    # Wait for deployment to be ready
    sleep 30
    
    # Run smoke tests
    if [[ "$VERBOSE" == "true" ]]; then
        npm run test:smoke -- --env=$ENVIRONMENT
    else
        npm run test:smoke -- --env=$ENVIRONMENT > /dev/null 2>&1
    fi
    
    print_success "Smoke tests passed"
}

# Generate deployment report
generate_report() {
    if [[ "$DRY_RUN" == "true" ]]; then
        return
    fi
    
    print_status "Generating deployment report..."
    
    REPORT_FILE="deployment-report-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S).json"
    
    cat > $REPORT_FILE << EOF
{
    "deployment": {
        "environment": "$ENVIRONMENT",
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "commit": "$(git rev-parse HEAD)",
        "branch": "$(git rev-parse --abbrev-ref HEAD)",
        "deployer": "$(whoami)",
        "version": "$(node -p "require('./package.json').version")"
    },
    "infrastructure": {
        "stack_name": "InventoryReplenishmentStack-$ENVIRONMENT",
        "region": "$(aws configure get region)"
    },
    "tests": {
        "skipped": $SKIP_TESTS,
        "smoke_tests": true
    }
}
EOF
    
    print_success "Deployment report generated: $REPORT_FILE"
}

# Main deployment flow
main() {
    print_status "=== Inventory Replenishment System Deployment ==="
    print_status "Environment: $ENVIRONMENT"
    print_status "Dry Run: $DRY_RUN"
    print_status "Skip Tests: $SKIP_TESTS"
    print_status "Skip Build: $SKIP_BUILD"
    echo ""
    
    check_prerequisites
    install_dependencies
    run_tests
    build_frontend
    deploy_infrastructure
    deploy_frontend
    run_smoke_tests
    generate_report
    
    print_success "=== Deployment completed successfully ==="
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        print_warning "Production deployment completed. Monitor system health closely."
    fi
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main