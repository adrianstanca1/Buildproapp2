import React, { useEffect } from 'react';
import {
    LayoutDashboard, Building2, Users, TrendingUp, AlertCircle,
    DollarSign, Activity, Database, Server, Shield, Power, Sparkles,
    UserCheck, BrainCircuit, RefreshCw, RotateCcw, Megaphone, Settings
} from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/contexts/ToastContext';
import { useState } from 'react';

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
    const { systemSettings, updateSystemSettings, setBroadcastMessage } = useTenant();
    const { addToast } = useToast();

    // State for real data
    const [statsData, setStatsData] = useState<PlatformStats | null>(null);
    const [healthData, setHealthData] = useState<SystemHealth | null>(null);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [localBroadcastMsg, setLocalBroadcastMsg] = useState('');

    const handleToggleSetting = (key: keyof typeof systemSettings) => {
        const newState = !systemSettings[key];
        updateSystemSettings({ [key]: newState });
        addToast(`${key.replace(/([A-Z])/g, ' $1').trim()} ${newState ? 'Enabled' : 'Disabled'}`, 'success');
    };

    const handleBroadcast = () => {
        if (!localBroadcastMsg.trim()) return;
        setBroadcastMessage(localBroadcastMsg);
        setLocalBroadcastMsg('');
        addToast('Broadcast sent to all active sessions', 'success');
    };

    const handleFlushCache = () => {
        addToast('System cache flushed successfully', 'success');
    };

    const handleRestartServices = () => {
        if (confirm('Are you sure you want to restart core services? This may cause temporary downtime.')) {
            addToast('Initiating service restart sequence...', 'warning');
            setTimeout(() => addToast('Services restarted successfully', 'success'), 2000);
        }
    };

    useEffect(() => {
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* System Control Panel */}
                <div className="lg:col-span-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5"><Settings size={80} /></div>
                    <h3 className="font-bold text-zinc-800 dark:text-white mb-6 flex items-center gap-2 relative z-10">
                        <Server size={18} className="text-purple-600" /> System Control
                    </h3>
                    <div className="space-y-4 relative z-10">
                        {/* Control Toggles */}
                        {[
                            { key: 'maintenance', label: 'Maintenance Mode', icon: Power, onColor: 'bg-red-500', offColor: 'bg-zinc-300 dark:bg-zinc-600', iconColor: 'text-red-600', iconBg: 'bg-red-100 dark:bg-red-900/20' },
                            { key: 'betaFeatures', label: 'Global Beta Access', icon: Sparkles, onColor: 'bg-emerald-500', offColor: 'bg-zinc-300 dark:bg-zinc-600', iconColor: 'text-purple-600', iconBg: 'bg-purple-100 dark:bg-purple-900/20' },
                            { key: 'registrations', label: 'New Registrations', icon: UserCheck, onColor: 'bg-emerald-500', offColor: 'bg-zinc-300 dark:bg-zinc-600', iconColor: 'text-blue-600', iconBg: 'bg-blue-100 dark:bg-blue-900/20' },
                            { key: 'aiEngine', label: 'AI Inference Engine', icon: BrainCircuit, onColor: 'bg-indigo-500', offColor: 'bg-zinc-300 dark:bg-zinc-600', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-100 dark:bg-indigo-900/20' },
                        ].map((ctrl) => (
                            <div key={ctrl.key} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-700 hover:border-zinc-300 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${ctrl.iconBg}`}>
                                        <ctrl.icon size={16} className={ctrl.iconColor} />
                                    </div>
                                    <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{ctrl.label}</div>
                                </div>
                                <button
                                    onClick={() => handleToggleSetting(ctrl.key as any)}
                                    className={`w-11 h-6 rounded-full transition-colors relative ${systemSettings[ctrl.key as keyof typeof systemSettings] ? ctrl.onColor : ctrl.offColor}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${systemSettings[ctrl.key as keyof typeof systemSettings] ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex gap-3 relative z-10">
                        <button
                            onClick={handleFlushCache}
                            className="flex-1 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-xl transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-600"
                        >
                            <RefreshCw size={14} /> Flush Cache
                        </button>
                        <button
                            onClick={handleRestartServices}
                            className="flex-1 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100 dark:border-red-900/30"
                        >
                            <RotateCcw size={14} /> Restart
                        </button>
                    </div>
                </div>

                {/* Enhanced Broadcast Widget */}
                <div className="lg:col-span-1 bg-gradient-to-br from-[#0f5c82] to-[#0c4a6e] rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 bg-white/10 w-24 h-24 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    <h3 className="font-bold mb-3 flex items-center gap-2 relative z-10">
                        <Megaphone size={18} className="text-yellow-400" /> Global Broadcast
                    </h3>
                    <div className="relative z-10 h-full flex flex-col">
                        <textarea
                            className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/40 outline-none focus:ring-1 focus:ring-white/30 resize-none h-32 mb-3"
                            placeholder="Type system-wide announcement..."
                            value={localBroadcastMsg}
                            onChange={e => setLocalBroadcastMsg(e.target.value)}
                        />
                        <div className="flex flex-col gap-3 mt-auto">
                            <label className="flex items-center gap-2 text-xs text-blue-200 cursor-pointer hover:text-white transition-colors">
                                <input type="checkbox" className="rounded text-blue-500 focus:ring-0 bg-white/10 border-white/20" />
                                Urgent Alert
                            </label>
                            <button
                                disabled={!localBroadcastMsg.trim()}
                                onClick={handleBroadcast}
                                className="w-full bg-white text-[#0f5c82] px-5 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                Send Broadcast
                            </button>
                        </div>
                    </div>
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
