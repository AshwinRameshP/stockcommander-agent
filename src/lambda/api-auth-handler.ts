import { APIGatewayAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { AuditLogger } from '../utils/audit-logger';

interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export class APIAuthHandler {
  private auditLogger: AuditLogger;
  private jwtSecret: string;

  constructor() {
    this.auditLogger = new AuditLogger();
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
  }

  /**
   * Lambda authorizer function for API Gateway
   */
  async authorize(event: APIGatewayAuthorizerEvent, context: Context): Promise<APIGatewayAuthorizerResult> {
    try {
      const token = this.extractToken(event);
      
      if (!token) {
        await this.auditLogger.logAuthentication(
          'unknown',
          'TOKEN_MISSING',
          context,
          false,
          event.requestContext?.identity?.sourceIp,
          event.requestContext?.identity?.userAgent,
          'Authorization token not provided'
        );
        
        throw new Error('Unauthorized');
      }

      const payload = await this.validateToken(token);
      const authContext: AuthContext = {
        userId: payload.sub,
        email: payload.email,
        roles: payload.roles,
        permissions: payload.permissions,
      };

      // Check if user has permission for this resource
      const hasPermission = await this.checkPermissions(
        authContext,
        event.methodArn,
        event.httpMethod || 'GET'
      );

      if (!hasPermission) {
        await this.auditLogger.logAuthorization(
          authContext.userId,
          event.resource || event.methodArn,
          event.httpMethod || 'GET',
          context,
          false,
          'Insufficient permissions'
        );
        
        throw new Error('Forbidden');
      }

      await this.auditLogger.logAuthentication(
        authContext.userId,
        'TOKEN_VALIDATED',
        context,
        true,
        event.requestContext?.identity?.sourceIp,
        event.requestContext?.identity?.userAgent
      );

      return this.generatePolicy('Allow', event.methodArn, authContext);

    } catch (error: any) {
      console.error('Authorization failed:', error);
      
      if (error.message === 'Forbidden') {
        return this.generatePolicy('Deny', event.methodArn);
      }
      
      throw new Error('Unauthorized');
    }
  }

  /**
   * Extracts JWT token from the authorization header
   */
  private extractToken(event: APIGatewayAuthorizerEvent): string | null {
    const authHeader = event.authorizationToken || event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Validates JWT token and returns payload
   */
  private async validateToken(token: string): Promise<JWTPayload> {
    try {
      const payload = verify(token, this.jwtSecret) as JWTPayload;
      
      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Checks if user has required permissions for the resource
   */
  private async checkPermissions(
    authContext: AuthContext,
    methodArn: string,
    httpMethod: string
  ): Promise<boolean> {
    // Extract resource from method ARN
    const resource = this.extractResourceFromArn(methodArn);
    const requiredPermission = this.getRequiredPermission(resource, httpMethod);

    // Check role-based permissions
    if (this.hasRolePermission(authContext.roles, resource, httpMethod)) {
      return true;
    }

    // Check explicit permissions
    return authContext.permissions.includes(requiredPermission);
  }

  /**
   * Extracts resource name from method ARN
   */
  private extractResourceFromArn(methodArn: string): string {
    // Example ARN: arn:aws:execute-api:region:account:api-id/stage/method/resource
    const parts = methodArn.split('/');
    return parts.slice(3).join('/'); // Get resource path
  }

  /**
   * Determines required permission based on resource and HTTP method
   */
  private getRequiredPermission(resource: string, httpMethod: string): string {
    const action = this.getActionFromMethod(httpMethod);
    return `inventory:${resource}:${action}`;
  }

  /**
   * Maps HTTP method to action
   */
  private getActionFromMethod(httpMethod: string): string {
    switch (httpMethod.toUpperCase()) {
      case 'GET':
        return 'read';
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'access';
    }
  }

  /**
   * Checks role-based permissions
   */
  private hasRolePermission(roles: string[], resource: string, httpMethod: string): boolean {
    // Admin role has access to everything
    if (roles.includes('admin')) {
      return true;
    }

    // Manager role permissions
    if (roles.includes('manager')) {
      const managerResources = ['invoices', 'recommendations', 'suppliers', 'inventory'];
      const resourceType = resource.split('/')[0];
      return managerResources.includes(resourceType);
    }

    // Viewer role permissions (read-only)
    if (roles.includes('viewer')) {
      return httpMethod.toUpperCase() === 'GET';
    }

    // Operator role permissions
    if (roles.includes('operator')) {
      const operatorResources = ['invoices', 'inventory'];
      const resourceType = resource.split('/')[0];
      return operatorResources.includes(resourceType) && 
             ['GET', 'POST', 'PUT'].includes(httpMethod.toUpperCase());
    }

    return false;
  }

  /**
   * Generates IAM policy for API Gateway
   */
  private generatePolicy(
    effect: 'Allow' | 'Deny',
    resource: string,
    authContext?: AuthContext
  ): APIGatewayAuthorizerResult {
    return {
      principalId: authContext?.userId || 'unknown',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource,
          },
        ],
      },
      context: authContext ? {
        userId: authContext.userId,
        email: authContext.email,
        roles: JSON.stringify(authContext.roles),
        permissions: JSON.stringify(authContext.permissions),
      } : undefined,
    };
  }
}

/**
 * Lambda handler function
 */
export const handler = async (
  event: APIGatewayAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  const authHandler = new APIAuthHandler();
  return authHandler.authorize(event, context);
};

/**
 * Utility function to extract user context from API Gateway event
 */
export function extractUserContext(event: any): AuthContext | null {
  try {
    const requestContext = event.requestContext;
    if (!requestContext?.authorizer) {
      return null;
    }

    return {
      userId: requestContext.authorizer.userId,
      email: requestContext.authorizer.email,
      roles: JSON.parse(requestContext.authorizer.roles || '[]'),
      permissions: JSON.parse(requestContext.authorizer.permissions || '[]'),
    };
  } catch (error) {
    console.error('Failed to extract user context:', error);
    return null;
  }
}

/**
 * Middleware to check specific permissions
 */
export function requirePermission(permission: string) {
  return (handler: Function) => {
    return async (event: any, context: Context) => {
      const userContext = extractUserContext(event);
      
      if (!userContext) {
        throw new Error('Unauthorized: No user context');
      }

      if (!userContext.permissions.includes(permission) && !userContext.roles.includes('admin')) {
        const auditLogger = new AuditLogger();
        await auditLogger.logAuthorization(
          userContext.userId,
          permission,
          'PERMISSION_CHECK',
          context,
          false,
          `Missing required permission: ${permission}`
        );
        
        throw new Error(`Forbidden: Missing permission ${permission}`);
      }

      return handler(event, context);
    };
  };
}

/**
 * Middleware to check role requirements
 */
export function requireRole(requiredRoles: string[]) {
  return (handler: Function) => {
    return async (event: any, context: Context) => {
      const userContext = extractUserContext(event);
      
      if (!userContext) {
        throw new Error('Unauthorized: No user context');
      }

      const hasRole = requiredRoles.some(role => userContext.roles.includes(role));
      
      if (!hasRole) {
        const auditLogger = new AuditLogger();
        await auditLogger.logAuthorization(
          userContext.userId,
          'role_check',
          'ROLE_CHECK',
          context,
          false,
          `Missing required roles: ${requiredRoles.join(', ')}`
        );
        
        throw new Error(`Forbidden: Missing required role`);
      }

      return handler(event, context);
    };
  };
}