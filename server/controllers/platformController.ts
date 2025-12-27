
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { userManagementService } from '../services/userManagementService.js';


import os from 'os';
import { broadcastToAll } from '../socket.js';


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
            db.get('SELECT count(*) as count FROM companies'),
            db.get('SELECT count(*) as count FROM users'),
            db.get('SELECT count(*) as count FROM projects'),
            db.get('SELECT sum(mrr) as total FROM companies')
        ]);

        const stats = {
            totalCompanies: companiesResult?.count || 0,
            totalUsers: usersResult?.count || 0,
            totalProjects: projectsResult?.count || 0,
            monthlyRevenue: revenueResult?.total || 0,
            systemStatus: 'healthy', // Default to healthy if code execution reached here
            environment: process.env.NODE_ENV || 'development'
        };

        // Simple check if any major query failed (though they would likely throw)
        if (!companiesResult || !usersResult) {
            stats.systemStatus = 'degraded';
        }

        res.json(stats);
    } catch (e) {
        logger.error('Failed to fetch platform stats', e);
        next(new AppError('Failed to fetch platform stats', 500));
    }
};

/**
 * Get system health metrics with real OS data
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
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            osLoad: os.loadavg(),
            freeMem: os.freemem(),
            totalMem: os.totalmem()
        };

        res.json(health);
    } catch (e) {
        next(e);
    }
};

/**
 * Get global audit logs with filtering and pagination
 */
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { limit = 100, offset = 0, action, userId, resource, startDate, endDate } = req.query;

        let sql = `SELECT * FROM audit_logs WHERE 1=1`;
        const params: any[] = [];

        if (action && action !== 'ALL') {
            sql += ` AND action = ?`;
            params.push(action);
        }

        if (userId) {
            sql += ` AND (userId LIKE ? OR userName LIKE ?)`;
            params.push(`%${userId}%`, `%${userId}%`);
        }

        if (resource) {
            sql += ` AND resource = ?`;
            params.push(resource);
        }

        if (startDate) {
            sql += ` AND timestamp >= ?`;
            params.push(startDate);
        }

        if (endDate) {
            sql += ` AND timestamp <= ?`;
            params.push(endDate);
        }

        sql += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const logs = await db.all(sql, params);

        const parsedLogs = logs.map(l => ({
            ...l,
            metadata: l.changes ? JSON.parse(l.changes) : l.metadata ? JSON.parse(l.metadata) : null
        }));

        res.json(parsedLogs);
    } catch (e) {
        next(e);
    }
};



/**
 * Execute raw SQL (Super Admin Only)
 */
export const executeSql = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { query } = req.body;
        if (!query) throw new AppError('Query is required', 400);

        // Basic safety check - prevent DROP/DELETE without explicit confirmation? 
        // For now, we trust Super Admin but log EVERYTHING.

        const db = getDb();
        const start = Date.now();

        let result;
        if (query.trim().toLowerCase().startsWith('select')) {
            result = await db.all(query);
        } else {
            result = await db.run(query);
        }

        const duration = Date.now() - start;

        logger.warn(`SUPERADMIN SQL EXECUTION by ${(req as any).userName}: ${query}`);

        res.json({
            success: true,
            duration: `${duration}ms`,
            result
        });
    } catch (e: any) {
        res.status(400).json({ success: false, error: e.message });
    }
};

/**
 * Toggle Global Maintenance Mode
 */
export const toggleMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { enabled, message } = req.body;
        const db = getDb();

        // Persist to system_settings table (upsert)
        await db.run(`INSERT INTO system_settings (key, value) VALUES ('maintenance_mode', ?) 
                      ON CONFLICT(key) DO UPDATE SET value = ?`, [JSON.stringify({ enabled, message }), JSON.stringify({ enabled, message })]);

        if (enabled) {
            broadcastToAll({ type: 'SYSTEM_ALERT', level: 'critical', message: message || 'System is entering maintenance mode.' });
        }

        res.json({ success: true, enabled });
    } catch (e) {
        next(e);
    }
};

/**
 * Broadcast message to all users
 */
