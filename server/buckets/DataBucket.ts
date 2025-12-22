import { getDb } from '../database.js';
import { auditService } from '../services/auditService.js';

/**
 * DataBucket - Tenant-scoped data access abstraction
 * Ensures all queries are automatically scoped by tenantId
 * Prevents cross-tenant data leakage
 */

export interface QueryFilters {
    [key: string]: any;
}

export interface QueryOptions {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
}

export class DataBucket {
    constructor(
        private tableName: string,
        private tenantColumn: string = 'companyId'
    ) { }

    /**
     * Build WHERE clause with tenant scoping
     */
    private buildWhereClause(
        tenantId: string,
        filters?: QueryFilters
    ): { sql: string; params: any[] } {
        const conditions: string[] = [`${this.tenantColumn} = ?`];
        const params: any[] = [tenantId];

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    conditions.push(`${key} = ?`);
                    params.push(value);
                }
            });
        }

        return {
            sql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
            params,
        };
    }

    /**
     * Query records scoped to tenant
     */
    async query(
        tenantId: string,
        filters?: QueryFilters,
        options?: QueryOptions
    ): Promise<any[]> {
        const db = getDb();
        const { sql: whereClause, params } = this.buildWhereClause(tenantId, filters);

        let query = `SELECT * FROM ${this.tableName} ${whereClause}`;

        if (options?.orderBy) {
            query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
        }

        if (options?.limit) {
            query += ` LIMIT ${options.limit}`;
            if (options?.offset) {
                query += ` OFFSET ${options.offset}`;
            }
        }

        return db.all(query, params);
    }

    /**
     * Get single record by ID (tenant-scoped)
     */
    async getById(tenantId: string, id: string): Promise<any | undefined> {
        const db = getDb();
        const { sql: whereClause, params } = this.buildWhereClause(tenantId, { id });

        const query = `SELECT * FROM ${this.tableName} ${whereClause} LIMIT 1`;
        return db.get(query, params);
    }

    /**
     * Create record (forces tenant ID)
     */
    async create(
        tenantId: string,
        data: Record<string, any>,
        userId?: string
    ): Promise<any> {
        const db = getDb();

        // Force tenant ID - client cannot override
        const record = {
            ...data,
            [this.tenantColumn]: tenantId,
        };

        const columns = Object.keys(record);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(record);

        const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

        const result = await db.run(query, values);

        // Audit log
        if (userId) {
            await auditService.logAction({
                userId,
                companyId: tenantId,
                action: 'create',
                resource: this.tableName,
                resourceId: record.id || result.lastID?.toString(),
                metadata: { data: record },
            });
        }

        return { ...record, id: record.id || result.lastID };
    }

    /**
     * Update record (validates tenant ownership)
     */
    async update(
        tenantId: string,
        id: string,
        updates: Record<string, any>,
        userId?: string
    ): Promise<boolean> {
        const db = getDb();

        // Verify record belongs to tenant
        const existing = await this.getById(tenantId, id);
        if (!existing) {
            throw new Error(`Record not found or access denied`);
        }

        // Prevent tenant ID modification
        const safeUpdates = { ...updates };
        delete safeUpdates[this.tenantColumn];

        const setClause = Object.keys(safeUpdates)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = [...Object.values(safeUpdates), tenantId, id];

        const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE ${this.tenantColumn} = ? AND id = ?
    `;

        await db.run(query, values);

        // Audit log
        if (userId) {
            await auditService.logAction({
                userId,
                companyId: tenantId,
                action: 'update',
                resource: this.tableName,
                resourceId: id,
                metadata: { updates: safeUpdates },
            });
        }

        return true;
    }

    /**
     * Delete record (validates tenant ownership)
     */
    async delete(tenantId: string, id: string, userId?: string): Promise<boolean> {
        const db = getDb();

        // Verify record belongs to tenant
        const existing = await this.getById(tenantId, id);
        if (!existing) {
            throw new Error(`Record not found or access denied`);
        }

        const query = `
      DELETE FROM ${this.tableName}
      WHERE ${this.tenantColumn} = ? AND id = ?
    `;

        await db.run(query, [tenantId, id]);

        // Audit log
        if (userId) {
            await auditService.logAction({
                userId,
                companyId: tenantId,
                action: 'delete',
                resource: this.tableName,
                resourceId: id,
                metadata: { deleted: existing },
            });
        }

        return true;
    }

    /**
     * Count records for tenant
     */
    async count(tenantId: string, filters?: QueryFilters): Promise<number> {
        const db = getDb();
        const { sql: whereClause, params } = this.buildWhereClause(tenantId, filters);

        const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
        const result = await db.get<{ count: number }>(query, params);

        return result?.count || 0;
    }

    /**
     * Validate record belongs to tenant
     */
    async validateOwnership(tenantId: string, id: string): Promise<boolean> {
        const record = await this.getById(tenantId, id);
        return !!record;
    }
}

/**
 * Bucket Registry - Central registry for all data buckets
 */
export class BucketRegistry {
    private static buckets: Map<string, DataBucket> = new Map();

    static register(name: string, bucket: DataBucket): void {
        this.buckets.set(name, bucket);
    }

    static get(name: string): DataBucket | undefined {
        return this.buckets.get(name);
    }

    static getOrCreate(tableName: string, tenantColumn?: string): DataBucket {
        const key = `${tableName}:${tenantColumn || 'companyId'}`;

        if (!this.buckets.has(key)) {
            this.buckets.set(key, new DataBucket(tableName, tenantColumn));
        }

        return this.buckets.get(key)!;
    }
}

// Pre-register common buckets
BucketRegistry.register('projects', new DataBucket('projects', 'companyId'));
BucketRegistry.register('tasks', new DataBucket('tasks', 'companyId'));
BucketRegistry.register('documents', new DataBucket('documents', 'companyId'));
BucketRegistry.register('transactions', new DataBucket('transactions', 'companyId'));
