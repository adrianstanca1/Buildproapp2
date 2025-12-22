
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { broadcastToUser } from '../socket.js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export const sendNotification = async (
    companyId: string,
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link: string | null = null
) => {
    try {
        const db = getDb();
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        // 1. Persist to DB
        await db.run(
            `INSERT INTO notifications (id, companyId, userId, type, title, message, link, isRead, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [id, companyId, userId, type, title, message, link, createdAt]
        );

        // 2. Broadcast via WebSocket
        broadcastToUser(userId, {
            type: 'notification',
            id,
            title,
            message,
            notificationType: type,
            link,
            createdAt
        });

        logger.info(`Notification sent to User ${userId}: ${title}`);
        return { success: true, id };
    } catch (e: any) {
        logger.error('Failed to send notification:', e);
        return { success: false, error: e.message };
    }
};

export const markAsRead = async (id: string, userId: string) => {
    try {
        const db = getDb();
        await db.run(
            `UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?`,
            [id, userId]
        );
        return { success: true };
    } catch (e: any) {
        logger.error('Failed to mark notification as read:', e);
        return { success: false, error: e.message };
    }
};

export const getUnreadCount = async (userId: string) => {
    try {
        const db = getDb();
        const result = await db.get(
            `SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND isRead = 0`,
            [userId]
        );
        return result?.count || 0;
    } catch (e: any) {
        return 0;
    }
};