export const broadcastMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, level = 'info' } = req.body;
        broadcastToAll({ type: 'SYSTEM_ALERT', level, message });
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Get Advanced Metrics (OS and Process stats)
 */
export const getAdvancedMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Return more detailed metrics if available, or just OS stats
        const metrics = {
            cpuDetails: os.cpus(),
            networkInterfaces: os.networkInterfaces(),
            processId: process.pid,
            nodeVersion: process.version
        };
        res.json({ success: true, metrics });
    } catch (e) {
        next(e);
    }
};
/**
 * Get Global System Configuration
 */
export const getSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const configSetting = await db.get('SELECT value FROM system_settings WHERE key = ?', ['global_config']);

        if (!configSetting) {
            // Return default config if not found
            const defaultConfig = {
                platformName: 'BuildPro',
                supportEmail: 'support@buildpro.app',
                maintenanceMode: false,
                allowRegistrations: true,
                primaryColor: '#4f46e5',
                apiKeys: {
                    googleMaps: '****************',
                    sendGrid: '****************',
                    openai: '****************'
                }
            };
            return res.json(defaultConfig);
        }

        res.json(JSON.parse(configSetting.value));
    } catch (e) {
        next(e);
    }
};

/**
 * Update Global System Configuration
 */
export const updateSystemConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const updates = req.body;
        const now = new Date().toISOString();
        const updatedBy = (req as any).userName || 'admin';

        // 1. Fetch existing config
        const existingRow = await db.get('SELECT value FROM system_settings WHERE key = ?', ['global_config']);
        let currentConfig: any = {};
        if (existingRow) {
            try {
                currentConfig = JSON.parse(existingRow.value);
            } catch (e) {
                // Ignore parse error, start fresh
            }
        }

        // 2. Merge updates (Shallow merge is usually enough for top-level keys like maintenanceMode)
        // If we need deep merge for apiKeys, we handle it:
        const mergedConfig = {
            ...currentConfig,
            ...updates,
            // Handle nested objects explicitly if needed, but for now top-level merge
            // If updates contains apiKeys, it overwrites the whole object unless we merge it too.
            // Let's do a simple spread for apiKeys if present in both
            apiKeys: {
                ...(currentConfig.apiKeys || {}),
                ...(updates.apiKeys || {})
            }
        };

        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt, updatedBy) 
             VALUES (?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = ?, updatedAt = ?, updatedBy = ?`,
            ['global_config', JSON.stringify(mergedConfig), now, updatedBy, JSON.stringify(mergedConfig), now, updatedBy]
        );

        res.json({ success: true, config: mergedConfig });
    } catch (e) {
        next(e);
    }
};

/**
 * Get All Platform Users (Super Admin)
 */
export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userManagementService.getAllUsers();
        res.json(users);
    } catch (e) {
        next(e);
    }
};

/**
 * Update User Status (Suspend/Activate)
 */
export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = (req as any).userId;

        await userManagementService.changeUserStatus(id, status, userId);

        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Update User Role
 */
export const updateUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const userId = (req as any).userId;

        // For platform-level role changes, we need to update the user's role in the users table
        // Since this is a platform route, we'll assume it's for a specific company context
        // In a real implementation, you might need to pass the company ID as well
        await userManagementService.changeUserRole(id, role as any, req.body.companyId || 'system', userId);

        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Get all system settings as an object
 */
export const getSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const settings = await db.all('SELECT key, value FROM system_settings');
        const settingsObj = settings.reduce((acc: any, curr: any) => {
            try {
                acc[curr.key] = JSON.parse(curr.value);
            } catch {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {});
        res.json(settingsObj);
    } catch (e) {
        next(e);
    }
};

/**
 * Update a specific system setting
 */
export const updateSystemSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key, value } = req.body;
        if (!key) throw new AppError('Key is required', 400);

        const db = getDb();
        const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        const now = new Date().toISOString();
        const updatedBy = (req as any).userName || 'admin';

        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt, updatedBy) VALUES (?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt, updatedBy = excluded.updatedBy`,
            [key, strValue, now, updatedBy]
        );

        res.json({ success: true, key, value });
    } catch (e) {
        next(e);
    }
};
