import { useMemo } from 'react';
import { useTenant } from '@/contexts/TenantContext';

/**
 * User roles in hierarchical order
 */
export enum UserRole {
    READ_ONLY = 'READ_ONLY',
    OPERATIVE = 'OPERATIVE',
    SUPERVISOR = 'SUPERVISOR',
    FINANCE = 'FINANCE',
    PROJECT_MANAGER = 'PROJECT_MANAGER',
    COMPANY_ADMIN = 'COMPANY_ADMIN',
    SUPERADMIN = 'SUPERADMIN',
}

/**
 * Role hierarchy for privilege comparison
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.READ_ONLY]: 0,
    [UserRole.OPERATIVE]: 1,
    [UserRole.SUPERVISOR]: 2,
    [UserRole.FINANCE]: 3,
    [UserRole.PROJECT_MANAGER]: 4,
    [UserRole.COMPANY_ADMIN]: 5,
    [UserRole.SUPERADMIN]: 6,
};

/**
 * Role check hook
 * Provides methods to check user roles and hierarchy
 */
export const useRoleCheck = () => {
    const { currentTenant } = useTenant();

    // For now, derive role from plan (temporary until backend integration)
    const userRole = useMemo((): UserRole => {
        if (!currentTenant) return UserRole.READ_ONLY;

        // Map plan to default role (temporary)
        const planRoles: Record<string, UserRole> = {
            'Free': UserRole.OPERATIVE,
            'Pro': UserRole.PROJECT_MANAGER,
            'Enterprise': UserRole.COMPANY_ADMIN,
        };

        return planRoles[currentTenant.plan] || UserRole.READ_ONLY;
    }, [currentTenant]);

    const isSuperadmin = userRole === UserRole.SUPERADMIN;

    /**
     * Check if user has a specific role
     */
    const isRole = (role: UserRole): boolean => {
        return userRole === role;
    };

    /**
     * Check if user has at least the specified role level
     */
    const isAtLeast = (minRole: UserRole): boolean => {
        return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
    };

    /**
     * Check if user has higher privilege than specified role
     */
    const isHigherThan = (role: UserRole): boolean => {
        return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[role];
    };

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = (roles: UserRole[]): boolean => {
        return roles.some(role => isRole(role));
    };

    /**
     * Check if user can manage another role
     * (user must be at least one level higher)
     */
    const canManageRole = (targetRole: UserRole): boolean => {
        return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
    };

    return {
        userRole,
        isSuperadmin,
        isRole,
        isAtLeast,
        isHigherThan,
        hasAnyRole,
        canManageRole,
    };
};
