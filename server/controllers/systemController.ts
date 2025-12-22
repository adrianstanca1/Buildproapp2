
import { Request, Response } from 'express';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';

export const getSystemSettings = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const settings = await db.all('SELECT key, value FROM system_settings');

        // Transform array to object
        const settingsMap: Record<string, any> = {
            maintenance: false,
            betaFeatures: true,
            registrations: true,
            aiEngine: true
        };

        settings.forEach(s => {
            // Convert 'true'/'false' strings to booleans
            if (s.value === 'true') settingsMap[s.key] = true;
            else if (s.value === 'false') settingsMap[s.key] = false;
            else settingsMap[s.key] = s.value;
        });

        res.json(settingsMap);
    } catch (error) {
        logger.error('Failed to fetch system settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

export const updateSystemSetting = async (req: Request, res: Response) => {
    try {
        const { key, value } = req.body;
        const db = getDb();

        await db.run(
            `INSERT INTO system_settings (key, value, updatedAt, updatedBy) 
       VALUES (?, ?, ?, ?) 
       ON CONFLICT(key) DO UPDATE SET 
       value = excluded.value, 
       updatedAt = excluded.updatedAt, 
       updatedBy = excluded.updatedBy`,
            [key, String(value), new Date().toISOString(), (req as any).userId || 'system']
        );

        res.json({ success: true, key, value });
    } catch (error) {
        logger.error('Failed to update system setting:', error);
        res.status(500).json({ error: 'Failed to update setting' });
    }
};
