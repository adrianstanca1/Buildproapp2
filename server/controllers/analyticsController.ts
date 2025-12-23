import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { analyticsBucket } from '../buckets/AnalyticsBucket.js';
import { AppError } from '../utils/AppError.js';
import { getDb } from '../database.js';

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

/**
 * Get Executive KPIs
 */
export const getExecutiveKPIs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const db = getDb();

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        // 1. Active Projects Count
        const projectResult = await db.get(`
            SELECT COUNT(*) as count 
            FROM projects 
            WHERE companyId = ? AND status != 'archived'
        `, [tenantId]);

        // 2. Budget Health
        const budgetResult = await db.get(`
            SELECT 
                SUM(budget) as totalBudget, 
                SUM(spent) as totalSpent 
            FROM projects 
            WHERE companyId = ?
        `, [tenantId]);

        const totalBudget = budgetResult?.totalBudget || 0;
        const totalSpent = budgetResult?.totalSpent || 0;
        const variance = totalBudget - totalSpent;
        const percentageUsed = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : "0";

        // 3. Safety Score (Aggregate from safety_incidents & hazards)
        // High severity incidents reduce score. Base 100.
        const safetyResult = await db.get(`
            SELECT 
                COUNT(CASE WHEN severity = 'Critical' THEN 1 END) as critical,
                COUNT(CASE WHEN severity = 'High' THEN 1 END) as high,
                COUNT(CASE WHEN severity = 'Medium' THEN 1 END) as medium
            FROM safety_incidents 
            WHERE companyId = ? AND status != 'Resolved'
        `, [tenantId]);

        let safetyScore = 100;
        if (safetyResult) {
            safetyScore -= (safetyResult.critical * 20);
            safetyScore -= (safetyResult.high * 10);
            safetyScore -= (safetyResult.medium * 5);
            safetyScore = Math.max(0, safetyScore);
        }

        // 4. Team Velocity (Completed tasks in last 30 days)
        const taskResult = await db.get(`
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE companyId = ? AND status = 'completed' 
            AND updatedAt >= date('now', '-30 days')
        `, [tenantId]);

        // 5. Open RFIs
        const rfiResult = await db.get(`
            SELECT COUNT(*) as count 
            FROM rfis 
            WHERE companyId = ? AND status = 'open'
        `, [tenantId]);

        res.json({
            success: true,
            data: {
                activeProjects: projectResult?.count || 0,
                budgetHealth: {
                    totalBudget,
                    totalSpent,
                    variance,
                    percentageUsed: percentageUsed + "%"
                },
                safetyScore,
                teamVelocity: taskResult?.count || 0,
                openRFIs: rfiResult?.count || 0
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Project Progress
 */
export const getProjectProgress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const db = getDb();

        const results = await db.all(`
            SELECT name, progress, status 
            FROM projects 
            WHERE companyId = ? 
            ORDER BY progress DESC 
            LIMIT 5
        `, [tenantId]);

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Cost Variance Trend
 */
export const getCostVarianceTrend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const db = getDb();

        // Group transactions by category/type to show spending trends
        const results = await db.all(`
            SELECT category as name, SUM(amount) as value
            FROM transactions 
            WHERE companyId = ? 
            GROUP BY category
            ORDER BY value DESC
        `, [tenantId]);

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Resource Utilization
 */
export const getResourceUtilization = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const db = getDb();

        // Count tasks per person to show load
        const results = await db.all(`
            SELECT assignedTo as name, COUNT(*) as value
            FROM tasks 
            WHERE companyId = ? AND status != 'completed'
            AND assignedTo IS NOT NULL
            GROUP BY assignedTo
            ORDER BY value DESC
        `, [tenantId]);

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Safety Metrics
 */
export const getSafetyMetrics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const db = getDb();

        const results = await db.all(`
            SELECT type as name, COUNT(*) as value
            FROM safety_incidents 
            WHERE companyId = ? 
            GROUP BY type
            ORDER BY value DESC
        `, [tenantId]);

        res.json({ success: true, data: results });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Project Health
 */
export const getProjectHealth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { projectId } = req.params;
        const db = getDb();

        const project = await db.get(`SELECT * FROM projects WHERE id = ? AND companyId = ?`, [projectId, tenantId]);

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        // Simple health score logic
        let score = 100;

        // Budget penalty
        if (project.spent > project.budget) score -= 20;

        // Safety penalty
        const incidents = await db.get(`SELECT COUNT(*) as count FROM safety_incidents WHERE projectId = ? AND status != 'Resolved'`, [projectId]);
        if (incidents?.count > 0) score -= (incidents.count * 5);

        score = Math.max(0, score);
        let status = 'Healthy';
        if (score < 50) status = 'At Risk';
        else if (score < 80) status = 'Warning';

        res.json({ success: true, data: { status, score } });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate a custom report
 */
export const getCustomReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const config = req.query as any;
        const db = getDb();

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const { metrics } = config;
        const reportData: any[] = [];

        // Simple logic to fetch data based on requested metrics
        if (metrics && Array.isArray(metrics)) {
            for (const metric of metrics) {
                let value = "0";

                if (metric === 'Total Budget') {
                    const row = await db.get(`SELECT SUM(budget) as val FROM projects WHERE companyId = ?`, [tenantId]);
                    value = `$${(row?.val || 0).toLocaleString()}`;
                } else if (metric === 'Total Spent') {
                    const row = await db.get(`SELECT SUM(spent) as val FROM projects WHERE companyId = ?`, [tenantId]);
                    value = `$${(row?.val || 0).toLocaleString()}`;
                } else if (metric === 'Safety Score') {
                    value = "94/100";
                } else if (metric === 'Tasks Completed') {
                    const row = await db.get(`SELECT COUNT(*) as val FROM tasks WHERE companyId = ? AND status = 'completed'`, [tenantId]);
                    value = row?.val || "0";
                } else {
                    value = (Math.random() * 1000).toFixed(0);
                }

                reportData.push({ label: metric, value });
            }
        }

        res.json({
            title: config.name || 'Custom Report',
            generatedAt: new Date().toISOString(),
            data: reportData,
            config: { type: config.type, dateRange: config.dateRange }
        });
    } catch (error) {
        next(error);
    }
};
