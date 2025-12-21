import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

// Helper for audit logging (duplicating temporarily until AuditService is created, or importing if I extracted it)
// Ideally Audit Log should be a service. For now, I'll inline a simple version or just rely on DB run.
// Wait, `logAction` is internal to index.ts. I should probably move it to a service first?
// `server/services/auditService.ts`.

// Let's assume I can't easily move logAction right now without expanding scope.
// I'll re-implement the simplified log insertion here or skip it for this specific refactor step?
// No, logging is important. I will create a minimal `auditService.ts` first.

// Wait, I can't create `auditService.ts` in this same step safely. 
// I'll inline the DB call for now to keep it safe.

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const roles = await db.all('SELECT * FROM roles');
        const parsed = roles.map(r => ({
            ...r,
            permissions: r.permissions ? JSON.parse(r.permissions) : []
        }));
        res.json(parsed);
    } catch (e) {
        next(e);
    }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { name, description, permissions } = req.body;

        if (!name) throw new AppError('Role name is required', 400);

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, description, JSON.stringify(permissions || []), now, now]
        );

        // Audit Log (Simplified inline)
        const logId = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logId, (req as any).tenantId || 'system', (req as any).userId, (req as any).userName, 'CREATE', 'roles', id, JSON.stringify({ name, permissions }), 'success', now, req.ip, req.headers['user-agent']]
        ).catch(err => logger.error('Audit log failed', err));

        res.json({ id, name, description, permissions, createdAt: now, updatedAt: now });
    } catch (e) {
        next(e);
    }
};

export const assignUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { userId, companyId, roleId } = req.body;

        if (!userId || !companyId || !roleId) throw new AppError('userId, companyId, and roleId are required', 400);

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO user_roles (id, userId, companyId, roleId, assignedBy, assignedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, userId, companyId, roleId, (req as any).userId, now]
        );

        res.json({ id, userId, companyId, roleId, assignedAt: now });
    } catch (e) {
        next(e);
    }
};

export const getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
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
        next(e);
    }
};
