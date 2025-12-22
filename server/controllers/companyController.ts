import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { companySchema, updateCompanySchema } from '../schemas/companySchema.js';
import { logger } from '../utils/logger.js';

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        // In a real multi-tenant system, this might be restricted to "platform admins" likely.
        // Or if it's "my companies", filtered by user.
        // For now, mirroring existing logic: return all.
        const companies = await db.all('SELECT * FROM companies');

        const parsed = companies.map(c => ({
            ...c,
            settings: c.settings ? JSON.parse(c.settings) : {},
            subscription: c.subscription ? JSON.parse(c.subscription) : {},
            features: c.features ? JSON.parse(c.features) : []
        }));

        res.json(parsed);
    } catch (e) {
        next(e);
    }
};

export const createCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();

        // Validate Input
        const validationResult = companySchema.safeParse(req.body);

        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(`Validation Error: ${errorMessages}`, 400);
        }

        const c = validationResult.data;
        const id = c.id || uuidv4();

        // Serialize JSON fields
        const settings = c.settings ? JSON.stringify(c.settings) : '{}';
        const subscription = c.subscription ? JSON.stringify(c.subscription) : '{}';
        const features = c.features ? JSON.stringify(c.features) : '[]';

        await db.run(
            `INSERT INTO companies (
        id, name, plan, status, users, projects, mrr, joinedDate, 
        description, logo, website, email, phone, address, city, state, zipCode, country,
        settings, subscription, features, maxUsers, maxProjects, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, c.name, c.plan, c.status, c.users, c.projects, c.mrr, c.joinedDate || new Date().toISOString(),
                c.description, c.logo, c.website, c.email, c.phone, c.address, c.city, c.state, c.zipCode, c.country,
                settings, subscription, features, c.maxUsers, c.maxProjects, new Date().toISOString(), new Date().toISOString()
            ]
        );

        logger.info(`Company created: ${c.name} (${id})`);
        res.status(201).json({ ...c, id });
    } catch (e) {
        next(e);
    }
};

export const updateCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;

        // Validate Input
        const validationResult = updateCompanySchema.safeParse(req.body);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(`Validation Error: ${errorMessages}`, 400);
        }

        const updates = validationResult.data as any; // Cast for dynamic SQL building

        // Handle JSON fields
        if (updates.settings) updates.settings = JSON.stringify(updates.settings);
        if (updates.subscription) updates.subscription = JSON.stringify(updates.subscription);
        if (updates.features) updates.features = JSON.stringify(updates.features);

        // Always update timestamp
        updates.updatedAt = new Date().toISOString();

        delete updates.id; // Prevent ID update

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(',');

        const result = await db.run(
            `UPDATE companies SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        if (result.changes === 0) {
            throw new AppError('Company not found', 404);
        }

        res.json({ ...updates, id });
    } catch (e) {
        next(e);
    }
};

export const deleteCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const result = await db.run('DELETE FROM companies WHERE id = ?', [id]);

        if (result.changes === 0) {
            throw new AppError('Company not found', 404);
        }

        logger.info(`Company deleted: ${id}`);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};
