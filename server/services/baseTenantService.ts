import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { auditService } from './auditService.js';

/**
 * BaseTenantService
 * Abstract base class for all tenant-scoped services
 * Ensures consistent tenant isolation and access validation
 */
export abstract class BaseTenantService {
    protected serviceName: string;

    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }

    /**
     * Validate that a user has access to a specific tenant
     * Throws 403 if access is denied
     */
    protected async validateTenantAccess(userId: string, tenantId: string): Promise<void> {
        // Dynamic import to avoid circular dependency
        const { membershipService } = await import('./membershipService.js');
        const membership = await membershipService.getMembership(userId, tenantId);

        if (!membership || membership.status !== 'active') {
            logger.warn(`Access denied: User ${userId} attempted to access tenant ${tenantId}`);
            throw new AppError('Access denied to this tenant', 403);
        }
    }

    /**
     * Scope a SQL query by tenantId
     * Adds WHERE [alias.]companyId = ? condition
     */
    protected scopeQueryByTenant(baseQuery: string, tenantId: string, tableAlias?: string): { query: string; params: any[] } {
        // If query already has WHERE, add AND
        const hasWhere = baseQuery.toLowerCase().includes('where');
        const connector = hasWhere ? 'AND' : 'WHERE';
        const prefix = tableAlias ? `${tableAlias}.` : '';

        return {
            query: `${baseQuery} ${connector} ${prefix}companyId = ?`,
            params: [tenantId],
        };
    }

    /**
     * Validate cross-resource ownership (e.g., Task belongs to Project which belongs to Tenant)
     */
    protected async validateResourceAccess(
        childTable: string,
        childId: string,
        parentTable: string,
        parentId: string,
        tenantId: string
    ): Promise<void> {
        const db = getDb();

        // Verify child belongs to parent AND parent belongs to tenant
        const query = `
            SELECT c.id FROM ${childTable} c
            JOIN ${parentTable} p ON c.projectId = p.id
            WHERE c.id = ? AND p.id = ? AND p.companyId = ?
        `;

        const row = await db.get(query, [childId, parentId, tenantId]);

        if (!row) {
            throw new AppError(`Access denied: Hierarchical validation failed for ${childTable}:${childId}`, 403);
        }
    }

    /**
     * Validate that a resource belongs to the specified tenant
     * Throws 404 if not found or 403 if belongs to different tenant
     */
    protected async validateResourceTenant(
        tableName: string,
        resourceId: string,
        tenantId: string
    ): Promise<void> {
        const db = getDb();

        const row = await db.get(
            `SELECT companyId FROM ${tableName} WHERE id = ?`,
            [resourceId]
        );

        if (!row) {
            throw new AppError(`Resource not found in ${tableName}`, 404);
        }

        if (row.companyId !== tenantId) {
            logger.warn(
                `Cross-tenant access attempt: Resource ${resourceId} in ${tableName} ` +
                `belongs to ${row.companyId}, user attempted access from ${tenantId}`
            );
            throw new AppError('Access denied to this resource', 403);
        }
    }

    /**
     * Log an audit event for this service
     */
    protected async auditAction(
        action: string,
        userId: string,
        tenantId: string,
        resourceType: string,
        resourceId: string,
        metadata?: any
    ): Promise<void> {
        try {
            await auditService.log({
                userId,
                companyId: tenantId,
                action: `${this.serviceName}.${action}`,
                resource: resourceType,
                resourceId,
                metadata,
                ipAddress: undefined, // Will be set by controller if available
                userAgent: undefined,
            });
        } catch (error) {
            // Don't fail the operation if audit logging fails
            logger.error(`Audit logging failed for ${this.serviceName}.${action}:`, error);
        }
    }

    /**
     * Ensure a record has companyId set
     * Throws error if companyId is missing or doesn't match tenantId
     */
    protected validateRecordTenant(record: any, tenantId: string, recordType: string): void {
        if (!record.companyId) {
            throw new AppError(`${recordType} must have companyId`, 400);
        }

        if (record.companyId !== tenantId) {
            throw new AppError(
                `${recordType} companyId (${record.companyId}) does not match tenant context (${tenantId})`,
                400
            );
        }
    }

    /**
     * Get database instance
     */
    protected getDb() {
        return getDb();
    }
}

export default BaseTenantService;
