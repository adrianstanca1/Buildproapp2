import React, { useState } from 'react';
import { Users, Search, Mail, Building2, Shield, Calendar, MoreVertical } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

/**
 * PlatformMembersView
 * Superadmin-only view for cross-tenant user management
 */
const PlatformMembersView: React.FC = () => {
    const { tenants } = useTenant();
    const [searchTerm, setSearchTerm] = useState('');

    // Aggregate all members across all companies
    const allMembers = tenants.flatMap(tenant =>
        (tenant.members || []).map(member => ({
            ...member,
            companyName: tenant.name,
            companyId: tenant.id,
        }))
    );

    const filteredMembers = allMembers.filter(member =>
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            SUPERADMIN: 'purple',
            COMPANY_ADMIN: 'blue',
            PROJECT_MANAGER: 'green',
            FINANCE: 'yellow',
            SUPERVISOR: 'orange',
            OPERATIVE: 'gray',
            READ_ONLY: 'zinc',
        };
        return colors[role] || 'gray';
    };

    const stats = [
        {
            label: 'Total Users',
            value: allMembers.length,
            icon: Users,
            color: 'blue',
        },
        {
            label: 'Superadmins',
            value: allMembers.filter(m => m.role === 'SUPERADMIN').length,
            icon: Shield,
            color: 'purple',
        },
        {
            label: 'Company Admins',
            value: allMembers.filter(m => m.role === 'COMPANY_ADMIN').length,
            icon: Building2,
            color: 'blue',
        },
        {
            label: 'Active Today',
            value: Math.floor(allMembers.length * 0.6), // Mock data
            icon: Calendar,
            color: 'green',
        },
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Platform Members
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Cross-tenant user management and activity
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                        {stat.value}
                                    </p>
                                </div>
                                <Icon className={`w - 8 h - 8 text - ${stat.color} -600`} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                    type="text"
                    placeholder="Search users by name, email, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Last Active
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {filteredMembers.map((member, idx) => {
                                const roleColor = getRoleBadgeColor(member.role || 'READ_ONLY');

                                return (
                                    <tr
                                        key={`${member.companyId} -${member.id || idx} `}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                                    {member.name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-zinc-900 dark:text-white">
                                                        {member.name || 'Unknown User'}
                                                    </p>
                                                    <p className="text-sm text-zinc-500">
                                                        ID: {member.id || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-zinc-400" />
                                                <span className="text-sm text-zinc-900 dark:text-white">
                                                    {member.companyName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px - 2 py - 1 text - xs font - medium bg - ${roleColor} -100 dark: bg - ${roleColor} -900 / 30 text - ${roleColor} -800 dark: text - ${roleColor} -300 rounded - full`}>
                                                {member.role || 'READ_ONLY'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-zinc-400" />
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {member.email || 'No email'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                                            {member.lastActive || '2 hours ago'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded transition-colors">
                                                <MoreVertical className="w-5 h-5 text-zinc-400" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredMembers.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                        No members found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlatformMembersView;
