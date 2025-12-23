import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { PredictiveService } from '../services/predictiveService.js';
import { AppError } from '../utils/AppError.js';

/**
 * Get predictive delay analysis for a project
 */
export const getProjectAnalysis = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.params;
        const { tenantId } = req.context;

        if (!tenantId) throw new AppError('Tenant ID required', 401);
        if (!projectId) throw new AppError('Project ID required', 400);

        const analysis = await PredictiveService.analyzeProjectDelays(tenantId, projectId);
        res.json({ success: true, data: analysis });
    } catch (error) {
        next(error);
    }
};
