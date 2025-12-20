


import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();
const express = require('express');
const cors = require('cors');
import { initializeDatabase, getDb, ensureDbInitialized } from './database.js';
import { seedDatabase } from './seed.js';
import { v4 as uuidv4 } from 'uuid';
import { requireRole, requirePermission } from './middleware/rbacMiddleware.js';
import { getTenantAnalytics, logUsage, checkTenantLimits } from './services/tenantService.js';
import { logger } from './utils/logger.js';

const app = express();
const port = process.env.PORT || 8080; // Cloud Run expects 8080 by default, previously 3002

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Middleware to ensure DB is initialized before handling requests (removed)

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

// app.use(tenantMiddleware); // Legacy
app.use('/api', authenticateToken); // Protect all API routes

import aiRoutes from './routes/ai.js';
app.use('/api/ai', aiRoutes);

import storageRoutes from './routes/storage.js';
app.use('/api/storage', storageRoutes);


// --- Companies Routes ---
app.get('/api/companies', async (req: any, res: any) => {
  try {
    const db = getDb();
    // In a real app, we'd filter this based on the user's "global" role.
    // For now, return all companies so the user can select one (Mocking a multi-tenant login)
    const companies = await db.all('SELECT * FROM companies');

    const parsed = companies.map(c => ({
      ...c,
      settings: c.settings ? JSON.parse(c.settings) : {},
      subscription: c.subscription ? JSON.parse(c.subscription) : {},
      features: c.features ? JSON.parse(c.features) : []
    }));

    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/companies', async (req, res) => {
  try {
    const db = getDb();
    const c = req.body;
    const id = c.id || uuidv4();
    const settings = c.settings ? JSON.stringify(c.settings) : '{}';
    const subscription = c.subscription ? JSON.stringify(c.subscription) : '{}';
    const features = c.features ? JSON.stringify(c.features) : '[]';

    // Ensure numeric fields have defaults if missing
    const users = c.users || 0;
    const projects = c.projects || 0;
    const mrr = c.mrr || 0;
    const maxUsers = c.maxUsers || 10;
    const maxProjects = c.maxProjects || 5;

    await db.run(
      `INSERT INTO companies (
        id, name, plan, status, users, projects, mrr, joinedDate, 
        description, logo, website, email, phone, address, city, state, zipCode, country,
        settings, subscription, features, maxUsers, maxProjects, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, c.name, c.plan, c.status, users, projects, mrr, c.joinedDate || new Date().toISOString(),
        c.description, c.logo, c.website, c.email, c.phone, c.address, c.city, c.state, c.zipCode, c.country,
        settings, subscription, features, maxUsers, maxProjects, new Date().toISOString(), new Date().toISOString()
      ]
    );
    res.json({ ...c, id });
  } catch (e) {
    logger.error('Error adding company:', { error: e });
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/companies/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    // Handle JSON fields
    if (updates.settings) updates.settings = JSON.stringify(updates.settings);
    if (updates.subscription) updates.subscription = JSON.stringify(updates.subscription);
    if (updates.features) updates.features = JSON.stringify(updates.features);

    // Always update timestamp
    updates.updatedAt = new Date().toISOString();

    delete updates.id;

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(',');

    await db.run(
      `UPDATE companies SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    res.json({ ...updates, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/companies/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.run('DELETE FROM companies WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Tenant Analytics Routes ---
app.get('/api/tenants/:id/usage', async (req: any, res: any) => {
  try {
    const db = getDb();
    const { id } = req.params;

    // Query the company record
    const companies = await db.all('SELECT * FROM companies WHERE id = ?', [id]);
    if (companies.length === 0) return res.status(404).json({ error: 'Tenant not found' });
    const company = companies[0];

    // Table counts
    const projectsCount = await db.all('SELECT COUNT(*) as count FROM projects WHERE companyId = ?', [id]);
    const usersCount = await db.all('SELECT COUNT(*) as count FROM team WHERE companyId = ?', [id]);

    const usage = {
      tenantId: id,
      currentUsers: usersCount[0].count,
      currentProjects: projectsCount[0].count,
      currentStorage: 0,
      currentApiCalls: 0,
      period: new Date().toISOString().substring(0, 7),
      limit: {
        users: company.maxUsers || 10,
        projects: company.maxProjects || 5,
        storage: 1024,
        apiCalls: 10000
      }
    };

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

// --- Role Management Routes ---
app.get('/api/roles', async (req: any, res: any) => {
  try {
    const db = getDb();
    const roles = await db.all('SELECT * FROM roles');
    const parsed = roles.map(r => ({
      ...r,
      permissions: r.permissions ? JSON.parse(r.permissions) : []
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/roles', async (req: any, res: any) => {
  try {
    const db = getDb();
    const { name, description, permissions } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, description, JSON.stringify(permissions || []), now, now]
    );

    await logAction(req, 'CREATE', 'roles', id, { name, permissions });
    res.json({ id, name, description, permissions, createdAt: now, updatedAt: now });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Assign role to user for a tenant
app.post('/api/user-roles', async (req: any, res: any) => {
  try {
    const db = getDb();
    const { userId, companyId, roleId } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO user_roles (id, userId, companyId, roleId, assignedBy, assignedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, companyId, roleId, req.userId, now]
    );

    await logAction(req, 'ASSIGN_ROLE', 'user_roles', id, { userId, companyId, roleId });
    res.json({ id, userId, companyId, roleId, assignedAt: now });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Get user roles for a tenant
app.get('/api/user-roles/:userId/:companyId', async (req: any, res: any) => {
  try {
    const db = getDb();
    const { userId, companyId } = req.params;

    const userRoles = await db.all(
      `SELECT ur.*, r.name as roleName, r.description, r.permissions
       FROM user_roles ur
       JOIN roles r ON ur.roleId = r.id
       WHERE ur.userId = ? AND ur.companyId = ?`,
      [userId, companyId]
    );

    const parsed = userRoles.map(ur => ({
      ...ur,
      permissions: ur.permissions ? JSON.parse(ur.permissions) : []
    }));

    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

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
app.get('/api/projects', async (req, res) => {
  try {
    const db = getDb();
    // Filter by tenant if present
    let whereClause = '';
    const params: any[] = [];
    if (req.tenantId) {
      whereClause = 'WHERE companyId = ?';
      params.push(req.tenantId);
    }

    const projects = await db.all(`
      SELECT
        p.*,
        COUNT(t.id) AS tasks_total,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS tasks_completed,
        SUM(CASE WHEN t.dueDate < date('now') AND t.status != 'Done' THEN 1 ELSE 0 END) AS tasks_overdue
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.projectId
      ${whereClause}
      GROUP BY p.id
    `, params);

    const parsed = projects.map(p => {
      return {
        ...p,
        weatherLocation: p.weatherLocation ? JSON.parse(p.weatherLocation) : null,
        zones: p.zones ? JSON.parse(p.zones) : [],
        phases: p.phases ? JSON.parse(p.phases) : [],
        timelineOptimizations: p.timelineOptimizations ? JSON.parse(p.timelineOptimizations) : [],
        tasks: {
          total: Number(p.tasks_total),
          completed: Number(p.tasks_completed),
          overdue: Number(p.tasks_overdue)
        }
      };
    });
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const db = getDb();
    const p = req.body;
    const id = p.id || uuidv4();
    const weatherLocation = p.weatherLocation ? JSON.stringify(p.weatherLocation) : null;
    const zones = p.zones ? JSON.stringify(p.zones) : '[]';
    const phases = p.phases ? JSON.stringify(p.phases) : '[]';
    const timelineOptimizations = p.timelineOptimizations ? JSON.stringify(p.timelineOptimizations) : '[]';

    // Enforce companyId from header if present (prevent spoofing)
    if (req.tenantId) {
      p.companyId = req.tenantId;
    }

    await db.run(
      `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis, zones, phases, timelineOptimizations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, weatherLocation, p.aiAnalysis, zones, phases, timelineOptimizations]
    );
    res.json({ ...p, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    // Handle JSON fields
    if (updates.weatherLocation) updates.weatherLocation = JSON.stringify(updates.weatherLocation);
    if (updates.zones) updates.zones = JSON.stringify(updates.zones);
    if (updates.phases) updates.phases = JSON.stringify(updates.phases);
    if (updates.timelineOptimizations) updates.timelineOptimizations = JSON.stringify(updates.timelineOptimizations);

    // Remove id from updates if present
    delete updates.id;
    // Remove tasks if present (computed field)
    delete updates.tasks;

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(',');

    // Add tenant check to WHERE clause
    let sql = `UPDATE projects SET ${setClause} WHERE id = ?`;
    const params = [...values, id];

    if (req.tenantId) {
      sql += ` AND companyId = ?`;
      params.push(req.tenantId);
    }

    await db.run(sql, params);

    res.json({ ...updates, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    let sql = 'DELETE FROM projects WHERE id = ?';
    const params = [id];

    if (req.tenantId) {
      sql += ' AND companyId = ?';
      params.push(req.tenantId);
    }

    await db.run(sql, params);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Tasks Routes ---
app.get('/api/tasks', async (req, res) => {
  try {
    const db = getDb();
    // Tasks should be joined with projects to filter by companyId
    let sql = 'SELECT * FROM tasks';
    const params: any[] = [];

    if (req.tenantId) {
      sql = `SELECT t.* FROM tasks t JOIN projects p ON t.projectId = p.id WHERE p.companyId = ?`;
      params.push(req.tenantId);
    }

    const tasks = await db.all(sql, params);
    const parsed = tasks.map(t => ({
      ...t,
      dependencies: t.dependencies ? JSON.parse(t.dependencies) : []
    }));
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const db = getDb();
    const t = req.body;
    const id = t.id || uuidv4();
    const dependencies = t.dependencies ? JSON.stringify(t.dependencies) : '[]';

    await db.run(
      `INSERT INTO tasks (id, title, description, projectId, status, priority, assigneeId, assigneeName, assigneeType, dueDate, latitude, longitude, dependencies)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, t.title, t.description, t.projectId, t.status, t.priority, t.assigneeId, t.assigneeName, t.assigneeType, t.dueDate, t.latitude, t.longitude, dependencies]
    );
    res.json({ ...t, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const updates = req.body;

    if (updates.dependencies) updates.dependencies = JSON.stringify(updates.dependencies);

    delete updates.id;

    const keys = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = keys.map(k => `${k} = ?`).join(',');

    await db.run(
      `UPDATE tasks SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    res.json({ ...updates, id });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    await db.run('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// --- Generic CRUD Helper ---
const createCrudRoutes = (tableName: string, jsonFields: string[] = []) => {
  app.get(`/api/${tableName}`, async (req: any, res) => {
    try {
      const db = getDb();
      let sql = `SELECT * FROM ${tableName}`;
      const params: any[] = [];

      const tenantTables = ['team', 'clients', 'inventory', 'equipment', 'timesheets', 'channels', 'rfis', 'punch_items', 'daily_logs', 'dayworks', 'safety_incidents', 'tasks', 'documents', 'transactions'];

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


// Serve static files from the React app
const path = require('path');
const { fileURLToPath } = require('url');
// Handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Initialize and Start
import { createServer } from 'http';
import { setupWebSocketServer } from './socket.js';

const httpServer = createServer(app);

// Setup WebSockets
setupWebSocketServer(httpServer);

// Start server immediately to satisfy Cloud Run health checks
const startServer = async () => {
  // Listen strictly on 0.0.0.0 for Cloud Run
  httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`Backend server running at http://0.0.0.0:${port}`);
    console.log(`WebSocket server ready at ws://0.0.0.0:${port}/api/live`);
  });

  // Initialize DB in background
  if (!process.env.VERCEL) {
    try {
      console.log('Starting DB initialization...');
      await ensureDbInitialized();
      console.log('DB Initialized. Seeding...');
      await seedDatabase();
      console.log('DB Ready.');
    } catch (err) {
      console.error('CRITICAL: DB Initialization failed:', err);
      // Don't crash, just log. App will be online but DB features might fail.
    }
  }
};

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
