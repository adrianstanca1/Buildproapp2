import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { analyticsBucket } from '../buckets/AnalyticsBucket.js';
import { AppError } from '../utils/AppError.js';

/**
 * Analytics Controller
 * Handles metrics and analytics queries with tenant isolation
 */

/**
 * Record a metric
 */
export const recordMetric = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { metricName, value, dimensions } = req.body;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        if (!metricName || value === undefined) {
            throw new AppError('metricName and value are required', 400);
        }

        await analyticsBucket.recordMetric(tenantId, metricName, value, dimensions);

        res.json({ success: true, message: 'Metric recorded' });
    } catch (error) {
        next(error);
    }
};

/**
 * Query metrics
 */
export const queryMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { metricName, startDate, endDate, groupBy } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        if (!metricName || !startDate || !endDate) {
            throw new AppError('metricName, startDate, and endDate are required', 400);
        }

        const metrics = await analyticsBucket.queryMetrics(
            tenantId,
            metricName as string,
            {
                startDate: startDate as string,
                endDate: endDate as string,
                groupBy: groupBy as 'hour' | 'day' | 'week' | 'month',
            }
        );

        res.json({ success: true, data: metrics });
    } catch (error) {
        next(error);
    }
};

/**
 * Get metric statistics
 */
export const getStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { metricName, startDate, endDate } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        if (!metricName || !startDate || !endDate) {
            throw new AppError('metricName, startDate, and endDate are required', 400);
        }

        const stats = await analyticsBucket.getStatistics(
            tenantId,
            metricName as string,
            {
                startDate: startDate as string,
                endDate: endDate as string,
            }
        );

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

/**
 * Get dashboard metrics
 */
export const getFinancialTrends = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const options = {
            startDate: thirtyDaysAgo.toISOString(),
            endDate: now.toISOString(),
            groupBy: 'day' as const,
        };

        // Get aggregated metrics for dashboard
        const metrics = await analyticsBucket.getAggregatedMetrics(
            tenantId,
            ['user_activity', 'project_created', 'task_completed', 'api_call'],
            options
        );

        res.json({ success: true, data: metrics });
    } catch (error) {
        next(error);
    }
};
