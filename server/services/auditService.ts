import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import type { AuditLog, AuditEventDto, AuditFilters } from '../types/rbac.js';

/**
 * AuditService
 * Handles audit logging for compliance and security
 */
export class AuditService {
    /**
     * Log an audit event
     */
    async log(event: AuditEventDto): Promise<void> {
        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        const changes = event.metadata ? JSON.stringify(event.metadata) : null;

        try {
            await db.run(
                `INSERT INTO audit_logs (id, userId, userName, companyId, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    event.userId,
                    'system', // Default userName if not provided in DTO
                    event.companyId,
                    event.action,
                    event.resource,
                    event.resourceId,
                    changes,
                    'success', // Default status
                    now,
                    event.ipAddress,
                    event.userAgent
                ]
            );

            logger.debug(`Audit log created: ${event.action} by ${event.userId}`);
        } catch (error) {
            // Don't throw on audit log failures - log and continue
            logger.error(`Failed to create audit log: ${error}`);
        }
    }

    /**
     * Get audit logs with filtering
     */
    async getAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
        const db = getDb();

        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.userId) {
            conditions.push('userId = ?');
            params.push(filters.userId);
        }

        if (filters.companyId) {
            conditions.push('companyId = ?');
            params.push(filters.companyId);
        }

        if (filters.action) {
            conditions.push('action LIKE ?');
            params.push(`%${filters.action}%`);
        }

        if (filters.resource) {
            conditions.push('resource = ?');
            params.push(filters.resource);
        }

        if (filters.startDate) {
            conditions.push('createdAt >= ?');
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            conditions.push('createdAt <= ?');
            params.push(filters.endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const limit = filters.limit || 100;
        const offset = filters.offset || 0;

        const rows = await db.all(
            `SELECT * FROM audit_logs ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return rows.map(row => this.parseAuditLog(row));
    }

    /**
     * Get audit log count with filtering
     */
    async getAuditLogCount(filters: AuditFilters): Promise<number> {
        const db = getDb();

        const conditions: string[] = [];
        const params: any[] = [];

        if (filters.userId) {
            conditions.push('userId = ?');
            params.push(filters.userId);
        }

        if (filters.companyId) {
            conditions.push('companyId = ?');
            params.push(filters.companyId);
        }

        if (filters.action) {
            conditions.push('action LIKE ?');
            params.push(`%${filters.action}%`);
        }

        if (filters.resource) {
            conditions.push('resource = ?');
            params.push(filters.resource);
        }

        if (filters.startDate) {
            conditions.push('createdAt >= ?');
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            conditions.push('createdAt <= ?');
            params.push(filters.endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await db.get(
            `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
            params
        );

        return result.count;
    }

    /**
     * Export audit logs as CSV
     */
    async exportAuditLogs(filters: AuditFilters): Promise<string> {
        const logs = await this.getAuditLogs({ ...filters, limit: 10000 });

        const headers = ['Timestamp', 'User ID', 'Company ID', 'Action', 'Resource', 'Resource ID', 'IP Address'];
        const rows = logs.map(log => [
            log.createdAt,
            log.userId || '',
            log.companyId || '',
            log.action,
            log.resource || '',
            log.resourceId || '',
            log.ipAddress || '',
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        return csv;
    }

    /**
     * Delete old audit logs (for cleanup)
     */
    async deleteOldLogs(olderThan: string): Promise<number> {
        const db = getDb();

        const result = await db.run(
            'DELETE FROM audit_logs WHERE createdAt < ?',
            [olderThan]
        );

        logger.info(`Deleted ${result.changes} old audit logs`);
        return result.changes || 0;
    }

    /**
     * Parse database row to AuditLog object
     */
    private parseAuditLog(row: any): AuditLog {
        return {
            ...row,
            metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        };
    }
}

// Export singleton instance
export const auditService = new AuditService();

