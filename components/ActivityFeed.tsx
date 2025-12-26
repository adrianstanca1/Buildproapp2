import React, { useState, useEffect } from 'react';
import { Activity, Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '@/services/db';

interface ActivityItem {
    id: string;
    user_name: string;
    action: string;
    entity_type: string;
    entity_id: string;
    metadata?: any;
    created_at: string;
}

interface ActivityFeedProps {
    projectId?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
    projectId,
    entityType,
    entityId,
    limit = 50,
}) => {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadActivities();

        // Refresh every 30 seconds
        const interval = setInterval(loadActivities, 30000);
        return () => clearInterval(interval);
    }, [projectId, entityType, entityId]);

    const loadActivities = async () => {
        try {
            const data = await db.getActivities({ limit, projectId, entityType });
            setActivities(data);
        } catch (error) {
            console.error('Failed to load activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'created':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'updated':
                return <Activity className="w-4 h-4 text-blue-600" />;
            case 'deleted':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            case 'commented':
                return <FileText className="w-4 h-4 text-purple-600" />;
            default:
                return <Activity className="w-4 h-4 text-zinc-600" />;
        }
    };

    const formatAction = (activity: ActivityItem) => {
        const entityLabel = activity.entity_type.replace('_', ' ');
        return (
            <span className="text-sm text-zinc-700">
                <span className="font-semibold text-zinc-900">{activity.user_name}</span>
                {' '}
                <span className="text-zinc-600">{activity.action}</span>
                {' '}
                <span className="font-medium text-zinc-800">{entityLabel}</span>
            </span>
        );
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-8">
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                            <div className="w-10 h-10 bg-zinc-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                                <div className="h-3 bg-zinc-100 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-zinc-600" />
                <h3 className="font-semibold text-zinc-900">Activity Feed</h3>
            </div>

            {/* Activity List */}
            <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 text-zinc-300" />
                        <p className="text-sm">No recent activity</p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="p-4 hover:bg-zinc-50 transition">
                            <div className="flex gap-3">
                                {/* Avatar/Icon */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    {getActionIcon(activity.action)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            {formatAction(activity)}
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-1 text-xs text-zinc-500">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(activity.created_at)}
                                        </div>
                                    </div>

                                    {activity.metadata && (
                                        <div className="mt-1 text-xs text-zinc-500">
                                            {JSON.stringify(activity.metadata)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
