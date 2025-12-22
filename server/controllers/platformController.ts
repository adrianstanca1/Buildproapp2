
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

/**
 * Get aggregated platform statistics for Super Admin dashboard
 */
export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // Parallelize DB queries for performance
        const [
            companiesResult,
            usersResult,
            projectsResult,
            revenueResult
        ] = await Promise.all([
            db.all('SELECT count(*) as count FROM companies'),
            db.all('SELECT count(*) as count FROM users'), // Assuming a global users table or similar
            db.all('SELECT count(*) as count FROM projects'),
            db.all('SELECT sum(mrr) as total FROM companies')
        ]);

        const stats = {
            totalCompanies: companiesResult[0]?.count || 0,
            totalUsers: usersResult[0]?.count || 0,
            totalProjects: projectsResult[0]?.count || 0,
            monthlyRevenue: revenueResult[0]?.total || 0,
            systemStatus: 'healthy', // Hardcoded for now, could be dynamic
            environment: process.env.NODE_ENV || 'development'
        };

        res.json(stats);
    } catch (e) {
        logger.error('Failed to fetch platform stats', e);
        next(new AppError('Failed to fetch platform stats', 500));
    }
};

/**
 * Get system health metrics
 */
export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const start = Date.now();

        // Simple DB Ping
        await db.run('SELECT 1');
        const dbLatency = Date.now() - start;

        const health = {
            api: 'healthy',
            database: dbLatency < 100 ? 'healthy' : 'degraded',
            databaseLatency: `${dbLatency}ms`,
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        };

        res.json(health);
    } catch (e) {
        next(e);
    }
};

/**
 * Get recent global activity logs
 */
export const getGlobalActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        // Fetch recent logs from audit_logs table, ideally indexed by timestamp
        const logs = await db.all(
            `SELECT * FROM audit_logs 
             ORDER BY timestamp DESC 
             LIMIT 50`
        );

        res.json(logs);
    } catch (e) {
        next(e);
    }
};
