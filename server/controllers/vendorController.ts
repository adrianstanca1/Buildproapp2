
import { Request, Response } from 'express';
import { getDb } from '../database.js';

export const getVendors = (req: Request, res: Response) => {
    try {
        const filters: any = {};
        if (req.query.companyId) filters.company_id = req.query.companyId;

        const db = getDb();
        const vendors = db.prepare(`
      SELECT * FROM vendors
      WHERE company_id = @companyId OR company_id IS NULL
    `).all({ companyId: req.user?.companyId || 'c1' });

        // Map snake_case to camelCase
        const mapped = vendors.map((v: any) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            contact: v.contact,
            email: v.email,
            phone: v.phone,
            rating: v.rating,
            status: v.status,
            companyId: v.company_id
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
};

export const createVendor = (req: Request, res: Response) => {
    try {
        const { name, category, contact, email, phone, rating, status, companyId } = req.body;
        const id = req.body.id || `v-${Date.now()}`;

        // Default to user's company if not provided
        const userCompanyId = companyId || req.user?.companyId || 'c1';

        const db = getDb();
        const stmt = db.prepare(`
      INSERT INTO vendors (id, name, category, contact, email, phone, rating, status, company_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(id, name, category, contact, email, phone, rating, status, userCompanyId);

        res.json({
            id, name, category, contact, email, phone, rating, status, companyId: userCompanyId
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
};

export const updateVendor = (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Build dynamic update query
        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'companyId');
        if (fields.length === 0) return res.json({ success: true });

        // Rename camelCase to snake_case for specific fields if needed, mostly consistent here
        // companyId -> company_id
        if (updates.companyId) {
            fields.push('company_id');
            updates.company_id = updates.companyId;
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updates[field]); // Use original or mapped keys

        const db = getDb();
        const stmt = db.prepare(`UPDATE vendors SET ${setClause} WHERE id = ?`);
        stmt.run(...values, id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating vendor:', error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
};
