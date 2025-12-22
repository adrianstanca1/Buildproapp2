import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import type { UserRole, Permission } from '../types/rbac.js';
import { membershipService } from './membershipService.js';
import { isSuperadmin } from '../types/rbac.js';

/**
 * PermissionService
 * Handles permission checks and role-based access control
 */
export class PermissionService {
    /**
     * Check if a user has a specific permission
     */
    async hasPermission(userId: string, permission: string, tenantId?: string): Promise<boolean> {
        try {
            // Get user's membership and role
            if (!tenantId) {
                // For platform-level permissions, check if user is superadmin
                const memberships = await membershipService.getUserMemberships(userId);
                const superadminMembership = memberships.find(m => m.role === 'SUPERADMIN');
                return superadminMembership !== null;
            }

            const membership = await membershipService.getMembership(userId, tenantId);

            if (!membership || membership.status !== 'active') {
                return false;
            }

            // Superadmin has all permissions
            if (isSuperadmin(membership.role as UserRole)) {
                return true;
            }

            // Check explicit permission overrides first
            if (membership.permissions && membership.permissions.includes(permission)) {
                return true;
            }

            // Check role-based permissions
            const rolePermissions = await this.getRolePermissions(membership.role as UserRole);
            return rolePermissions.includes(permission);
        } catch (error) {
            logger.error(`Permission check failed: ${error}`);
            return false;
        }
    }

    /**
     * Get all permissions for a user in a tenant
     */
    async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
        const membership = await membershipService.getMembership(userId, tenantId);

        if (!membership || membership.status !== 'active') {
            return [];
        }

        // Superadmin gets all permissions
        if (isSuperadmin(membership.role as UserRole)) {
            return this.getAllPermissions();
        }

        // Get role permissions
        const rolePermissions = await this.getRolePermissions(membership.role as UserRole);

        // Merge with explicit permission overrides
        const explicitPermissions = membership.permissions || [];

        return Array.from(new Set([...rolePermissions, ...explicitPermissions]));
    }

    /**
     * Get all permissions for a role
     */
    async getRolePermissions(role: UserRole): Promise<string[]> {
        const db = getDb();

        const rows = await db.all(
            `SELECT p.name 
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permissionId
       WHERE rp.roleId = ?`,
            [role]
        );

        return rows.map(row => row.name);
    }

    /**
     * Get all available permissions
     */
    async getAllPermissions(): Promise<string[]> {
        const db = getDb();

        const rows = await db.all('SELECT name FROM permissions');
        return rows.map(row => row.name);
    }

    /**
     * Get all permission objects
     */
    async getPermissions(): Promise<Permission[]> {
        const db = getDb();

        const rows = await db.all('SELECT * FROM permissions ORDER BY resource, action');
        return rows;
    }

    /**
     * Grant an explicit permission to a user
     */
    async grantPermission(userId: string, companyId: string, permission: string): Promise<void> {
        const membership = await membershipService.getMembership(userId, companyId);

        if (!membership) {
            throw new AppError('Membership not found', 404);
        }

        const currentPermissions = membership.permissions || [];

        if (currentPermissions.includes(permission)) {
            return; // Already has permission
        }

        const updatedPermissions = [...currentPermissions, permission];

        await membershipService.updateMembership(membership.id, {
            permissions: updatedPermissions,
        });

        logger.info(`Permission granted: ${permission} to user ${userId} in company ${companyId}`);
    }

    /**
     * Revoke an explicit permission from a user
     */
    async revokePermission(userId: string, companyId: string, permission: string): Promise<void> {
        const membership = await membershipService.getMembership(userId, companyId);

        if (!membership) {
            throw new AppError('Membership not found', 404);
        }

        const currentPermissions = membership.permissions || [];
        const updatedPermissions = currentPermissions.filter(p => p !== permission);

        await membershipService.updateMembership(membership.id, {
            permissions: updatedPermissions,
        });

        logger.info(`Permission revoked: ${permission} from user ${userId} in company ${companyId}`);
    }

    /**
     * Check if user has any of the specified permissions
     */
    async hasAnyPermission(userId: string, permissions: string[], tenantId?: string): Promise<boolean> {
        for (const permission of permissions) {
            if (await this.hasPermission(userId, permission, tenantId)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all of the specified permissions
     */
    async hasAllPermissions(userId: string, permissions: string[], tenantId?: string): Promise<boolean> {
        for (const permission of permissions) {
            if (!(await this.hasPermission(userId, permission, tenantId))) {
                return false;
            }
        }
        return true;
    }
}

// Export singleton instance
export const permissionService = new PermissionService();
