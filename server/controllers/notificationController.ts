
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Get recent system events (platform alerts)
 */
export const getSystemEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const limit = parseInt(req.query.limit as string) || 50;

        const events = await db.all(
            `SELECT * FROM system_events 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [limit]
        );

        // Parse metadata JSON
        const parsedEvents = events.map(event => ({
            ...event,
            metadata: event.metadata ? JSON.parse(event.metadata) : null,
            is_read: Boolean(event.is_read)
        }));

        res.json(parsedEvents);
    } catch (e) {
        next(e);
    }
};

/**
 * Mark an event as read
 */
export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const db = getDb();

        await db.run('UPDATE system_events SET is_read = 1 WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Mark all events as read
 */
export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        await db.run('UPDATE system_events SET is_read = 1');
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Delete old events
 */
export const clearEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        // Clear events older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        await db.run('DELETE FROM system_events WHERE created_at < ?', [thirtyDaysAgo]);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};
