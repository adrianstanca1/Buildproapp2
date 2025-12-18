import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

export interface TenantUsage {
    tenantId: string;
    currentUsers: number;
    currentProjects: number;
    currentStorage: number;
    currentApiCalls: number;
    period: string;
    limit: {
        users: number;
        projects: number;
        storage: number;
        apiCalls: number;
    };
}

export interface TenantAnalytics {
    usage: TenantUsage;
    trends: {
        usersGrowth: number;
        projectsGrowth: number;
        apiCallsGrowth: number;
    };
    topResources: Array<{
        type: string;
        count: number;
    }>;
}

/**
 * Get current usage for a tenant
 */
export async function getTenantUsage(tenantId: string): Promise<TenantUsage> {
    const db = getDb();

    // Get tenant limits
    const companies = await db.all('SELECT * FROM companies WHERE id = ?', [tenantId]);
    if (companies.length === 0) {
        throw new Error('Tenant not found');
    }
    const company = companies[0];

    // Count current resources
    const projectsCount = await db.all(
        'SELECT COUNT(*) as count FROM projects WHERE companyId = ?',
        [tenantId]
    );
    const usersCount = await db.all(
        'SELECT COUNT(*) as count FROM team WHERE companyId = ?',
        [tenantId]
    );

    // Get API calls for current period
    const currentPeriod = new Date().toISOString().substring(0, 7);
    const apiCallsCount = await db.all(
        `SELECT SUM(amount) as count FROM tenant_usage_logs 
     WHERE companyId = ? AND resourceType = 'api_call' 
     AND strftime('%Y-%m', timestamp) = ?`,
        [tenantId, currentPeriod]
    );

    // Get storage usage
    const storageCount = await db.all(
        `SELECT SUM(amount) as count FROM tenant_usage_logs 
     WHERE companyId = ? AND resourceType = 'storage'`,
        [tenantId]
    );

    return {
        tenantId,
        currentUsers: usersCount[0].count || 0,
        currentProjects: projectsCount[0].count || 0,
        currentStorage: storageCount[0]?.count || 0,
        currentApiCalls: apiCallsCount[0]?.count || 0,
        period: currentPeriod,
        limit: {
            users: company.maxUsers || 10,
            projects: company.maxProjects || 5,
            storage: 1024 * 1024 * 1024, // 1GB default
            apiCalls: 10000
        }
    };
}

/**
 * Log resource usage
 */
export async function logUsage(
    tenantId: string,
    resourceType: 'api_call' | 'storage' | 'user' | 'project',
    amount: number = 1,
    metadata?: any
): Promise<void> {
    const db = getDb();
    const id = uuidv4();

    await db.run(
        `INSERT INTO tenant_usage_logs (id, companyId, resourceType, amount, timestamp, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
        [
            id,
            tenantId,
            resourceType,
            amount,
            new Date().toISOString(),
            metadata ? JSON.stringify(metadata) : null
        ]
    );
}

/**
 * Check if tenant has exceeded limits
 */
export async function checkTenantLimits(
    tenantId: string,
    resourceType: 'users' | 'projects' | 'storage' | 'apiCalls'
): Promise<{ allowed: boolean; current: number; limit: number }> {
    const usage = await getTenantUsage(tenantId);

    const current = usage[`current${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}` as keyof TenantUsage] as number;
    const limit = usage.limit[resourceType];

    return {
        allowed: current < limit,
        current,
        limit
    };
}

/**
 * Get tenant analytics with trends
 */
export async function getTenantAnalytics(tenantId: string): Promise<TenantAnalytics> {
    const db = getDb();
    const usage = await getTenantUsage(tenantId);

    // Calculate growth trends (compare to previous period)
    const currentPeriod = new Date().toISOString().substring(0, 7);
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevPeriod = prevDate.toISOString().substring(0, 7);

    const prevApiCalls = await db.all(
        `SELECT SUM(amount) as count FROM tenant_usage_logs 
     WHERE companyId = ? AND resourceType = 'api_call' 
     AND strftime('%Y-%m', timestamp) = ?`,
        [tenantId, prevPeriod]
    );

    const apiCallsGrowth = prevApiCalls[0]?.count
        ? ((usage.currentApiCalls - prevApiCalls[0].count) / prevApiCalls[0].count) * 100
        : 0;

    // Get top resource types
    const topResources = await db.all(
        `SELECT resourceType as type, COUNT(*) as count 
     FROM tenant_usage_logs 
     WHERE companyId = ? 
     GROUP BY resourceType 
     ORDER BY count DESC 
     LIMIT 5`,
        [tenantId]
    );

    return {
        usage,
        trends: {
            usersGrowth: 0, // Would need historical data
            projectsGrowth: 0, // Would need historical data
            apiCallsGrowth
        },
        topResources
    };
}

export default {
    getTenantUsage,
    logUsage,
    checkTenantLimits,
    getTenantAnalytics
};
