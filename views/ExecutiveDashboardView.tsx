import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import api from '@/services/api';

interface ExecutiveKPIs {
    activeProjects: number;
    budgetHealth: {
        totalBudget: number;
        totalSpent: number;
        variance: number;
        percentageUsed: string;
    };
    safetyScore: number;
    teamVelocity: number;
    openRFIs: number;
}

export const ExecutiveDashboard: React.FC = () => {
    const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadKPIs();
        // Refresh every 5 minutes
        const interval = setInterval(loadKPIs, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const loadKPIs = async () => {
        try {
            const response = await api.get('/analytics/kpis');
            setKpis(response.data);
        } catch (error) {
            console.error('Failed to load KPIs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 animate-pulse">
                        <div className="h-4 bg-zinc-200 rounded w-1/2 mb-4" />
                        <div className="h-8 bg-zinc-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-zinc-100 rounded w-1/3" />
                    </div>
                ))}
            </div>
        );
    }

    if (!kpis) return null;

    const budgetPercentage = parseFloat(kpis.budgetHealth.percentageUsed);
    const isBudgetHealthy = budgetPercentage < 90;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Executive Dashboard</h1>
                <p className="text-zinc-600 mt-1">Real-time insights across all projects</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Active Projects */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Active Projects</p>
                            <p className="text-4xl font-bold mt-2">{kpis.activeProjects}</p>
                            <p className="text-blue-100 text-sm mt-2">Currently in progress</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Budget Health */}
                <div className={`bg-gradient-to-br ${isBudgetHealthy ? 'from-green-500 to-green-600' : 'from-amber-500 to-amber-600'} rounded-xl shadow-lg p-6 text-white`}>
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/90 text-sm font-medium">Budget Health</p>
                            <p className="text-4xl font-bold mt-2">{budgetPercentage}%</p>
                            <p className="text-white/90 text-sm mt-2">
                                {formatCurrency(kpis.budgetHealth.totalSpent)} of {formatCurrency(kpis.budgetHealth.totalBudget)}
                            </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Safety Score */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Safety Score</p>
                            <p className="text-4xl font-bold mt-2">{kpis.safetyScore}/100</p>
                            <p className="text-purple-100 text-sm mt-2">
                                {kpis.safetyScore >= 90 ? 'Excellent' : kpis.safetyScore >= 70 ? 'Good' : 'Needs Attention'}
                            </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            {kpis.safetyScore >= 70 ? (
                                <CheckCircle className="w-6 h-6" />
                            ) : (
                                <AlertTriangle className="w-6 h-6" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Team Velocity */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Team Velocity</p>
                            <p className="text-4xl font-bold mt-2">{kpis.teamVelocity}</p>
                            <p className="text-indigo-100 text-sm mt-2">Tasks completed this month</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Open RFIs */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Open RFIs</p>
                            <p className="text-4xl font-bold mt-2">{kpis.openRFIs}</p>
                            <p className="text-orange-100 text-sm mt-2">Require attention</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Budget Variance */}
                <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-cyan-100 text-sm font-medium">Budget Variance</p>
                            <p className="text-4xl font-bold mt-2">
                                {formatCurrency(Math.abs(kpis.budgetHealth.variance))}
                            </p>
                            <p className="text-cyan-100 text-sm mt-2 flex items-center gap-1">
                                {kpis.budgetHealth.variance >= 0 ? (
                                    <>
                                        <TrendingUp className="w-4 h-4" />
                                        Under budget
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="w-4 h-4" />
                                        Over budget
                                    </>
                                )}
                            </p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions or Additional Charts */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">Quick Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-lg">
                        <p className="text-sm text-zinc-600">Budget Utilization</p>
                        <div className="mt-2 bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div
                                className={`h-full ${isBudgetHealthy ? 'bg-green-600' : 'bg-amber-600'} transition-all duration-500`}
                                style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{budgetPercentage}% used</p>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg">
                        <p className="text-sm text-zinc-600">Safety Performance</p>
                        <div className="mt-2 bg-zinc-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="h-full bg-purple-600 transition-all duration-500"
                                style={{ width: `${kpis.safetyScore}%` }}
                            />
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">{kpis.safetyScore}/100 score</p>
                    </div>

                    <div className="p-4 bg-zinc-50 rounded-lg">
                        <p className="text-sm text-zinc-600">RFI Resolution Rate</p>
                        <div className="mt-2 flex items-center justify-between">
                            <span className="text-2xl font-bold text-zinc-900">{kpis.openRFIs}</span>
                            <span className="text-sm text-zinc-600">pending</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
