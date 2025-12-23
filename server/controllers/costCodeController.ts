/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import { getDb } from '../database.js';

export const getCostCodes = async (req: Request, res: Response) => {
    try {
        const { projectId } = req.query;

        let query = `SELECT * FROM cost_codes WHERE 1=1`;
        const params: any[] = [];

        if (projectId) {
            query += ` AND project_id = ?`;
            params.push(projectId);
        }

        // Filter by company? Usually cost codes are project specific but belong to a company scope
        if (req.user?.companyId) {
            query += ` AND company_id = ?`;
            params.push(req.user.companyId);
        }

        const db = getDb();
        const codes = await db.all(query, params);

        const mapped = codes.map((c: any) => ({
            id: c.id,
            projectId: c.project_id,
            companyId: c.company_id,
            code: c.code,
            description: c.description,
            budget: c.budget,
            spent: c.spent
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching cost codes:', error);
        res.status(500).json({ error: 'Failed to fetch cost codes' });
    }
};

export const createCostCode = async (req: Request, res: Response) => {
    try {
        const { projectId, code, description, budget, spent } = req.body;
        const id = req.body.id || `cc-${Date.now()}`;
        const companyId = req.user?.companyId || 'c1';

        const db = getDb();
        await db.run(`
      INSERT INTO cost_codes (id, project_id, company_id, code, description, budget, spent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, projectId, companyId, code, description, budget, spent || 0]);

        res.json({
            id, projectId, companyId, code, description, budget, spent: spent || 0
        });
    } catch (error) {
        console.error('Error creating cost code:', error);
        res.status(500).json({ error: 'Failed to create cost code' });
    }
};

export const updateCostCode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'projectId' && key !== 'companyId');
        const values = [];
        const setParts = [];

        for (const key of fields) {
            if (key === 'projectId') continue; // Don't move cost codes between projects easily
            setParts.push(`${key} = ?`);
            values.push(updates[key]);
        }

        if (setParts.length === 0) return res.json({ success: true });

        const db = getDb();
        values.push(id);
        await db.run(`UPDATE cost_codes SET ${setParts.join(', ')} WHERE id = ?`, values);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating cost code:', error);
        res.status(500).json({ error: 'Failed to update cost code' });
    }
};
