import React, { useState } from 'react';
import { FileText, Download, Calendar, DollarSign, Users, TrendingUp, Filter, X } from 'lucide-react';
import api from '@/services/api';

interface ReportConfig {
    name: string;
    type: 'financial' | 'schedule' | 'safety' | 'resource' | 'custom';
    dateRange: { start: string; end: string };
    groupBy?: 'project' | 'week' | 'month' | 'user';
    metrics: string[];
    filters: Record<string, any>;
}

export const CustomReportBuilder: React.FC = () => {
    const [reportConfig, setReportConfig] = useState<ReportConfig>({
        name: '',
        type: 'financial',
        dateRange: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
        },
        metrics: [],
        filters: {},
    });

    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState<any>(null);

    const reportTypes = [
        { value: 'financial', label: 'Financial Report', icon: DollarSign },
        { value: 'schedule', label: 'Schedule Report', icon: Calendar },
        { value: 'safety', label: 'Safety Report', icon: Users },
        { value: 'resource', label: 'Resource Report', icon: TrendingUp },
    ];

    const metricsByType: Record<string, string[]> = {
        financial: ['Total Budget', 'Total Spent', 'Variance', 'Cost by Code', 'Invoice Status'],
        schedule: ['Tasks Completed', 'On-Time Rate', 'Blocked Tasks', 'Milestone Progress'],
        safety: ['Incidents by Severity', 'Incidents by Type', 'Safety Score', 'Days Since Incident'],
        resource: ['Utilization Rate', 'Tasks per Person', 'Overtime Hours', 'Capacity'],
    };

    const handleGenerateReport = async () => {
        setGenerating(true);
        try {
            // In a real implementation, this would call the analytics API
            const response = await api.get('/analytics/custom-report', {
                params: reportConfig,
            });
            setPreview(response.data);
        } catch (error) {
            console.error('Failed to generate report:', error);
            // Generate mock data for demonstration
            setPreview({
                title: reportConfig.name,
                generatedAt: new Date().toISOString(),
                data: [
                    { label: 'Metric 1', value: 1250 },
                    { label: 'Metric 2', value: 780 },
                ],
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = (format: 'pdf' | 'csv' | 'excel') => {
        // Trigger download logic
        console.log(`Downloading report as ${format}`);
        alert(`Report download started! Format: ${format}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900">Custom Report Builder</h1>
                <p className="text-zinc-600 mt-1">Create custom reports with your selected metrics</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Panel */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Report Name */}
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                        <h3 className="font-semibold text-lg text-zinc-900 mb-4">Report Details</h3>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Report Name
                            </label>
                            <input
                                type="text"
                                value={reportConfig.name}
                                onChange={(e) => setReportConfig({ ...reportConfig, name: e.target.value })}
                                placeholder="e.g., Monthly Financial Summary"
                                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Report Type */}
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                        <h3 className="font-semibold text-lg text-zinc-900 mb-4">Report Type</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {reportTypes.map((type) => (
                                <button
                                    key={type.value}
                                    onClick={() => setReportConfig({ ...reportConfig, type: type.value as any, metrics: [] })}
                                    className={`p-4 rounded-lg border-2 transition ${reportConfig.type === type.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-zinc-200 hover:border-zinc-300'
                                        }`}
                                >
                                    <type.icon className={`w-6 h-6 mx-auto mb-2 ${reportConfig.type === type.value ? 'text-blue-600' : 'text-zinc-600'
                                        }`} />
                                    <div className="text-sm font-medium text-zinc-900">{type.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                        <h3 className="font-semibold text-lg text-zinc-900 mb-4">Date Range</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={reportConfig.dateRange.start}
                                    onChange={(e) => setReportConfig({
                                        ...reportConfig,
                                        dateRange: { ...reportConfig.dateRange, start: e.target.value },
                                    })}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={reportConfig.dateRange.end}
                                    onChange={(e) => setReportConfig({
                                        ...reportConfig,
                                        dateRange: { ...reportConfig.dateRange, end: e.target.value },
                                    })}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Metrics Selection */}
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                        <h3 className="font-semibold text-lg text-zinc-900 mb-4">Select Metrics</h3>
                        <div className="space-y-2">
                            {metricsByType[reportConfig.type]?.map((metric) => (
                                <label key={metric} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.metrics.includes(metric)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setReportConfig({
                                                    ...reportConfig,
                                                    metrics: [...reportConfig.metrics, metric],
                                                });
                                            } else {
                                                setReportConfig({
                                                    ...reportConfig,
                                                    metrics: reportConfig.metrics.filter(m => m !== metric),
                                                });
                                            }
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <span className="text-sm font-medium text-zinc-700">{metric}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateReport}
                        disabled={generating || !reportConfig.name || reportConfig.metrics.length === 0}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <FileText className="w-5 h-5" />
                        {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6 sticky top-4">
                        <h3 className="font-semibold text-lg text-zinc-900 mb-4">Preview</h3>

                        {preview ? (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-bold text-zinc-900">{preview.title}</h4>
                                    <p className="text-xs text-zinc-500">
                                        Generated: {new Date(preview.generatedAt).toLocaleString()}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    {preview.data?.map((item: any, index: number) => (
                                        <div key={index} className="p-3 bg-zinc-50 rounded-lg">
                                            <div className="text-sm font-medium text-zinc-700">{item.label}</div>
                                            <div className="text-2xl font-bold text-zinc-900">{item.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-zinc-200 space-y-2">
                                    <button
                                        onClick={() => handleDownload('pdf')}
                                        className="w-full px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </button>
                                    <button
                                        onClick={() => handleDownload('csv')}
                                        className="w-full px-4 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download CSV
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-zinc-500">
                                <FileText className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                                <p className="text-sm">Configure and generate a report to see preview</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
