import React, { useState } from 'react';
import { Shield, Lock, Users, CheckCircle, Settings } from 'lucide-react';
import { UserRole } from '@/server/types/rbac';

/**
 * AccessControlView
 * Superadmin-only view for managing roles and permissions
 */
const AccessControlView: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    const roles = [
        {
            role: UserRole.SUPERADMIN,
            name: 'Superadmin',
            description: 'Full platform access, manages all companies',
            level: 6,
            users: 2,
            color: 'purple',
        },
        {
            role: UserRole.COMPANY_ADMIN,
            name: 'Company Admin',
            description: 'Full access within their company',
            level: 5,
            users: 15,
            color: 'blue',
        },
        {
            role: UserRole.PROJECT_MANAGER,
            name: 'Project Manager',
            description: 'Manages projects, tasks, and team assignments',
            level: 4,
            users: 45,
            color: 'green',
        },
        {
            role: UserRole.FINANCE,
            name: 'Finance',
            description: 'Access to financial data and reports',
            level: 3,
            users: 12,
            color: 'yellow',
        },
        {
            role: UserRole.SUPERVISOR,
            name: 'Supervisor',
            description: 'Oversees field operations and teams',
            level: 2,
            users: 28,
            color: 'orange',
        },
        {
            role: UserRole.OPERATIVE,
            name: 'Operative',
            description: 'Field workers, can update tasks',
            level: 1,
            users: 156,
            color: 'gray',
        },
        {
            role: UserRole.READ_ONLY,
            name: 'Read Only',
            description: 'View-only access',
            level: 0,
            users: 34,
            color: 'zinc',
        },
    ];

    const permissions = [
        { category: 'Projects', permissions: ['create', 'read', 'update', 'delete', 'export'] },
        { category: 'Tasks', permissions: ['create', 'read', 'update', 'delete', 'assign'] },
        { category: 'Finance', permissions: ['create', 'read', 'update', 'delete', 'export', 'approve'] },
        { category: 'Team', permissions: ['create', 'read', 'update', 'delete', 'roles'] },
        { category: 'Documents', permissions: ['create', 'read', 'update', 'delete'] },
        { category: 'Reports', permissions: ['read', 'export'] },
        { category: 'Settings', permissions: ['read', 'update'] },
        { category: 'Platform', permissions: ['companies', 'users', 'settings', 'audit'] },
    ];

    // Mock permission matrix
    const hasPermission = (role: UserRole, category: string, permission: string): boolean => {
        if (role === UserRole.SUPERADMIN) return true;
        if (role === UserRole.READ_ONLY) return permission === 'read';
        if (category === 'Platform') return false;
        if (category === 'Finance') return [UserRole.COMPANY_ADMIN, UserRole.FINANCE].includes(role);
        return [UserRole.COMPANY_ADMIN, UserRole.PROJECT_MANAGER].includes(role);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Access Control
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Manage roles, permissions, and access levels
                    </p>
                </div>
            </div>

            {/* Role Hierarchy */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Role Hierarchy
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map((roleInfo) => (
                        <button
                            key={roleInfo.role}
                            onClick={() => setSelectedRole(roleInfo.role)}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${selectedRole === roleInfo.role
                                    ? `border-${roleInfo.color}-500 bg-${roleInfo.color}-50 dark:bg-${roleInfo.color}-900/20`
                                    : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-2xl font-bold text-${roleInfo.color}-600`}>
                                    L{roleInfo.level}
                                </span>
                                <Users className="w-5 h-5 text-zinc-400" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-white mb-1">
                                {roleInfo.name}
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                                {roleInfo.description}
                            </p>
                            <p className="text-xs text-zinc-500">
                                {roleInfo.users} users
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Permission Matrix */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Permission Matrix
                    {selectedRole && (
                        <span className="ml-2 px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                            {roles.find(r => r.role === selectedRole)?.name}
                        </span>
                    )}
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Resource
                                </th>
                                {permissions[0]?.permissions.map((perm) => (
                                    <th
                                        key={perm}
                                        className="px-4 py-3 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider"
                                    >
                                        {perm}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {permissions.map((resource) => (
                                <tr key={resource.category} className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                                        {resource.category}
                                    </td>
                                    {resource.permissions.map((perm) => {
                                        const allowed = selectedRole
                                            ? hasPermission(selectedRole, resource.category, perm)
                                            : false;

                                        return (
                                            <td key={perm} className="px-4 py-3 text-center">
                                                {selectedRole ? (
                                                    allowed ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                                    ) : (
                                                        <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 rounded-full mx-auto" />
                                                    )
                                                ) : (
                                                    <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {!selectedRole && (
                    <p className="text-center text-zinc-500 mt-4">
                        Select a role above to view its permissions
                    </p>
                )}
            </div>

            {/* Role Details */}
            {selectedRole && (
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Role Configuration
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                                Role Information
                            </h3>
                            <dl className="space-y-2">
                                <div>
                                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">Name</dt>
                                    <dd className="font-medium text-zinc-900 dark:text-white">
                                        {roles.find(r => r.role === selectedRole)?.name}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">Level</dt>
                                    <dd className="font-medium text-zinc-900 dark:text-white">
                                        {roles.find(r => r.role === selectedRole)?.level}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-sm text-zinc-600 dark:text-zinc-400">Users</dt>
                                    <dd className="font-medium text-zinc-900 dark:text-white">
                                        {roles.find(r => r.role === selectedRole)?.users}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div>
                            <h3 className="font-medium text-zinc-900 dark:text-white mb-2">
                                Description
                            </h3>
                            <p className="text-zinc-600 dark:text-zinc-400">
                                {roles.find(r => r.role === selectedRole)?.description}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessControlView;
