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
export declare enum UserRole {
    ADMIN = "admin",
    MANAGER = "manager",
    PROCUREMENT = "procurement",
    USER = "user"
}
export declare const getUserRole: (user: User) => UserRole;
export declare const hasPermission: (user: User, requiredRole: UserRole) => boolean;
export declare const getRoleDisplayName: (role: UserRole) => string;
