import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { projectSchema, updateProjectSchema } from '../schemas/projectSchema.js';
import { logger } from '../utils/logger.js';

export const getProjects = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const tenantId = (req as any).tenantId;

        // Filter by tenant if present (Tenancy Hardening)
        let whereClause = '';
        const params: any[] = [];
        if (tenantId) {
            whereClause = 'WHERE companyId = ?';
            params.push(tenantId);
        }

        const projects = await db.all(`
      SELECT
        p.*,
        COUNT(t.id) AS tasks_total,
        SUM(CASE WHEN t.status = 'Done' THEN 1 ELSE 0 END) AS tasks_completed,
        SUM(CASE WHEN t.dueDate < date('now') AND t.status != 'Done' THEN 1 ELSE 0 END) AS tasks_overdue
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.projectId
      ${whereClause}
      GROUP BY p.id
    `, params);

        const parsed = projects.map(p => ({
            ...p,
            weatherLocation: p.weatherLocation ? JSON.parse(p.weatherLocation) : null,
            zones: p.zones ? JSON.parse(p.zones) : [],
            phases: p.phases ? JSON.parse(p.phases) : [],
            timelineOptimizations: p.timelineOptimizations ? JSON.parse(p.timelineOptimizations) : [],
            tasks: {
                total: Number(p.tasks_total),
                completed: Number(p.tasks_completed),
                overdue: Number(p.tasks_overdue)
            }
        }));

        res.json(parsed);
    } catch (e) {
        next(e);
    }
};

export const createProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const tenantId = (req as any).tenantId;

        // Validate Input
        const validationResult = projectSchema.safeParse(req.body);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(`Validation Error: ${errorMessages}`, 400);
        }

        const p = validationResult.data;

        // Enforce Tenancy
        if (tenantId) {
            p.companyId = tenantId;
        }

        const id = p.id || uuidv4();
        const weatherLocation = p.weatherLocation ? JSON.stringify(p.weatherLocation) : null;
        const zones = p.zones ? JSON.stringify(p.zones) : '[]';
        const phases = p.phases ? JSON.stringify(p.phases) : '[]';
        const timelineOptimizations = p.timelineOptimizations ? JSON.stringify(p.timelineOptimizations) : '[]';

        await db.run(
            `INSERT INTO projects (id, companyId, name, code, description, location, type, status, health, progress, budget, spent, startDate, endDate, manager, image, teamSize, weatherLocation, aiAnalysis, zones, phases, timelineOptimizations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, p.companyId, p.name, p.code, p.description, p.location, p.type, p.status, p.health, p.progress, p.budget, p.spent, p.startDate, p.endDate, p.manager, p.image, p.teamSize, weatherLocation, p.aiAnalysis, zones, phases, timelineOptimizations]
        );

        logger.info(`Project created: ${p.name} (${id})`);
        res.status(201).json({ ...p, id });
    } catch (e) {
        next(e);
    }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const tenantId = (req as any).tenantId;

        // Validate Input
        const validationResult = updateProjectSchema.safeParse(req.body);
        if (!validationResult.success) {
            const errorMessages = validationResult.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
            throw new AppError(`Validation Error: ${errorMessages}`, 400);
        }

        const updates = validationResult.data as any;

        // Handle JSON fields
        if (updates.weatherLocation) updates.weatherLocation = JSON.stringify(updates.weatherLocation);
        if (updates.zones) updates.zones = JSON.stringify(updates.zones);
        if (updates.phases) updates.phases = JSON.stringify(updates.phases);
        if (updates.timelineOptimizations) updates.timelineOptimizations = JSON.stringify(updates.timelineOptimizations);

        delete updates.id;
        delete updates.tasks; // computed

        const keys = Object.keys(updates);
        if (keys.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        const values = Object.values(updates);
        const setClause = keys.map(k => `${k} = ?`).join(',');

        let sql = `UPDATE projects SET ${setClause} WHERE id = ?`;
        const params = [...values, id];

        // Tenancy Check
        if (tenantId) {
            sql += ` AND companyId = ?`;
            params.push(tenantId);
        }

        const result = await db.run(sql, params);

        if (result.changes === 0) {
            throw new AppError('Project not found or unauthorized', 404);
        }

        res.json({ ...updates, id });
    } catch (e) {
        next(e);
    }
};

export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const tenantId = (req as any).tenantId;

        let sql = 'DELETE FROM projects WHERE id = ?';
        const params = [id];

        if (tenantId) {
            sql += ' AND companyId = ?';
            params.push(tenantId);
        }

        const result = await db.run(sql, params);

        if (result.changes === 0) {
            throw new AppError('Project not found or unauthorized', 404);
        }

        logger.info(`Project deleted: ${id}`);
        res.json({ success: true });
    } catch (e) {
        next(e);
    }
};
