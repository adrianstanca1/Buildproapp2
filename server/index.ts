


import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import helmet from 'helmet';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';

// Internal
import { logger } from './utils/logger.js';
import { AppError } from './utils/AppError.js';
import { initializeDatabase, getDb, ensureDbInitialized } from './database.js';
import { seedDatabase } from './seed.js';
import { setupWebSocketServer } from './socket.js';
import { UserRole } from '../types.js';

// Middleware
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { requireRole, requirePermission } from './middleware/rbacMiddleware.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { contextMiddleware } from './middleware/contextMiddleware.js';
import { maintenanceMiddleware } from './middleware/maintenanceMiddleware.js';
import errorHandler from './middleware/errorMiddleware.js';

// Services
import { getTenantAnalytics, logUsage, checkTenantLimits, getTenantUsage } from './services/tenantService.js';
import * as activityService from './services/activityService.js';

// Controllers
import * as companyController from './controllers/companyController.js';
import * as platformController from './controllers/platformController.js';
import * as userManagementController from './controllers/userManagementController.js';
import * as dailyLogController from './controllers/dailyLogController.js';
import * as rfiController from './controllers/rfiController.js';
import * as safetyController from './controllers/safetyController.js';
import * as taskController from './controllers/taskController.js';
import * as commentController from './controllers/commentController.js';
import * as rbacController from './controllers/rbacController.js';
import * as automationController from './controllers/automationController.js';
import * as predictiveController from './controllers/predictiveController.js';
import * as ocrController from './controllers/ocrController.js';
import * as analyticsController from './controllers/analyticsController.js';
import * as integrationController from './controllers/integrationController.js';
import * as tenantTeamController from './controllers/tenantTeamController.js';
import * as setupController from './controllers/setupController.js';
import { getVendors, createVendor, updateVendor } from './controllers/vendorController.js';
import { getCostCodes, createCostCode, updateCostCode } from './controllers/costCodeController.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import platformRoutes from './routes/platformRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userManagementRoutes from './routes/userManagementRoutes.js';
import clientPortalRoutes from './routes/clientPortalRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import aiRoutes from './routes/ai.js';
import storageRoutes from './routes/storage.js';

// GraphQL
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';

const app = express();
const port = process.env.PORT || 8080; // Cloud Run expects 8080 by default

