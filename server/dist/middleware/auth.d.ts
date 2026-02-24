import { Request, Response, NextFunction } from 'express';
export type UserRole = 'admin' | 'manager' | 'cashier';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        role: UserRole;
    };
}
export declare const protect: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>>>;
/**
 * Middleware to restrict access to specific roles
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export declare const authorize: (...allowedRoles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map