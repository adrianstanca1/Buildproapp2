


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { initializeDatabase, getDb, ensureDbInitialized } from './database.js';
import { seedDatabase } from './seed.js';
import { v4 as uuidv4 } from 'uuid';
import { requireRole, requirePermission } from './middleware/rbacMiddleware.js';
import { getTenantAnalytics, logUsage, checkTenantLimits } from './services/tenantService.js';
import { logger } from './utils/logger.js'; // This line might be wrong based on previous edit?
import { AppError } from './utils/AppError.js';
import { UserRole } from '../types.js'; // Importing UserRole to fix Enum type errors
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

const app = express();
const port = process.env.PORT || 8080; // Cloud Run expects 8080 by default, previously 3002

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: ["'self'", "ws:", "wss:"],
            fontSrc: ["'self'", "data:"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to ensure DB is initialized before handling requests (removed)

// Serve local uploads
app.use('/uploads', express.static(resolve('uploads')));


// --- Middleware ---
const tenantMiddleware = (req: any, res: any, next: any) => {
    const tenantId = req.headers['x-company-id'];
    const userId = req.headers['x-user-id']; // For audit logging
    const userName = req.headers['x-user-name'];

    if (tenantId) {
        req.tenantId = tenantId;
    }

    req.userId = userId || 'anonymous';
    req.userName = userName || 'Guest';
    next();
};

// Helper for audit logging
const logAction = async (req: any, action: string, resource: string, resourceId: string, changes: any = null, status: string = 'success') => {
    try {
        const db = getDb();
        const id = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                req.tenantId || 'system',
                req.userId,
                req.userName,
                action,
                resource,
                resourceId,
                changes ? JSON.stringify(changes) : null,
                status,
                new Date().toISOString(),
                req.ip,
                req.headers['user-agent']
            ]
        );
    } catch (e: any) {
        logger.error('Audit log failed:', { error: e.message });
    }
};


import { authenticateToken } from './middleware/authMiddleware.js';
import { contextMiddleware } from './middleware/contextMiddleware.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';

// app.use(tenantMiddleware); // Legacy
app.use('/api', authenticateToken, contextMiddleware, maintenanceMiddleware); // Protect, contextualize, and enforce maintenance

import aiRoutes from './routes/ai.js';
import systemRoutes from './routes/systemRoutes.js';
// Auth, Companies, Projects, ClientPortal are already imported/used below or above. 
// Consolidating:

app.use('/api/system-settings', systemRoutes); // Mount at /system-settings to match db.ts
app.use('/api/ai', aiRoutes);

import storageRoutes from './routes/storage.js';
app.use('/api/storage', storageRoutes);


// --- Companies Routes ---
import * as companyController from './controllers/companyController.js';

app.get('/api/companies', requireRole([UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN]), companyController.getCompanies);
app.post('/api/companies', requireRole([UserRole.SUPERADMIN]), companyController.createCompany);

app.put('/api/companies/:id', requireRole([UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN]), companyController.updateCompany);
app.delete('/api/companies/:id', requireRole([UserRole.SUPERADMIN]), companyController.deleteCompany);
// Self-management for Company Admins (TODO: implement updateMyCompany in companyController)
// app.put('/api/my-company', requireRole([UserRole.COMPANY_ADMIN]), companyController.updateMyCompany);

// --- System Settings Routes ---
import * as systemController from './controllers/systemController.js';
import * as dailyLogController from './controllers/dailyLogController.js';
import * as rfiController from './controllers/rfiController.js';
import * as safetyController from './controllers/safetyController.js';
import { getVendors, createVendor, updateVendor } from './controllers/vendorController.js';
import { getCostCodes, createCostCode, updateCostCode } from './controllers/costCodeController.js';
app.get('/api/system-settings', systemController.getSystemSettings);
app.post('/api/system-settings', requireRole([UserRole.SUPERADMIN]), systemController.updateSystemSetting);

// --- Platform / SuperAdmin Routes ---
import * as platformController from './controllers/platformController.js';
import * as userManagementController from './controllers/userManagementController.js';

const superAdminOnly = requireRole([UserRole.SUPERADMIN]);

