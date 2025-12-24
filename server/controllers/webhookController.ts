import '../types/express.d.ts';
import { Request, Response } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Webhook Controller
 * Manages outbound webhooks for integration
 */

export const getWebhooks = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;

        const webhooks = await db.all(`
      SELECT id, name, url, events, active, last_triggered
      FROM webhooks
      WHERE company_id = ?
      ORDER BY created_at DESC
    `, [companyId]);

        res.json(webhooks.map((w: any) => ({
            ...w,
            events: JSON.parse(w.events || '[]'),
            secret: undefined // Don't expose secret
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const createWebhook = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const { name, url, events } = req.body;

        const id = uuidv4();
        const secret = crypto.randomBytes(32).toString('hex');

        await db.run(`
      INSERT INTO webhooks (id, company_id, name, url, events, secret, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `, [
            id,
            companyId,
            name,
            url,
            JSON.stringify(events),
            secret,
            new Date().toISOString()
        ]);

        const webhook = await db.get('SELECT * FROM webhooks WHERE id = ?', [id]);
        res.json(webhook);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteWebhook = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const { id } = req.params;

        await db.run('DELETE FROM webhooks WHERE id = ? AND company_id = ?', [id, companyId]);
        res.json({ message: 'Webhook deleted' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
