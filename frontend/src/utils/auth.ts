export interface User {
  attributes: {
    email: string;
    sub: string;
  };
  signInUserSession?: {
    accessToken: {
      payload: {
        'cognito:groups'?: string[];
      };
    };
  };
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  PROCUREMENT = 'procurement',
  USER = 'user'
}

export const getUserRole = (user: User): UserRole => {
  const groups = user?.signInUserSession?.accessToken?.payload?.['cognito:groups'] || [];
  
  if (groups.includes('admin')) return UserRole.ADMIN;
  if (groups.includes('manager')) return UserRole.MANAGER;
  if (groups.includes('procurement')) return UserRole.PROCUREMENT;
  return UserRole.USER;
};

export const hasPermission = (user: User, requiredRole: UserRole): boolean => {
  const userRole = getUserRole(user);
  
  const roleHierarchy = {
    [UserRole.ADMIN]: 4,
    [UserRole.MANAGER]: 3,
    [UserRole.PROCUREMENT]: 2,
    [UserRole.USER]: 1
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    [UserRole.ADMIN]: 'Administrator',
    [UserRole.MANAGER]: 'Warehouse Manager',
    [UserRole.PROCUREMENT]: 'Procurement Specialist',
    [UserRole.USER]: 'User'
  };
  
  return roleNames[role];
};