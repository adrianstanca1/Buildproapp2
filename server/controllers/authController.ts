import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { permissionService } from '../services/permissionService.js';
import { membershipService } from '../services/membershipService.js';
import { tenantService, getTenantUsage } from '../services/tenantService.js';
import { UserRole } from '../types/rbac.js';

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
        // Return the static role metadata based on the enum
        const roles = [
            { id: UserRole.SUPERADMIN, name: 'Superadmin', description: 'Full platform access, manages all companies', level: 6 },
            { id: UserRole.COMPANY_ADMIN, name: 'Company Admin', description: 'Full access within their company', level: 5 },
            { id: UserRole.PROJECT_MANAGER, name: 'Project Manager', description: 'Manages projects, tasks, and team assignments', level: 4 },
            { id: UserRole.FINANCE, name: 'Finance', description: 'Access to financial data and reports', level: 3 },
            { id: UserRole.SUPERVISOR, name: 'Supervisor', description: 'Oversees field operations and teams', level: 2 },
            { id: UserRole.OPERATIVE, name: 'Operative', description: 'Field workers, can update tasks', level: 1 },
            { id: UserRole.READ_ONLY, name: 'Read Only', description: 'View-only access', level: 0 },
        ];
        res.json(roles);
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
        const { userId, companyId, role } = req.body;

        if (!userId || !companyId || !role) {
            throw new AppError('userId, companyId, and role are required', 400);
        }

        const membership = await membershipService.getMembership(userId, companyId);
        if (!membership) {
            throw new AppError('User membership not found for this company', 404);
        }

        const updated = await membershipService.updateMembership(membership.id, { role: role as UserRole });

        // Audit Log (Simplified inline)
        const db = getDb();
        const now = new Date().toISOString();
        const logId = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logId, companyId, (req as any).userId, (req as any).userName, 'UPDATE_ROLE', 'memberships', membership.id, JSON.stringify({ oldRole: membership.role, newRole: role }), 'success', now, req.ip, req.headers['user-agent']]
        ).catch(err => logger.error('Audit log failed', err));

        res.json(updated);
    } catch (e) {
        next(e);
    }
};

export const getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, companyId } = req.params;

        if (!userId || !companyId) throw new AppError('userId and companyId are required', 400);

        const permissions = await permissionService.getUserPermissions(userId, companyId);

        // Return a simplified structure for now as we don't have multiple roles per user per company in this schema
        // The membership table currently has one role field
        const db = getDb();
        const membership = await db.get('SELECT role FROM memberships WHERE userId = ? AND companyId = ?', [userId, companyId]);

        res.json([{
            userId,
            companyId,
            roleId: membership?.role || UserRole.READ_ONLY,
            permissions
        }]);
    } catch (e) {
        next(e);
    }
};

export const getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await permissionService.getPermissions();
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = req.params.role as UserRole;
        if (!role) throw new AppError('Role is required', 400);
        const permissions = await permissionService.getRolePermissions(role);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getCurrentUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, tenantId } = (req as any).context || {};

        if (!userId) throw new AppError('Authentication required', 401);
        if (!tenantId) throw new AppError('Company selection required', 400);

        const permissions = await permissionService.getUserPermissions(userId, tenantId);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

/**
 * Get comprehensive context for the current user and tenant
 * Aggregates permissions, usage, and tenant details
 */
export const getCurrentUserContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const context = (req as any).context;

        if (!context || !context.userId) {
            throw new AppError('Authentication required', 401);
        }

        if (!context.tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        // Fetch additional aggregate data
        const [usage, tenant] = await Promise.all([
            getTenantUsage(context.tenantId),
            tenantService.getTenant(context.tenantId)
        ]);

        res.json({
            ...context,
            usage,
            tenant
        });
    } catch (e) {
        next(e);
    }
};
