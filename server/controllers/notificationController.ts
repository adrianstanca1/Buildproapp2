
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
             ORDER BY createdAt DESC 
             LIMIT ?`,
            [limit]
        );

        // Parse metadata JSON
        const parsedEvents = events.map(event => ({
            ...event,
            metadata: event.metadata ? JSON.parse(event.metadata) : null,
            isRead: Boolean(event.isRead)
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

        await db.run('UPDATE system_events SET isRead = 1 WHERE id = ?', [id]);
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
        await db.run('UPDATE system_events SET isRead = 1');
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
        await db.run('DELETE FROM system_events WHERE createdAt < ?', [thirtyDaysAgo]);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Get notifications for the current user
 */
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const userId = (req as any).user?.id;
        const companyId = req.headers['x-company-id'];

        if (!userId) throw new AppError('Unauthorized', 401);

        let sql = 'SELECT * FROM notifications WHERE userId = ?';
        const params: any[] = [userId];

        if (companyId) {
            sql += ' AND companyId = ?';
            params.push(companyId);
        }

        sql += ' ORDER BY createdAt DESC LIMIT 50';

        const notifications = await db.all(sql, params);

        const parsed = notifications.map(n => ({
            ...n,
            isRead: Boolean(n.isRead)
        }));

        res.json(parsed);
    } catch (e) {
        next(e);
    }
};

/**
 * Mark a specific notification as read
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;
        const db = getDb();

        if (!userId) throw new AppError('Unauthorized', 401);

        const result = await db.run(
            'UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
            [id, userId]
        );

        if (result.changes === 0) {
            throw new AppError('Notification not found or access denied', 404);
        }

        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;
        const companyId = req.headers['x-company-id'];
        const db = getDb();

        if (!userId) throw new AppError('Unauthorized', 401);

        let sql = 'UPDATE notifications SET isRead = 1 WHERE userId = ?';
        const params: any[] = [userId];

        if (companyId) {
            sql += ' AND companyId = ?';
            params.push(companyId);
        }

        await db.run(sql, params);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};
