import React from 'react';
import {
    LayoutDashboard, Building2, Users, TrendingUp, AlertCircle,
    DollarSign, Activity, Database, Server, Shield
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

/**
 * PlatformDashboardView
 * Superadmin-only view showing platform-wide metrics and system health
 */
import { db } from '@/services/db';
import { PlatformStats, SystemHealth } from '@/types';

/**
 * PlatformDashboardView
 * Superadmin-only view showing platform-wide metrics and system health
 */
const PlatformDashboardView: React.FC = () => {
    // State for real data
    const [statsData, setStatsData] = React.useState<PlatformStats | null>(null);
    const [healthData, setHealthData] = React.useState<SystemHealth | null>(null);
    const [activityLogs, setActivityLogs] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [stats, health, activity] = await Promise.all([
                    db.getPlatformStats(),
                    db.getSystemHealth(),
                    db.getGlobalActivity()
                ]);
                setStatsData(stats);
                setHealthData(health);
                setActivityLogs(activity);
            } catch (error) {
                console.error('Failed to load platform dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const stats = [
        {
            label: 'Total Companies',
            value: statsData?.totalCompanies || 0,
            change: '-', // Calculate if historical data exists
            trend: 'neutral',
            icon: Building2,
            color: 'blue',
        },
        {
            label: 'Active Users',
            value: statsData?.totalUsers || 0,
            change: '-',
            trend: 'neutral',
            icon: Users,
            color: 'green',
        },
        {
            label: 'Total Projects',
            value: statsData?.totalProjects || 0,
            change: '-',
            trend: 'neutral',
            icon: LayoutDashboard,
            color: 'purple',
        },
        {
            label: 'Monthly Revenue',
            value: `$${(statsData?.monthlyRevenue || 0).toLocaleString()}`,
            change: '-',
            trend: 'neutral',
            icon: DollarSign,
            color: 'emerald',
        },
    ];

    const systemHealth = [
        { name: 'API Server', status: healthData?.api || 'unknown', uptime: `${Math.floor((healthData?.uptime || 0) / 60)}m`, icon: Server },
        { name: 'Database', status: healthData?.database || 'unknown', uptime: 'N/A', icon: Database },
        { name: 'Auth Service', status: 'healthy', uptime: '100%', icon: Shield }, // Mock for now until Auth service exposes health
        { name: 'File Storage', status: 'degraded', uptime: '98.5%', icon: Activity }, // Mock
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                        Platform Dashboard
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                        System-wide metrics and health monitoring
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="font-medium text-purple-900 dark:text-purple-300">
                        Superadmin Mode
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                </div>
                                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.change}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                    {stat.label}
                                </p>
                                <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                                    {stat.value}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* System Health */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {systemHealth.map((service) => {
                        const Icon = service.icon;
                        const isHealthy = service.status === 'healthy';
                        return (
                            <div
                                key={service.name}
                                className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                    <span className="font-medium text-zinc-900 dark:text-white">
                                        {service.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${isHealthy ? 'text-green-600' : 'text-yellow-600'
                                        }`}>
                                        {service.status}
                                    </span>
                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {service.uptime}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Recent Activity
                </h2>
                <div className="space-y-3">
                    {[
                        { company: 'Acme Construction', action: 'New project created', time: '5 min ago' },
                        { company: 'BuildCo Ltd', action: 'User invited', time: '12 min ago' },
                        { company: 'ProBuild Inc', action: 'Subscription upgraded', time: '1 hour ago' },
                        { company: 'MegaConstruct', action: 'Document uploaded', time: '2 hours ago' },
                    ].map((activity, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Building2 className="w-4 h-4 text-zinc-400" />
                                <div>
                                    <p className="font-medium text-zinc-900 dark:text-white">
                                        {activity.company}
                                    </p>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                        {activity.action}
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm text-zinc-500">
                                {activity.time}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    System Alerts
                </h2>
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-yellow-900 dark:text-yellow-300">
                                File Storage Degraded
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                Storage service experiencing intermittent issues. Team investigating.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-300">
                                Scheduled Maintenance
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                Database maintenance scheduled for Dec 25, 2025 at 2:00 AM UTC.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformDashboardView;
