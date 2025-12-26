import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Permission check hook
 * Provides methods to check user permissions
 */
export const usePermissions = () => {
    const { user } = useAuth();

    /**
     * Check if user has a specific permission
     */
    const can = (permission: string): boolean => {
        if (!user) return false;

        // Superadmin override
        if (user.permissions.includes('*')) return true;

        // Check exact permission
        if (user.permissions.includes(permission)) return true;

        // Check wildcard permissions (e.g., 'projects.*' matches 'projects.create')
        const [resource] = permission.split('.');
        if (user.permissions.includes(`${resource}.*`)) return true;

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
        permissions: user?.permissions || [],
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