app.get('/api/platform/stats', superAdminOnly, platformController.getDashboardStats);
app.get('/api/platform/health', superAdminOnly, platformController.getSystemHealth);
app.get('/api/platform/activity', superAdminOnly, platformController.getGlobalActivity);

app.get('/api/platform/users', superAdminOnly, userManagementController.getAllPlatformUsers);
app.put('/api/platform/users/:id/status', superAdminOnly, userManagementController.updateUserStatus);
app.put('/api/platform/users/:id/role', superAdminOnly, userManagementController.updateUserRole);
app.post('/api/platform/users/:id/reset-password', superAdminOnly, userManagementController.forceResetPassword);

// --- Tenant Team Management Routes ---
import * as tenantTeamController from './controllers/tenantTeamController.js';
// Only Company Admins (and Super Admins) can manage their team
const companyAdminAuth = requireRole([UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN]);

app.post('/api/my-team/invite', companyAdminAuth, tenantTeamController.inviteMember);
app.put('/api/my-team/:id/role', companyAdminAuth, tenantTeamController.updateMemberRole);
app.delete('/api/my-team/:id', companyAdminAuth, tenantTeamController.removeMember);

// --- Tenant Analytics Routes ---
import { getTenantUsage } from './services/tenantService.js';

app.get('/api/tenants/:id/usage', requireRole([UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN]), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const usage = await getTenantUsage(id);
        res.json(usage);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/audit_logs', async (req: any, res: any) => {
    try {
        const db = getDb();
        const tenantId = req.query.tenantId || req.tenantId;

        if (!tenantId) return res.status(400).json({ error: 'tenantId is required' });

        const logs = await db.all('SELECT * FROM audit_logs WHERE companyId = ? ORDER BY timestamp DESC LIMIT 100', [tenantId]);
        const parsed = logs.map(l => ({
            ...l,
            changes: l.changes ? JSON.parse(l.changes) : null
        }));

        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// --- Auth & Role Routes ---
import authRoutes from './routes/authRoutes.js';
app.use('/api', authRoutes);

// --- Enhanced Tenant Analytics ---
app.get('/api/tenants/:id/analytics', async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const analytics = await getTenantAnalytics(id);
        res.json(analytics);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

app.get('/api/tenants/:id/limits/:resourceType', async (req: any, res: any) => {
    try {
        const { id, resourceType } = req.params;
        const limits = await checkTenantLimits(id, resourceType as any);
        res.json(limits);
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// Log usage (called by other endpoints)
app.post('/api/usage-logs', async (req: any, res: any) => {
    try {
        const { companyId, resourceType, amount, metadata } = req.body;
        await logUsage(companyId, resourceType, amount, metadata);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: (e as Error).message });
    }
});

// --- Projects Routes ---
import projectRoutes from './routes/projectRoutes.js';
app.use('/api/projects', projectRoutes);

// --- Tasks Routes ---
import * as taskController from './controllers/taskController.js';

app.get('/api/tasks', requirePermission('tasks', 'read'), taskController.getTasks);
app.get('/api/tasks/:id', requirePermission('tasks', 'read'), taskController.getTask);
app.get('/api/tasks/critical-path/:projectId', requirePermission('tasks', 'read'), taskController.getCriticalPath);
app.post('/api/tasks', requirePermission('tasks', 'create'), taskController.createTask);
app.put('/api/tasks/:id', requirePermission('tasks', 'update'), taskController.updateTask);
app.delete('/api/tasks/:id', requirePermission('tasks', 'delete'), taskController.deleteTask);
app.patch('/api/tasks/:id/assign', requirePermission('tasks', 'update'), taskController.assignTask);
app.patch('/api/tasks/:id/status', requirePermission('tasks', 'update'), taskController.updateTaskStatus);

// --- Client Portal Routes ---
import clientPortalRoutes from './routes/clientPortalRoutes.js';
app.use('/api/client-portal', clientPortalRoutes);

// --- Construction Management Routes ---
// Daily Logs
app.get('/api/daily_logs', authenticateToken, dailyLogController.getDailyLogs);
app.post('/api/daily_logs', authenticateToken, dailyLogController.createDailyLog);
app.put('/api/daily_logs/:id', authenticateToken, dailyLogController.updateDailyLog);

// RFIs
app.get('/api/rfis', authenticateToken, rfiController.getRFIs);
app.post('/api/rfis', authenticateToken, rfiController.createRFI);
app.put('/api/rfis/:id', authenticateToken, rfiController.updateRFI);

// Safety Incidents
app.get('/api/safety_incidents', authenticateToken, requirePermission('safety', 'read'), safetyController.getSafetyIncidents);
app.post('/api/safety_incidents', authenticateToken, requirePermission('safety', 'create'), safetyController.createSafetyIncident);
app.put('/api/safety_incidents/:id', authenticateToken, requirePermission('safety', 'update'), safetyController.updateSafetyIncident);

// Safety Hazards
app.get('/api/safety_hazards', authenticateToken, safetyController.getSafetyHazards);
app.post('/api/safety-hazards', requirePermission('safety', 'create'), safetyController.createSafetyHazard);
app.put('/api/safety-hazards/:id', requirePermission('safety', 'update'), safetyController.updateSafetyHazard);

// --- Comments Routes ---
import * as commentController from './controllers/commentController.js';

app.get('/api/comments', authenticateToken, contextMiddleware, commentController.getComments);
app.post('/api/comments', authenticateToken, contextMiddleware, apiLimiter as any, commentController.createComment);
app.put('/api/comments/:id', authenticateToken, contextMiddleware, commentController.updateComment);
app.delete('/api/comments/:id', authenticateToken, contextMiddleware, commentController.deleteComment);

// --- Activity Feed Routes ---
import * as activityService from './services/activityService.js';

app.get('/api/activity', authenticateToken, contextMiddleware, activityService.getActivityFeed);
app.get('/api/activity/:entityType/:entityId', authenticateToken, contextMiddleware, activityService.getEntityActivity);

// --- Analytics Routes ---
import * as analyticsController from './controllers/analyticsController.js';

app.get('/api/analytics/kpis', authenticateToken, contextMiddleware, analyticsController.getExecutiveKPIs);
app.get('/api/analytics/project-progress', authenticateToken, contextMiddleware, analyticsController.getProjectProgress);
app.get('/api/analytics/cost-variance', authenticateToken, contextMiddleware, analyticsController.getCostVarianceTrend);
app.get('/api/analytics/resource-utilization', authenticateToken, contextMiddleware, analyticsController.getResourceUtilization);
app.get('/api/analytics/safety-metrics', authenticateToken, contextMiddleware, analyticsController.getSafetyMetrics);
app.get('/api/analytics/project-health/:projectId', authenticateToken, contextMiddleware, analyticsController.getProjectHealth);
app.get('/api/analytics/custom-report', authenticateToken, contextMiddleware, analyticsController.getCustomReport);

// --- Integrations Routes ---
import * as integrationController from './controllers/integrationController.js';

app.get('/api/integrations/:type', authenticateToken, contextMiddleware, integrationController.getStatus);
app.post('/api/integrations/connect', authenticateToken, contextMiddleware, integrationController.connect);
app.post('/api/integrations/sync', authenticateToken, contextMiddleware, integrationController.sync);

// --- Automations Routes (Phase 14) ---
import * as automationController from './controllers/automationController.js';

app.get('/api/automations', authenticateToken, contextMiddleware, automationController.getAutomations);
app.post('/api/automations', authenticateToken, contextMiddleware, automationController.createAutomation);
app.put('/api/automations/:id', authenticateToken, contextMiddleware, automationController.updateAutomation);
app.delete('/api/automations/:id', authenticateToken, contextMiddleware, automationController.deleteAutomation);

// --- Predictive Intelligence Routes (Phase 14) ---
import * as predictiveController from './controllers/predictiveController.js';

app.get('/api/predictive/analysis/:projectId', authenticateToken, contextMiddleware, predictiveController.getProjectAnalysis);

// --- OCR Routes (Phase 14) ---
import * as ocrController from './controllers/ocrController.js';

app.post('/api/ocr/extract', authenticateToken, contextMiddleware, ocrController.extractData);

// --- Phase 4: Financial & Supply Chain ---
// Vendors
app.get('/api/vendors', authenticateToken, getVendors);
app.post('/api/vendors', authenticateToken, requirePermission('settings', 'update'), createVendor);
app.put('/api/vendors/:id', authenticateToken, requirePermission('settings', 'update'), updateVendor);

// Cost Codes
app.get('/api/cost_codes', authenticateToken, getCostCodes);
app.post('/api/cost_codes', authenticateToken, requirePermission('financials', 'create'), createCostCode);
app.put('/api/cost_codes/:id', authenticateToken, requirePermission('financials', 'update'), updateCostCode);

// --- Generic CRUD Helper ---
const createCrudRoutes = (tableName: string, jsonFields: string[] = []) => {
    app.get(`/api/${tableName}`, async (req: any, res) => {
        try {
            const db = getDb();
            let sql = `SELECT * FROM ${tableName}`;
            const params: any[] = [];

            const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions', 'purchase_orders', 'invoices', 'expense_claims'];

            if (req.tenantId && tenantTables.includes(tableName)) {
                sql += ` WHERE companyId = ?`;
                params.push(req.tenantId);
            } else if (!req.tenantId && tenantTables.includes(tableName) && tableName !== 'companies') {
                // Strict isolation: if it's a tenant table but no header, return empty or error
                // For dev flexibility we return all, but for prod we'd error.
                // Let's stick with the current logic but add a warning.
                logger.warn(`Accessing tenant table ${tableName} without companyId header!`);
            }

            const items = await db.all(sql, params);
            const parsed = items.map(item => {
                const newItem = { ...item };
                jsonFields.forEach(field => {
                    if (newItem[field]) {
                        try {
                            newItem[field] = JSON.parse(newItem[field]);
                        } catch (e) {
                            logger.error(`Failed to parse JSON field ${field} in ${tableName}`, { error: e });
                        }
                    }
                });
                return newItem;
            });
            res.json(parsed);
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.post(`/api/${tableName}`, async (req: any, res) => {
        try {
            const db = getDb();
            const item = req.body;
            const id = item.id || uuidv4();

            const keys = Object.keys(item).filter(k => k !== 'id');
            const values = keys.map(k => {
                if (jsonFields.includes(k)) return JSON.stringify(item[k]);
                return item[k];
            });

            const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions'];

            if (req.tenantId && tenantTables.includes(tableName)) {
                if (!item.companyId) {
                    keys.push('companyId');
                    values.push(req.tenantId);
                }
            }

            const placeholders = values.map(() => '?').join(',');
            const columns = keys.join(',');

            await db.run(
                `INSERT INTO ${tableName} (id, ${columns}) VALUES (?, ${placeholders})`,
                [id, ...values]
            );

            await logAction(req, 'CREATE', tableName, id, item);
            res.json({ ...item, id });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.put(`/api/${tableName}/:id`, async (req: any, res) => {
        try {
            const db = getDb();
            const { id } = req.params;
            const updates = req.body;

            const keys = Object.keys(updates).filter(k => k !== 'id');
            const values = keys.map(k => {
                if (jsonFields.includes(k)) return JSON.stringify(updates[k]);
                return updates[k];
            });

            const setClause = keys.map(k => `${k} = ?`).join(',');
            let sql = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
            const params = [...values, id];

            const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions'];
            if (req.tenantId && tenantTables.includes(tableName)) {
                sql += ` AND companyId = ?`;
                params.push(req.tenantId);
            }

            const result = await db.run(sql, params);
            if (result.changes === 0) {
                return res.status(403).json({ error: 'Unauthorized or resource not found' });
            }

            await logAction(req, 'UPDATE', tableName, id, updates);
            res.json({ ...updates, id });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });

    app.delete(`/api/${tableName}/:id`, async (req: any, res) => {
        try {
            const db = getDb();
            const { id } = req.params;

            let sql = `DELETE FROM ${tableName} WHERE id = ?`;
            const params = [id];

            const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions'];
            if (req.tenantId && tenantTables.includes(tableName)) {
                sql += ` AND companyId = ?`;
                params.push(req.tenantId);
            }

            const result = await db.run(sql, params);
            if (result.changes === 0) {
                return res.status(403).json({ error: 'Unauthorized or resource not found' });
            }

            await logAction(req, 'DELETE', tableName, id);
            res.json({ success: true });
        } catch (e) {
            res.status(500).json({ error: (e as Error).message });
        }
    });
};
import platformRoutes from './routes/platformRoutes.js';
app.use('/api/platform', platformRoutes);

// RBAC Routes
import * as rbacController from './controllers/rbacController.js';
app.get('/api/roles', rbacController.getRoles);
app.post('/api/roles', rbacController.createRole);
app.put('/api/roles/:id/permissions', rbacController.updateRolePermissions);
app.get('/api/permissions', rbacController.getPermissions);
app.get('/api/roles/:id/permissions', rbacController.getRolePermissions);

// Register Routes for other entities
createCrudRoutes('team', ['skills', 'certifications']);
createCrudRoutes('documents', ['linkedTaskIds']);
createCrudRoutes('clients');
createCrudRoutes('inventory');
createCrudRoutes('rfis');
createCrudRoutes('punch_items');
createCrudRoutes('daily_logs');
createCrudRoutes('dayworks', ['labor', 'materials', 'attachments']);
createCrudRoutes('safety_incidents');
createCrudRoutes('equipment');
createCrudRoutes('timesheets');
createCrudRoutes('channels');
createCrudRoutes('team_messages');
createCrudRoutes('transactions');
createCrudRoutes('purchase_orders', ['items', 'approvers']);
createCrudRoutes('defects', ['box_2d']);
createCrudRoutes('project_risks', ['factors', 'recommendations']);
createCrudRoutes('invoices', ['items']);
createCrudRoutes('expense_claims', ['receipts', 'items']);


// Serve static files from the React app
// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, '../dist')));

// Handle unknown API routes
app.all('/api/*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
});

// Initialize and Start
import { createServer } from 'http';
import { setupWebSocketServer } from './socket.js';

logger.info('DEBUG: Creating HTTP Server...');
const httpServer = createServer(app);

// Setup WebSockets
try {
    logger.info('DEBUG: Setting up WebSockets...');
    setupWebSocketServer(httpServer);
    logger.info('DEBUG: WebSockets Setup Complete.');
} catch (e) {
    logger.error('DEBUG: WebSocket Setup Failed:', e);
}

// Setup GraphQL
const startApolloServer = async () => {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: ({ req }: any) => {
            // Use the context already populated by our middlewares
            return req.context || {};
        },
        introspection: process.env.NODE_ENV !== 'production',
    });
    await server.start();
    server.applyMiddleware({ app, path: '/api/graphql' });
    logger.info(`GraphQL server ready at /api/graphql`);
};
startApolloServer();

// Start server immediately to satisfy Cloud Run health checks
const startServer = async () => {
    logger.info(`DEBUG: startServer() called. Port: ${port}`);
    try {
        // Listen strictly on 0.0.0.0 for Cloud Run
        httpServer.listen(Number(port), '0.0.0.0', () => {
            logger.info(`Backend server running at http://0.0.0.0:${port}`);
            logger.info(`WebSocket server ready at ws://0.0.0.0:${port}/api/live`);
        });
        logger.info('DEBUG: httpServer.listen called.');
    } catch (e) {
        logger.error('DEBUG: httpServer.listen failed:', e);
    }

    // Initialize DB in background
    // if (!process.env.VERCEL) { // FORCE START
    try {
        logger.info('Starting DB initialization...');
        await ensureDbInitialized();
        logger.info('DB Initialized. Seeding...');
        await seedDatabase();
        logger.info('DB Ready.');
    } catch (err) {
        logger.error('CRITICAL: DB Initialization failed:', err);
        // Don't crash, just log. App will be online but DB features might fail.
    }
    // }
};

// ... (previous code)

logger.info(`DEBUG: Reached end of index.ts. Env VERCEL: ${process.env.VERCEL}`);
startServer();

// Global Error Handler (must be last)
import errorHandler from './middleware/errorMiddleware.js';
app.use(errorHandler);

// Handle Uncaught Exceptions & Rejections
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    process.exit(1);
});

export default app;
