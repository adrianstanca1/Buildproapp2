import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenantMiddleware.js';
import { tenantService } from '../services/tenantService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

/**
 * contextMiddleware
 * Populates req.context with full TenantContext (tenantId, userId, role, permissions)
 * This becomes the single source of truth for all downstream logic
 */
export const contextMiddleware = async (req: any, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.tenantId;
        const userId = req.userId;

        if (!tenantId || !userId || userId === 'anonymous' || userId === 'demo-user') {
            // STRICT MODE: Only allow implicit demo context in development
            if (process.env.NODE_ENV === 'development') {
                req.context = {
                    tenantId: tenantId || 'c1',
                    userId: userId || 'demo-user',
                    role: 'admin', // Demo default
                    permissions: ['*'],
                    isSuperadmin: true
                };
                return next();
            }

            // In production, incomplete context is a 403
            return res.status(403).json({ error: 'Valid security context required' });
        }

        // Fetch full context from services
        const context = await tenantService.getTenantContext(userId, tenantId);
        req.context = context;

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error('Failed to populate tenant context:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
