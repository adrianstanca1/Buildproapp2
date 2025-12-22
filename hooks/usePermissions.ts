import { useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Permission check hook
 * Provides methods to check user permissions
 */
export const usePermissions = () => {
    const { currentTenant } = useTenant();

    // For now, we'll use a simplified permission system
    // This will be enhanced when we integrate with the backend RBAC
    const permissions = useMemo(() => {
        if (!currentTenant) return [];

        // Map plan to permissions (temporary until backend integration)
        const planPermissions: Record<string, string[]> = {
            'Free': ['projects.read', 'tasks.read', 'documents.read'],
            'Pro': [
                'projects.read', 'projects.create', 'projects.update',
                'tasks.read', 'tasks.create', 'tasks.update',
                'documents.read', 'documents.create',
                'reports.read', 'team.read'
            ],
            'Enterprise': ['*'], // All permissions
        };

        return planPermissions[currentTenant.plan] || [];
    }, [currentTenant]);

    /**
     * Check if user has a specific permission
     */
    const can = (permission: string): boolean => {
        if (!currentTenant) return false;

        // Enterprise has all permissions
        if (permissions.includes('*')) return true;

        // Check exact permission
        if (permissions.includes(permission)) return true;

        // Check wildcard permissions (e.g., 'projects.*' matches 'projects.create')
        const [resource] = permission.split('.');
        if (permissions.includes(`${resource}.*`)) return true;

        return false;
    };

    /**
     * Check if user has ANY of the specified permissions
     */
    const canAny = (permissionList: string[]): boolean => {
        return permissionList.some(permission => can(permission));
    };

    /**
     * Check if user has ALL of the specified permissions
     */
    const canAll = (permissionList: string[]): boolean => {
        return permissionList.every(permission => can(permission));
    };

    /**
     * Check if user cannot perform an action
     */
    const cannot = (permission: string): boolean => {
        return !can(permission);
    };

    return {
        permissions,
        can,
        canAny,
        canAll,
        cannot,
    };
};

/**
 * Alias for usePermissions
 */
export const useAbility = usePermissions;
