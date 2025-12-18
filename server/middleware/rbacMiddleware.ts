import { Response, NextFunction } from 'express';
import { TenantRequest } from './tenantMiddleware.js';
import { getDb } from '../database.js';

export type Role = 'super_admin' | 'admin' | 'manager' | 'member' | 'viewer';

export interface Permission {
    resource: string;
    actions: ('create' | 'read' | 'update' | 'delete')[];
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    super_admin: [
        { resource: '*', actions: ['create', 'read', 'update', 'delete'] }
    ],
    admin: [
        { resource: 'projects', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'team', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'clients', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'documents', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'equipment', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'inventory', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'financials', actions: ['read', 'update'] }
    ],
    manager: [
        { resource: 'projects', actions: ['create', 'read', 'update'] },
        { resource: 'tasks', actions: ['create', 'read', 'update', 'delete'] },
        { resource: 'team', actions: ['read'] },
        { resource: 'documents', actions: ['create', 'read', 'update'] },
        { resource: 'equipment', actions: ['read', 'update'] },
        { resource: 'inventory', actions: ['read', 'update'] }
    ],
    member: [
        { resource: 'projects', actions: ['read'] },
        { resource: 'tasks', actions: ['read', 'update'] },
        { resource: 'team', actions: ['read'] },
        { resource: 'documents', actions: ['read'] },
        { resource: 'equipment', actions: ['read'] },
        { resource: 'timesheets', actions: ['create', 'read', 'update'] }
    ],
    viewer: [
        { resource: 'projects', actions: ['read'] },
        { resource: 'tasks', actions: ['read'] },
        { resource: 'team', actions: ['read'] },
        { resource: 'documents', actions: ['read'] }
    ]
};

/**
 * Get user roles for a specific tenant
 */
async function getUserRoles(userId: string, tenantId: string): Promise<Role[]> {
    try {
        const db = getDb();
        const userRoles = await db.all(
            `SELECT r.name FROM user_roles ur
       JOIN roles r ON ur.roleId = r.id
       WHERE ur.userId = ? AND ur.companyId = ?`,
            [userId, tenantId]
        );
        return userRoles.map(r => r.name as Role);
    } catch (error) {
        console.error('Error fetching user roles:', error);
        return [];
    }
}

/**
 * Check if user has permission for an action on a resource
 */
function hasPermission(
    roles: Role[],
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
): boolean {
    for (const role of roles) {
        const permissions = ROLE_PERMISSIONS[role];
        if (!permissions) continue;

        for (const perm of permissions) {
            if (perm.resource === '*' || perm.resource === resource) {
                if (perm.actions.includes(action)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Middleware to check if user has required role(s)
 */
export const requireRole = (allowedRoles: Role[]) => {
    return async (req: TenantRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.userId || !req.tenantId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const userRoles = await getUserRoles(req.userId, req.tenantId);

            const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

            if (!hasRequiredRole) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    required: allowedRoles,
                    current: userRoles
                });
            }

            // Attach roles to request for later use
            (req as any).userRoles = userRoles;
            next();
        } catch (error) {
            console.error('RBAC middleware error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

/**
 * Middleware to check resource-level permissions
 */
export const requirePermission = (
    resource: string,
    action: 'create' | 'read' | 'update' | 'delete'
) => {
    return async (req: TenantRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.userId || !req.tenantId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const userRoles = await getUserRoles(req.userId, req.tenantId);

            if (!hasPermission(userRoles, resource, action)) {
                return res.status(403).json({
                    error: `Permission denied: ${action} on ${resource}`,
                    roles: userRoles
                });
            }

            (req as any).userRoles = userRoles;
            next();
        } catch (error) {
            console.error('Permission middleware error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

export { ROLE_PERMISSIONS, hasPermission, getUserRoles };
