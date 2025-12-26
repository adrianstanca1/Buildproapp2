
import { db } from './db';

export interface AuditLogItem {
    id: string;
    timestamp: string;
    userId: string;
    userName: string;
    action: string;
    entityType: 'Project' | 'Task' | 'Financial' | 'Safety' | 'Security';
    entityId: string;
    details: string;
    tenantId: string;
}

class AuditLogService {
    async log(entry: Omit<AuditLogItem, 'id' | 'timestamp'>) {
        const logItem: AuditLogItem = {
            ...entry,
            id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
        };

        // In a real app, this would be a separate high-availability table or external logging service
        const existingLogs = JSON.parse(localStorage.getItem('audit_logs') || '[]');
        localStorage.setItem('audit_logs', JSON.stringify([logItem, ...existingLogs].slice(0, 1000)));

        console.log(`[AuditLog] ${logItem.userName} performed ${logItem.action} on ${logItem.entityType} ${logItem.entityId}`);

        // Also persist to DB if available
        try {
            // await db.addAuditLog(logItem); // Assuming this method exists or will be added
        } catch (e) {
            console.error("Failed to persist audit log to DB", e);
        }
    }

    async getLogs(filters?: { entityType?: string; userId?: string }): Promise<AuditLogItem[]> {
        let logs: AuditLogItem[] = JSON.parse(localStorage.getItem('audit_logs') || '[]');

        if (filters?.entityType) {
            logs = logs.filter(l => l.entityType === filters.entityType);
        }
        if (filters?.userId) {
            logs = logs.filter(l => l.userId === filters.userId);
        }

        return logs;
    }
}

export const auditLog = new AuditLogService();
