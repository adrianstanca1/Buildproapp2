import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { companySchema, updateCompanySchema } from '../schemas/companySchema.js';
import { logger } from '../utils/logger.js';
import { emitSystemEvent } from '../services/notificationService.js';
import { ensureTenantBucket } from '../services/storageService.js';
import { supabaseAdmin } from '../utils/supabase.js';

export const getCompanies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
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

export const getCompanyDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const company = await db.get('SELECT * FROM companies WHERE id = ?', [id]);
        if (!company) throw new AppError('Company not found', 404);

        // Fetch deep stats
        const projectCount = (await db.get('SELECT COUNT(*) as count FROM projects WHERE companyId = ?', [id])).count;
        const userCount = (await db.get('SELECT COUNT(*) as count FROM users WHERE companyId = ?', [id])).count;
        const storageUsed = 0; // Placeholder until storage service integration

        // Return augmented company object
        res.json({
            ...company,
            settings: company.settings ? JSON.parse(company.settings) : {},
            subscription: company.subscription ? JSON.parse(company.subscription) : {},
            features: company.features ? JSON.parse(company.features) : [],
            stats: {
                projects: projectCount,
                users: userCount,
                storage: storageUsed,
                lastActive: new Date().toISOString() // Placeholder
            }
        });
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

        // --- Phase 10: Infrastructure Provisioning ---
        try {
            await ensureTenantBucket(id);
            logger.info(`Storage bucket provisioned for ${id}`);

            await emitSystemEvent({
                type: 'PROVISIONING_SUCCESS',
                level: 'info',
                message: `New company "${c.name}" provisioned and initial storage bucket created.`,
                source: 'CompanyController',
                metadata: { companyId: id, name: c.name }
            });
        } catch (storageErr) {
            logger.error(`Failed to provision storage for ${id}:`, storageErr);
            await emitSystemEvent({
                type: 'PROVISIONING_FAILURE',
                level: 'critical',
                message: `Storage provisioning failed for "${c.name}". Manual intervention required.`,
                source: 'CompanyController',
                metadata: { companyId: id, name: c.name, error: (storageErr as Error).message }
            });
        }

        // Optional: Create Initial Admin User
        // If adminEmail is provided in the request (extra field not in schema but passed in body)
        const { adminEmail, adminName } = req.body;
        if (adminEmail && adminName) {
            try {
                const { data: { user }, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(adminEmail, {
                    data: {
                        companyId: id,
                        role: 'COMPANY_ADMIN',
                        full_name: adminName
                    }
                });

                if (!inviteError && user) {
                    // Create local user record
                    await db.run(
                        `INSERT INTO users (id, companyId, email, name, role, status, createdAt, isActive)
                          VALUES (?, ?, ?, ?, ?, 'invited', ?, true)`,
                        [user.id, id, adminEmail, adminName, 'COMPANY_ADMIN', new Date().toISOString()]
                    );
                    // Also add to team table for that company
                    await db.run(
                        `INSERT INTO team (id, companyId, name, email, role, status, initials, color, joinDate)
                         VALUES (?, ?, ?, ?, ?, 'Invited', ?, ?, ?)`,
                        [user.id, id, adminName, adminEmail, 'COMPANY_ADMIN', adminName.substring(0, 2).toUpperCase(), 'bg-blue-600', new Date().toISOString().split('T')[0]]
                    );
                    logger.info(`Initialized Admin ${adminEmail} for Company ${c.name}`);
                } else {
                    logger.error(`Failed to invite initial admin: ${inviteError?.message}`);
                }
            } catch (err) {
                logger.error('Error creating initial admin:', err);
            }
        }

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

export const updateMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        // Check if companyId exists in the request object (populated by middleware)
        const companyId = (req as any).tenantId || (req as any).companyId;

        if (!companyId) {
            throw new AppError('Company context missing', 400);
        }

        // Validate Input
        // reuse updateCompanySchema for validation
        const validationResult = updateCompanySchema.safeParse(req.body);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(`Validation Error: ${errorMessages}`, 400);
        }

        const updates = validationResult.data as any;

        // Handle JSON fields
        if (updates.settings) updates.settings = JSON.stringify(updates.settings);
        if (updates.subscription) updates.subscription = JSON.stringify(updates.subscription);
        if (updates.features) updates.features = JSON.stringify(updates.features);

        // Always update timestamp
        updates.updatedAt = new Date().toISOString();

        // Sanitize: Do not allow ID or critical status changes via this endpoint if needed
        delete updates.id;
        delete updates.status;      // status usually managed by Super Admin
        delete updates.plan;        // plan usually managed by Super Admin/Billing

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(',');

        const result = await db.run(
            `UPDATE companies SET ${setClause} WHERE id = ?`,
            [...values, companyId]
        );

        if (result.changes === 0) {
            throw new AppError('Company not found', 404);
        }

        await emitSystemEvent({
            type: 'COMPANY_UPDATE',
            level: 'info',
            message: `Company details updated by user`,
            source: 'CompanyController',
            metadata: { companyId, updates }
        });

        res.json({ ...updates, id: companyId });
    } catch (e) {
        next(e);
    }
};
