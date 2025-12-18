import React from 'react';
import { Activity, Users, Briefcase, Database, TrendingUp, AlertCircle } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

export function TenantUsageWidget() {
    const { tenantUsage } = useTenant();

    if (!tenantUsage) {
        return null;
    }

    const getUsagePercentage = (current: number, limit: number) => {
        return Math.min((current / limit) * 100, 100);
    };

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const metrics = [
        {
            label: 'Users',
            icon: Users,
            current: tenantUsage.currentUsers,
            limit: tenantUsage.limit.users,
            color: 'blue'
        },
        {
            label: 'Projects',
            icon: Briefcase,
            current: tenantUsage.currentProjects,
            limit: tenantUsage.limit.projects,
            color: 'purple'
        },
        {
            label: 'Storage',
            icon: Database,
            current: Math.round(tenantUsage.currentStorage / (1024 * 1024)),
            limit: Math.round(tenantUsage.limit.storage / (1024 * 1024)),
            unit: 'MB',
            color: 'green'
        },
        {
            label: 'API Calls',
            icon: Activity,
            current: tenantUsage.currentApiCalls,
            limit: tenantUsage.limit.apiCalls,
            color: 'orange'
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Resource Usage
                </h3>
                <span className="text-xs text-gray-500">Period: {tenantUsage.period}</span>
            </div>

            <div className="space-y-4">
                {metrics.map((metric) => {
                    const percentage = getUsagePercentage(metric.current, metric.limit);
                    const isNearLimit = percentage >= 75;
                    const Icon = metric.icon;

                    return (
                        <div key={metric.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 text-${metric.color}-600`} />
                                    <span className="text-sm font-medium text-gray-700">{metric.label}</span>
                                    {isNearLimit && (
                                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                                    )}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {metric.current} / {metric.limit} {metric.unit || ''}
                                </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full ${getUsageColor(percentage)} transition-all duration-500 rounded-full`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>

                            {isNearLimit && (
                                <p className="text-xs text-yellow-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Approaching limit ({percentage.toFixed(0)}%)
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            {metrics.some(m => getUsagePercentage(m.current, m.limit) >= 90) && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                        ⚠️ You're approaching your plan limits
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                        Consider upgrading your plan to avoid service interruptions
                    </p>
                    <button className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
                        Upgrade Plan
                    </button>
                </div>
            )}
        </div>
    );
}
