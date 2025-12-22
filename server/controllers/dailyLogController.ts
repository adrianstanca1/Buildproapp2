import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

export const getDailyLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.context!;
        // Optional: Filter by project if provided in query
        const projectId = req.query.projectId as string;

        let sql = 'SELECT * FROM daily_logs WHERE companyId = ?';
        const params = [tenantId];

        if (projectId) {
            sql += ' AND projectId = ?';
            params.push(projectId);
        }

        sql += ' ORDER BY date DESC, createdBy DESC';

        const db = getDb();
        const logs = await db.all(sql, params);
        res.json(logs);
    } catch (error) {
        logger.error('Error fetching daily logs:', error);
        res.status(500).json({ error: 'Failed to fetch daily logs' });
    }
};

export const createDailyLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId, userId } = req.context!;
        const name = req.userName || 'Unknown';
        const { projectId, date, weather, temperature, workforce, activities, equipment, delays, safetyIssues, notes } = req.body;

        if (!projectId || !date) {
            res.status(400).json({ error: 'Project ID and Date are required' });
            return;
        }

        const id = randomUUID();
        const db = getDb();
        await db.run(
            `INSERT INTO daily_logs (
                id, companyId, projectId, date, weather, temperature, workforce, 
                activities, equipment, delays, safetyIssues, notes, createdBy, status, attachments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?)`,
            [
                id, tenantId, projectId, date, weather, temperature, workforce || 0,
                activities || '', equipment || '', delays || '', safetyIssues || '', notes || '', name,
                JSON.stringify(req.body.attachments || [])
            ]
        );

        res.status(201).json({ id, status: 'Draft' });
    } catch (error) {
        logger.error('Error creating daily log:', error);
        res.status(500).json({ error: 'Failed to create daily log' });
    }
};

export const updateDailyLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tenantId } = req.context!;
        const name = req.userName || 'Unknown';
        const updates = req.body;

        const db = getDb();
        const existing = await db.get('SELECT * FROM daily_logs WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!existing) {
            res.status(404).json({ error: 'Daily Log not found' });
            return;
        }

        // Handle Signing specifically
        if (updates.status === 'Signed' && existing.status !== 'Signed') {
            await db.run(
                'UPDATE daily_logs SET status = ?, signedBy = ?, signedAt = ? WHERE id = ?',
                ['Signed', name, new Date().toISOString(), id]
            );
            res.json({ message: 'Daily Log signed successfully' });
            return;
        }

        // Generic Updates (only if not signed, usually)
        if (existing.status === 'Signed' && !updates.force) {
            res.status(403).json({ error: 'Cannot edit a signed log' });
            return;
        }

        // Construct dynamic update
        const allowedFields = ['weather', 'temperature', 'workforce', 'activities', 'equipment', 'delays', 'safetyIssues', 'notes', 'attachments'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
            const values = fieldsToUpdate.map(field => updates[field]);
            values.push(id);

            await db.run(`UPDATE daily_logs SET ${setClause} WHERE id = ?`, values);
        }

        res.json({ message: 'Daily Log updated' });
    } catch (error) {
        logger.error('Error updating daily log:', error);
        res.status(500).json({ error: 'Failed to update daily log' });
    }
};

export const getDailyLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tenantId } = req.context!;

        const db = getDb();
        const log = await db.get('SELECT * FROM daily_logs WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!log) {
            res.status(404).json({ error: 'Daily log not found' });
            return;
        }
        res.json(log);
    } catch (error) {
        logger.error('Error fetching daily log:', error);
        res.status(500).json({ error: 'Failed to fetch daily log' });
    }
};
