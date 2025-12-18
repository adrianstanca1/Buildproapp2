import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
    tenantId?: string;
    userId?: string;
    userName?: string;
    tenant?: any;
}

/**
 * Middleware to extract and validate tenant context from request headers
 */
export const tenantMiddleware = async (
    req: TenantRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const tenantId = req.headers['x-company-id'] as string;
        const userId = req.headers['x-user-id'] as string;
        const userName = req.headers['x-user-name'] as string;

        if (tenantId) {
            req.tenantId = tenantId;
        }

        req.userId = userId || 'anonymous';
        req.userName = userName || 'Guest';

        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to require tenant context for protected routes
 */
export const requireTenant = (
    req: TenantRequest,
    res: Response,
    next: NextFunction
) => {
    if (!req.tenantId) {
        return res.status(400).json({
            error: 'Tenant context required. Please provide x-company-id header.'
        });
    }
    next();
};
