import '../types/express.d.ts';
import { Request, Response } from 'express';
import { getDb } from '../database.js';

/**
 * Activity Service
 * Logs and retrieves activity feed entries
 */

/**
 * Log an activity
 */
export const logActivity = async (
    companyId: string,
    projectId: string | null,
    userId: string,
    userName: string,
    action: string,
    entityType: string,
    entityId: string,
    metadata?: any
) => {
    try {
        const db = getDb();
        const { v4: uuidv4 } = await import('uuid');
        const id = uuidv4();

        await db.run(`
      INSERT INTO activity_feed (
        id, company_id, project_id, user_id, user_name,
        action, entity_type, entity_id, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id,
            companyId,
            projectId,
            userId,
            userName,
            action,
            entityType,
            entityId,
            metadata ? JSON.stringify(metadata) : null,
            new Date().toISOString()
        ]);
    } catch (error: any) {
        console.error('Failed to log activity:', error.message);
    }
};

/**
 * Get activity feed
 */
export const getActivityFeed = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const { projectId, entityType, limit = 50, offset = 0 } = req.query;

        let query = `
      SELECT * FROM activity_feed
      WHERE company_id = ?
    `;
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND project_id = ?';
            params.push(projectId as string);
        }

        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType as string);
        }

        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const activities = await db.all(query, params);

        // Parse metadata
        const parsedActivities = activities.map((activity: any) => ({
            ...activity,
            metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
        }));

        res.json(parsedActivities);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Get activity feed for a specific entity
 */
export const getEntityActivity = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const { entityType, entityId } = req.params;

        const activities = await db.all(`
      SELECT * FROM activity_feed
      WHERE company_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `, [companyId, entityType, entityId]);

        // Parse metadata
        const parsedActivities = activities.map((activity: any) => ({
            ...activity,
            metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
        }));

        res.json(parsedActivities);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
