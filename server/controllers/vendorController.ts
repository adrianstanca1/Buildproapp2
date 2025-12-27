import '../types/express.d.ts';
import { Request, Response } from 'express';
import { getDb } from '../database.js';

export const getVendors = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const vendors = await db.all(`
      SELECT * FROM vendors
      WHERE companyId = ? OR companyId IS NULL
    `, [req.user?.companyId || 'c1']);

        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
};

export const createVendor = async (req: Request, res: Response) => {
    try {
        const { id: bodyId, name, category, contact, email, phone, rating, status, companyId } = req.body;
        const id = bodyId || `v-${Date.now()}`;

        // Default to user's company if not provided
        const userCompanyId = companyId || req.user?.companyId || 'c1';

        const db = getDb();
        await db.run(`
      INSERT INTO vendors (id, name, category, contact, email, phone, rating, status, companyId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, category, contact, email, phone, rating, status, userCompanyId]);

        res.json({
            id, name, category, contact, email, phone, rating, status, companyId: userCompanyId
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
};

export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const fields = Object.keys(updates).filter(key => key !== 'id');
        if (fields.length === 0) return res.json({ success: true });

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]);

        const db = getDb();
        values.push(id);
        await db.run(`UPDATE vendors SET ${setClause} WHERE id = ?`, values);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
};