// Security middleware
const SUPABASE_HOST = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_WS = SUPABASE_HOST ? SUPABASE_HOST.replace(/^https?:/, 'wss:') : '';

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com"],
            connectSrc: SUPABASE_HOST ? ["'self'", "ws:", "wss:", "https:", SUPABASE_HOST, SUPABASE_WS, "https://fonts.googleapis.com", "https://fonts.gstatic.com"] : ["'self'", "ws:", "wss:", "https:", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
            fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
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

// Serve local uploads with optional HMAC signature verification
const verifySignedUpload = (req: any, res: any, next: any) => {
    const signingSecret = process.env.FILE_SIGNING_SECRET;
    if (!signingSecret) return next();

    const { expires, sig } = req.query;
    if (!expires || !sig) {
        return res.status(403).json({ error: 'Signed URL required' });
    }

    const expiresAt = Number(expires);
    if (!expiresAt || Date.now() > expiresAt) {
        return res.status(403).json({ error: 'Signed URL expired' });
    }

    const relativePath = req.path.replace(/^\/+/, '');
    const parts = relativePath.split('/');
    const tenantId = parts.length >= 2 && parts[0] === 'tenants' ? parts[1] : 'unknown';
    const payload = `${tenantId}:${relativePath}:${expiresAt}`;
    const expectedSig = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');

    if (expectedSig !== sig) {
        return res.status(403).json({ error: 'Invalid signature' });
    }

    return next();
};

app.use('/uploads', verifySignedUpload, express.static(resolve('uploads')));

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
                req.userId || 'anonymous',
                req.userName || 'Guest',
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

// --- Routes Configuration ---
app.use('/api', authenticateToken, contextMiddleware, maintenanceMiddleware);
app.use('/api', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/platform/support', supportRoutes);
app.use('/api/platform/notifications', notificationRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/notifications', pushRoutes);
app.use('/api/client-portal', clientPortalRoutes);
app.use('/api/companies', companyRoutes);

// --- System Config Routes ---
app.get('/api/system-settings', platformController.getSystemSettings);
app.post('/api/system-settings', requireRole([UserRole.SUPERADMIN]), platformController.updateSystemSetting);
app.get('/api/system-config', platformController.getSystemConfig);
app.post('/api/system-config', requireRole([UserRole.SUPERADMIN]), platformController.updateSystemConfig);

// --- ONE-TIME SETUP ENDPOINT (Remove after first use) ---
app.post('/api/setup-superadmin', setupController.setupSuperadmin);

// --- Platform / Admin Statistics ---
const companyAdminAuth = requireRole([UserRole.SUPERADMIN, UserRole.COMPANY_ADMIN]);

app.post('/api/my-team/invite', companyAdminAuth, tenantTeamController.inviteMember);
app.put('/api/my-team/:id/role', companyAdminAuth, tenantTeamController.updateMemberRole);
app.delete('/api/my-team/:id', companyAdminAuth, tenantTeamController.removeMember);

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
app.use('/api/projects', projectRoutes);

// --- Tasks Routes ---

app.get('/api/tasks', requirePermission('tasks', 'read'), taskController.getTasks);
app.get('/api/tasks/:id', requirePermission('tasks', 'read'), taskController.getTask);
app.get('/api/tasks/critical-path/:projectId', requirePermission('tasks', 'read'), taskController.getCriticalPath);
app.post('/api/tasks', requirePermission('tasks', 'create'), taskController.createTask);
app.put('/api/tasks/:id', requirePermission('tasks', 'update'), taskController.updateTask);
app.delete('/api/tasks/:id', requirePermission('tasks', 'delete'), taskController.deleteTask);
app.patch('/api/tasks/:id/assign', requirePermission('tasks', 'update'), taskController.assignTask);
app.patch('/api/tasks/:id/status', requirePermission('tasks', 'update'), taskController.updateTaskStatus);

// Signed document URL for secure access to local uploads
app.get('/api/documents/:id/signed-url', authenticateToken, requirePermission('documents', 'read'), async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const tenantId = req.context?.tenantId || req.tenantId;
        if (!tenantId) {
            return res.status(401).json({ error: 'Tenant context required' });
        }

        const db = getDb();
        const doc = await db.get('SELECT id, companyId, url, name FROM documents WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!doc) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const signingSecret = process.env.FILE_SIGNING_SECRET;
        if (!signingSecret || !doc.url || !doc.url.startsWith('/uploads/')) {
            return res.json({ url: doc.url });
        }

        const relativePath = doc.url.replace(/^\/uploads\//, '');
        const expiresAt = Date.now() + 3600 * 1000; // 1 hour default
        const payload = `${tenantId}:${relativePath}:${expiresAt}`;
        const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');
        const signedUrl = `${doc.url}?expires=${expiresAt}&sig=${signature}`;

        return res.json({ url: signedUrl, expiresAt });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
    }
});

// --- Client Portal Routes ---
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

app.get('/api/comments', authenticateToken, contextMiddleware, commentController.getComments);
app.post('/api/comments', authenticateToken, contextMiddleware, apiLimiter as any, commentController.createComment);
app.put('/api/comments/:id', authenticateToken, contextMiddleware, commentController.updateComment);
app.delete('/api/comments/:id', authenticateToken, contextMiddleware, commentController.deleteComment);

// --- Activity Feed Routes ---

app.get('/api/activity', authenticateToken, contextMiddleware, activityService.getActivityFeed);
app.get('/api/activity/:entityType/:entityId', authenticateToken, contextMiddleware, activityService.getEntityActivity);

// --- Analytics Routes ---

app.get('/api/analytics/kpis', authenticateToken, contextMiddleware, analyticsController.getExecutiveKPIs);
app.get('/api/analytics/project-progress', authenticateToken, contextMiddleware, analyticsController.getProjectProgress);
app.get('/api/analytics/cost-variance', authenticateToken, contextMiddleware, analyticsController.getCostVarianceTrend);
app.get('/api/analytics/resource-utilization', authenticateToken, contextMiddleware, analyticsController.getResourceUtilization);
app.get('/api/analytics/safety-metrics', authenticateToken, contextMiddleware, analyticsController.getSafetyMetrics);
app.get('/api/analytics/project-health/:projectId', authenticateToken, contextMiddleware, analyticsController.getProjectHealth);
app.get('/api/analytics/custom-report', authenticateToken, contextMiddleware, analyticsController.getCustomReport);

// --- Integrations Routes ---

app.get('/api/integrations/:type', authenticateToken, contextMiddleware, integrationController.getStatus);
app.post('/api/integrations/connect', authenticateToken, contextMiddleware, integrationController.connect);
app.post('/api/integrations/sync', authenticateToken, contextMiddleware, integrationController.sync);

// --- Automations Routes (Phase 14) ---

app.get('/api/automations', authenticateToken, contextMiddleware, automationController.getAutomations);
app.post('/api/automations', authenticateToken, contextMiddleware, automationController.createAutomation);
app.put('/api/automations/:id', authenticateToken, contextMiddleware, automationController.updateAutomation);
app.delete('/api/automations/:id', authenticateToken, contextMiddleware, automationController.deleteAutomation);

// --- Predictive Intelligence Routes (Phase 14) ---

app.get('/api/predictive/analysis/:projectId', authenticateToken, contextMiddleware, predictiveController.getProjectAnalysis);

// --- OCR Routes (Phase 14) ---

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
// --- Generic CRUD Helper ---
const createCrudRoutes = (tableName: string, jsonFields: string[] = [], permissionResource?: string) => {
    // Helper to get middleware array (Authenticate + Context + Optional Permission)
    const getMiddleware = (action: 'read' | 'create' | 'update' | 'delete') => {
        const middlewares: any[] = [authenticateToken, contextMiddleware];
        if (permissionResource) {
            middlewares.push(requirePermission(permissionResource, action));
        }
        return middlewares;
    };

    app.get(`/api/${tableName}`, ...getMiddleware('read'), async (req: any, res: any) => {
        try {
            const db = getDb();
            let sql = `SELECT * FROM ${tableName}`;
            const params: any[] = [];

            const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions', 'purchase_orders', 'invoices', 'expense_claims'];

            if (req.tenantId && tenantTables.includes(tableName)) {
                sql += ` WHERE companyId = ?`;
                params.push(req.tenantId);
            } else if (!req.tenantId && tenantTables.includes(tableName) && tableName !== 'companies') {
                logger.warn(`Accessing tenant table ${tableName} without companyId header!`);
                // In strict mode, we might return [] or error, but keeping legacy behavior for now
            }

            const items = await db.all(sql, params);
            const parsed = items.map((item: any) => {
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

    app.post(`/api/${tableName}`, ...getMiddleware('create'), async (req: any, res: any) => {
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

    app.put(`/api/${tableName}/:id`, ...getMiddleware('update'), async (req: any, res: any) => {
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

    app.delete(`/api/${tableName}/:id`, ...getMiddleware('delete'), async (req: any, res: any) => {
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

// RBAC Routes
app.get('/api/roles', rbacController.getRoles);
app.post('/api/roles', rbacController.createRole);
app.put('/api/roles/:id/permissions', rbacController.updateRolePermissions);

// --- User Profile Endpoint (with auth) ---
app.get('/api/user/me', authenticateToken, async (req: any, res: any, next: any) => {
    try {
        const userId = req.userId;
        const db = getDb();

        // Get user from users table
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get memberships for this user
        const memberships = await db.all(`
      SELECT m.*, c.name as companyName 
      FROM memberships m 
      JOIN companies c ON m.companyId = c.id 
      WHERE m.userId = ?
    `, [userId]);

        // Get primary membership (first SUPERADMIN or first active membership)
        const primaryMembership = memberships.find(m => m.role === 'SUPERADMIN') || memberships[0];

        // Return user profile with role and permissions from primary membership
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            role: primaryMembership?.role || 'OPERATIVE',
            companyId: primaryMembership?.companyId || 'c1',
            permissions: ['*'], // SUPERADMIN gets all permissions
            memberships: memberships.map(m => ({
                id: m.id,
                userId: m.userId,
                companyId: m.companyId,
                role: m.role,
                status: m.status
            })),
            projectIds: []
        });
    } catch (error) {
        next(error);
    }
});
app.get('/api/permissions', rbacController.getPermissions);
app.get('/api/roles/:id/permissions', rbacController.getRolePermissions);

// Register Routes for other entities (Secured with granular RBAC)
createCrudRoutes('team', ['skills', 'certifications'], 'team');
createCrudRoutes('documents', ['linkedTaskIds'], 'documents');
createCrudRoutes('clients', [], 'clients');
createCrudRoutes('inventory', [], 'inventory');
createCrudRoutes('rfis', [], 'rfis');
createCrudRoutes('punch_items', [], 'punch_items');
createCrudRoutes('daily_logs', [], 'daily_logs');
createCrudRoutes('dayworks', ['labor', 'materials', 'attachments'], 'dayworks');
createCrudRoutes('safety_incidents', [], 'safety');
createCrudRoutes('equipment', [], 'equipment');
createCrudRoutes('timesheets', [], 'timesheets');
createCrudRoutes('channels', [], 'channels');
createCrudRoutes('team_messages', [], 'team_messages');
createCrudRoutes('transactions', [], 'financials');
createCrudRoutes('purchase_orders', ['items', 'approvers'], 'procurement');
createCrudRoutes('defects', ['box_2d'], 'quality');
createCrudRoutes('project_risks', ['factors', 'recommendations'], 'risk');
createCrudRoutes('invoices', ['items'], 'financials');
createCrudRoutes('expense_claims', ['receipts', 'items'], 'financials');


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
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    res.sendFile(join(__dirname, '../dist/index.html'));
});

// Initialize and Start

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

    // 1. Initialize DB FIRST and await it
    try {
        logger.info('Starting DB initialization...');
        await ensureDbInitialized();
        logger.info('DB Initialized. Seeding...');
        await seedDatabase();
        logger.info('DB Ready.');
    } catch (err) {
        logger.error('CRITICAL: DB Initialization failed:', err);
        // Process might need to exit if DB is essential, but for now we continue
    }

    // 2. Start Listening ONLY after DB is ready
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

    logger.info(`DEBUG: Reached end of startServer. Env VERCEL: ${process.env.VERCEL}`);
};



logger.info(`DEBUG: Reached end of index.ts. Env VERCEL: ${process.env.VERCEL}`);

// Startup environment validation: fail fast if core Supabase server envs are missing
(() => {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        logger.warn(`WARNING: Missing environment variables: ${missing.join(', ')}. Server features requiring Supabase admin access may fail.`);
    }
})();

const serverPromise = startServer();

// For testing purposes, we might want to wait for this promise
export { serverPromise };

// Global Error Handler (must be last)
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
