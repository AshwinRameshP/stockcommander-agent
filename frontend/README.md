# Inventory Dashboard Frontend

React-based web dashboard for the Intelligent Inventory Replenishment system.

## Features

- **Authentication**: AWS Cognito integration with role-based access control
- **Responsive Design**: Mobile-first design using Tailwind CSS
- **Role-Based Access**: Different interfaces for Admin, Manager, Procurement, and User roles
- **Real-time Updates**: WebSocket integration for live data updates
- **Modern UI**: Clean, professional interface with Heroicons

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- AWS account with Cognito User Pool configured

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS configuration
```

3. Start development server:
```bash
npm start
```

### Building for Production

```bash
npm run build
```

## AWS Amplify Deployment

This application is configured for AWS Amplify hosting. The `amplify.yml` file contains the build configuration.

### Environment Variables

Set these in your Amplify console:

- `REACT_APP_AWS_REGION`: AWS region
- `REACT_APP_USER_POOL_ID`: Cognito User Pool ID
- `REACT_APP_USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `REACT_APP_API_ENDPOINT`: API Gateway endpoint

## User Roles

- **Administrator**: Full system access
- **Warehouse Manager**: Inventory management and reporting
- **Procurement Specialist**: Supplier management and purchasing
- **User**: Read-only access to dashboards

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── utils/              # Utility functions
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

## Testing

```bash
npm test
```