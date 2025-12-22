import React, { useState } from 'react';
import { FileText, Download, Filter, Calendar, User, Building2, AlertCircle } from 'lucide-react';

interface AuditLog {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    companyId: string;
    companyName: string;
    action: string;
    resource: string;
    resourceId: string;
    metadata?: any;
    ipAddress?: string;
    severity: 'info' | 'warning' | 'error';
}

/**
 * SystemLogsView
 * Superadmin-only view for audit log viewing and export
 */
const SystemLogsView: React.FC = () => {
    const [filterAction, setFilterAction] = useState('all');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Mock audit logs
    // Mock audit logs
    const [mockLogs] = useState<AuditLog[]>(() => {
        const now = Date.now();
        return [
            {
                id: '1',
                timestamp: new Date(now).toISOString(),
                userId: 'u1',
                userName: 'John Admin',
                companyId: 'c1',
                companyName: 'Acme Construction',
                action: 'project.create',
                resource: 'projects',
                resourceId: 'p123',
                metadata: { name: 'New Office Building' },
                ipAddress: '192.168.1.1',
                severity: 'info',
            },
            {
                id: '2',
                timestamp: new Date(now - 3600000).toISOString(),
                userId: 'u2',
                userName: 'Jane Manager',
                companyId: 'c2',
                companyName: 'BuildCo Ltd',
                action: 'user.delete',
                resource: 'users',
                resourceId: 'u456',
                metadata: { email: 'removed@example.com' },
                ipAddress: '192.168.1.2',
                severity: 'warning',
            },
            {
                id: '3',
                timestamp: new Date(now - 7200000).toISOString(),
                userId: 'u3',
                userName: 'Bob Finance',
                companyId: 'c1',
                companyName: 'Acme Construction',
                action: 'finance.export',
                resource: 'transactions',
                resourceId: 'all',
                metadata: { format: 'CSV', count: 1250 },
                ipAddress: '192.168.1.3',
                severity: 'info',
            },
            {
                id: '4',
                timestamp: new Date(now - 10800000).toISOString(),
                userId: 'superadmin',
                userName: 'System Admin',
                companyId: 'platform',
                companyName: 'Platform',
                action: 'company.suspend',
                resource: 'companies',
                resourceId: 'c5',
                metadata: { reason: 'Payment failure' },
                ipAddress: '10.0.0.1',
                severity: 'error',
            },
        ];
    });

    const filteredLogs = mockLogs.filter(log => {
        const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
        const matchesSeverity = filterSeverity === 'all' || log.severity === filterSeverity;
        const matchesSearch =
            log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesAction && matchesSeverity && matchesSearch;
    });

    const getSeverityColor = (severity: string) => {
        const colors: Record<string, string> = {
            info: 'blue',
            warning: 'yellow',
            error: 'red',
        };
        return colors[severity] || 'gray';
    };

    const handleExport = () => {
        const csv = [
            ['Timestamp', 'User', 'Company', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Severity'].join(','),
            ...filteredLogs.map(log => [
                log.timestamp,
                log.userName,
                log.companyName,
                log.action,
                log.resource,
                log.resourceId,
                log.ipAddress || '',
                log.severity,
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        System Logs
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        Audit trail and system activity monitoring
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Download className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Logs</p>
                            <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                                {mockLogs.length}
                            </p>
                        </div>
                        <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Info</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {mockLogs.filter(l => l.severity === 'info').length}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Warnings</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">
                                {mockLogs.filter(l => l.severity === 'warning').length}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Errors</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {mockLogs.filter(l => l.severity === 'error').length}
                            </p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-800 rounded-lg p-4 border border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-zinc-400" />
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filters:</span>
                    </div>
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Actions</option>
                        <option value="create">Create</option>
                        <option value="update">Update</option>
                        <option value="delete">Delete</option>
                        <option value="export">Export</option>
                    </select>
                    <select
                        value={filterSeverity}
                        onChange={(e) => setFilterSeverity(e.target.value)}
                        className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Severities</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                    </select>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Resource
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                    Severity
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                            {filteredLogs.map((log) => {
                                const severityColor = getSeverityColor(log.severity);

                                return (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-zinc-400" />
                                                <span className="text-sm text-zinc-900 dark:text-white">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-zinc-400" />
                                                <span className="text-sm text-zinc-900 dark:text-white">
                                                    {log.userName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-zinc-400" />
                                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                    {log.companyName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <code className="text-sm font-mono text-zinc-900 dark:text-white">
                                                {log.action}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {log.resource}/{log.resourceId}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium bg-${severityColor}-100 dark:bg-${severityColor}-900/30 text-${severityColor}-800 dark:text-${severityColor}-300 rounded-full capitalize`}>
                                                {log.severity}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="p-8 text-center text-zinc-500">
                        No logs found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemLogsView;
