import React, { useState, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Users, Clock } from 'lucide-react';
import { useProjects } from '@/contexts/ProjectContext';
import { useTenant } from '@/contexts/TenantContext';
import { calculateResourceUtilization } from '@/utils/criticalPath';

export const ResourceCalendarView: React.FC = () => {
    const { tasks } = useProjects();
    const { workforce } = useTenant();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Calculate date range
    const { startDate, endDate, dateRange } = useMemo(() => {
        const start = new Date(currentDate);
        const end = new Date(currentDate);

        if (viewMode === 'week') {
            start.setDate(start.getDate() - start.getDay()); // Start of week
            end.setDate(start.getDate() + 6); // End of week
        } else {
            start.setDate(1); // Start of month
            end.setMonth(end.getMonth() + 1);
            end.setDate(0); // Last day of month
        }

        const range: Date[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            range.push(new Date(d));
        }

        return { startDate: start, endDate: end, dateRange: range };
    }, [currentDate, viewMode]);

    // Calculate utilization
    const utilization = useMemo(() => {
        return calculateResourceUtilization(tasks, startDate, endDate);
    }, [tasks, startDate, endDate]);

    const getUtilization = (date: Date, resource: string): number => {
        const dateKey = date.toISOString().split('T')[0];
        const dayUtil = utilization.get(dateKey);
        return dayUtil?.get(resource) || 0;
    };

    const getUtilizationColor = (hours: number): string => {
        if (hours === 0) return 'bg-zinc-100';
        if (hours <= 4) return 'bg-green-200';
        if (hours <= 8) return 'bg-blue-300';
        if (hours <= 12) return 'bg-amber-300';
        return 'bg-red-300';
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const days = viewMode === 'week' ? 7 : 30;
        newDate.setDate(newDate.getDate() + (direction === 'next' ? days : -days));
        setCurrentDate(newDate);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900">Resource Calendar</h1>
                    <p className="text-zinc-600 mt-1">Team capacity and utilization</p>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-3">
                    <div className="flex bg-zinc-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'week'
                                ? 'bg-white shadow text-zinc-900'
                                : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'month'
                                ? 'bg-white shadow text-zinc-900'
                                : 'text-zinc-600 hover:text-zinc-900'
                                }`}
                        >
                            Month
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-zinc-200 p-4">
                <button
                    onClick={() => navigateWeek('prev')}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-zinc-600" />
                    <span className="font-semibold text-lg">
                        {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                </div>

                <button
                    onClick={() => navigateWeek('next')}
                    className="p-2 hover:bg-zinc-100 rounded-lg transition"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b border-zinc-200 bg-zinc-50">
                    <div className="p-4 font-semibold text-sm text-zinc-700">
                        <Users className="w-4 h-4 inline mr-2" />
                        Resource
                    </div>
                    {dateRange.map((date, idx) => (
                        <div key={idx} className="p-4 text-center border-l border-zinc-200">
                            <div className="text-xs text-zinc-500">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="text-sm font-semibold text-zinc-900">
                                {date.getDate()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resource Rows */}
                {workforce.map((worker) => (
                    <div key={worker.id} className="grid grid-cols-8 border-b border-zinc-200 last:border-b-0">
                        <div className="p-4 font-medium text-sm text-zinc-900 flex items-center gap-2 border-r border-zinc-200">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                {worker.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <div>{worker.name}</div>
                                <div className="text-xs text-zinc-500">{worker.role}</div>
                            </div>
                        </div>

                        {dateRange.map((date, idx) => {
                            const hours = getUtilization(date, worker.name);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                            return (
                                <div
                                    key={idx}
                                    className={`p-2 border-l border-zinc-200 relative ${isToday ? 'bg-blue-50' : isWeekend ? 'bg-zinc-50' : ''
                                        }`}
                                >
                                    <div
                                        className={`h-full rounded flex flex-col items-center justify-center ${getUtilizationColor(hours)}`}
                                        title={`${hours} hours allocated`}
                                    >
                                        {hours > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span className="text-xs font-semibold">{hours}h</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-4">
                <div className="flex items-center gap-6">
                    <span className="text-sm font-medium text-zinc-700">Utilization:</span>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-zinc-100 border border-zinc-300" />
                            <span className="text-xs text-zinc-600">0h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-200" />
                            <span className="text-xs text-zinc-600">1-4h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-blue-300" />
                            <span className="text-xs text-zinc-600">5-8h</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-300" />
                            <span className="text-xs text-zinc-600">9-12h (Overtime)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-300" />
                            <span className="text-xs text-zinc-600">12h+ (Overloaded)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
