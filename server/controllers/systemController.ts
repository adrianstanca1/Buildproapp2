import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

export const getSystemSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        // Fetch all settings as key-value pairs
        const settings = await db.all('SELECT key, value FROM system_settings');

        // Transform to object { key: value }
        const settingsObj = settings.reduce((acc: any, curr: any) => {
            // Try parsing JSON values if applicable, else string
            try {
                acc[curr.key] = JSON.parse(curr.value);
            } catch {
                acc[curr.key] = curr.value;
            }
            return acc;
        }, {});

        res.json(settingsObj);
    } catch (e) {
        next(e);
    }
};

export const updateSystemSetting = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { key, value } = req.body;
        if (!key) throw new AppError('Key is required', 400);

        const db = getDb();
        const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

        // Upsert
        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
            [key, strValue]
        );

        res.json({ success: true, key, value });
    } catch (e) {
        next(e);
    }
};

export const broadcastMessage = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { message, urgent } = req.body;
        if (!message) throw new AppError('Message is required', 400);

        logger.info(`[BROADCAST] ${urgent ? 'URGENT: ' : ''}${message}`);

        // In a real app with WebSockets, we would emit here.
        // For now, we optionally store active broadcast in generic settings or just log it.
        // Let's store it so clients polling context can pick it up.

        const db = getDb();
        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt) VALUES ('broadcast_message', ?, CURRENT_TIMESTAMP)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
            [message]
        );

        res.json({ success: true, message });
    } catch (e) {
        next(e);
    }
};
