import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { AppError } from '../utils/AppError.js';
import { WorkflowService } from '../services/workflowService.js';

// --- Safety Incidents ---

export const getSafetyIncidents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { tenantId } = req.context;

        let query = 'SELECT * FROM safety_incidents WHERE companyId = ?';
        const params: any[] = [tenantId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY date DESC';

        const db = getDb();
        const incidents = await db.all(query, params);
        res.json({ success: true, data: incidents });
    } catch (error) {
        next(error);
    }
};

export const createSafetyIncident = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const {
            id, projectId, type, title, severity, date, location,
            description, personInvolved, actionTaken, status
        } = req.body;
        const { tenantId } = req.context;
        const db = getDb();

        const incidentId = id || randomUUID();

        await db.run(
            `INSERT INTO safety_incidents (
                id, companyId, projectId, type, title, severity, date,
                location, description, personInvolved, actionTaken, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                incidentId, tenantId, projectId, type, title, severity, date,
                location, description, personInvolved, actionTaken || '', status || 'Open'
            ]
        );

        const newIncident = await db.get('SELECT * FROM safety_incidents WHERE id = ?', [incidentId]);

        // Trigger Workflow Automation (Phase 14)
        if (severity >= 3) {
            await WorkflowService.trigger(tenantId, 'safety_incident_high', { incidentId, incident: newIncident });
        }

        res.status(201).json({ success: true, data: newIncident });
    } catch (error) {
        next(error);
    }
};

export const updateSafetyIncident = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { tenantId } = req.context;
        const db = getDb();

        const existing = await db.get('SELECT id FROM safety_incidents WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!existing) {
            throw new AppError('Incident not found', 404);
        }

        const fields: string[] = [];
        const values: any[] = [];

        Object.keys(updates).forEach(key => {
            if (['type', 'title', 'severity', 'date', 'location', 'description', 'personInvolved', 'actionTaken', 'status'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length > 0) {
            values.push(id);
            values.push(tenantId);
            await db.run(`UPDATE safety_incidents SET ${fields.join(', ')} WHERE id = ? AND companyId = ?`, values);
        }

        const updatedIncident = await db.get('SELECT * FROM safety_incidents WHERE id = ?', [id]);
        res.json({ success: true, data: updatedIncident });
    } catch (error) {
        next(error);
    }
};

// --- Safety Hazards (AI Detected or Manual) ---

export const getSafetyHazards = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { projectId } = req.query;
        const { tenantId } = req.context;

        let query = 'SELECT * FROM safety_hazards WHERE companyId = ?';
        const params: any[] = [tenantId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY timestamp DESC';

        const db = getDb();
        const hazards = await db.all(query, params);

        const parsedHazards = hazards.map((h: any) => ({
            ...h,
            box_2d: h.box_2d ? JSON.parse(h.box_2d) : undefined
        }));

        res.json({ success: true, data: parsedHazards });
    } catch (error) {
        next(error);
    }
};

export const createSafetyHazard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const {
            id, projectId, type, severity, riskScore, description,
            recommendation, regulation, box_2d, timestamp
        } = req.body;
        const { tenantId } = req.context;
        const db = getDb();

        const hazardId = id || randomUUID();

        await db.run(
            `INSERT INTO safety_hazards (
                id, companyId, projectId, type, severity, riskScore,
                description, recommendation, regulation, box_2d, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                hazardId, tenantId, projectId, type, severity, riskScore,
                description, recommendation, regulation,
                JSON.stringify(box_2d),
                timestamp
            ]
        );

        const newHazard = await db.get('SELECT * FROM safety_hazards WHERE id = ?', [hazardId]);
        res.status(201).json({ success: true, data: newHazard });
    } catch (error) {
        next(error);
    }
};

export const updateSafetyHazard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { tenantId } = req.context;
        const db = getDb();

        const existing = await db.get('SELECT id FROM safety_hazards WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!existing) {
            throw new AppError('Hazard not found', 404);
        }

        const fields: string[] = [];
        const values: any[] = [];

        Object.keys(updates).forEach(key => {
            if (['type', 'severity', 'riskScore', 'description', 'recommendation', 'regulation', 'box_2d', 'status'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(key === 'box_2d' ? JSON.stringify(updates[key]) : updates[key]);
            }
        });

        if (fields.length > 0) {
            values.push(id);
            values.push(tenantId);
            await db.run(`UPDATE safety_hazards SET ${fields.join(', ')} WHERE id = ? AND companyId = ?`, values);
        }

        const updatedHazard = await db.get('SELECT * FROM safety_hazards WHERE id = ?', [id]);
        res.json({ success: true, data: updatedHazard });
    } catch (error) {
        next(error);
    }
};
