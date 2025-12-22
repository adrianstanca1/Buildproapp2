
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';

// --- Safety Incidents ---

export const getSafetyIncidents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { projectId } = req.query;
        const companyId = req.user!.companyId;

        let query = 'SELECT * FROM safety_incidents WHERE companyId = ?';
        const params: any[] = [companyId];

        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY date DESC';

        const db = getDb();
        const incidents = await db.all(query, params);
        res.json(incidents);
    } catch (error) {
        logger.error('Error fetching safety incidents:', error);
        res.status(500).json({ error: 'Failed to fetch safety incidents' });
    }
};

export const createSafetyIncident = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            id, projectId, type, title, severity, date, location,
            description, personInvolved, actionTaken, status
        } = req.body;
        const companyId = req.user!.companyId;

        const db = getDb();
        await db.run(
            `INSERT INTO safety_incidents (
        id, companyId, projectId, type, title, severity, date,
        location, description, personInvolved, actionTaken, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, companyId, projectId, type, title, severity, date,
                location, description, personInvolved, actionTaken || '', status || 'Open'
            ]
        );

        res.status(201).json({ message: 'Safety incident created successfully' });
    } catch (error) {
        logger.error('Error creating safety incident:', error);
        res.status(500).json({ error: 'Failed to create safety incident' });
    }
};

export const updateSafetyIncident = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const companyId = req.user!.companyId;

        const db = getDb();
        // Security check: Ensure incident belongs to user's company
        const existing = await db.get('SELECT id FROM safety_incidents WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!existing) {
            return res.status(404).json({ error: 'Incident not found' });
        }

        const fields: string[] = [];
        const values: any[] = [];

        Object.keys(updates).forEach(key => {
            // Allowlist fields to prevent SQL injection or overwriting immutable fields
            if (['type', 'title', 'severity', 'date', 'location', 'description', 'personInvolved', 'actionTaken', 'status'].includes(key)) {
                fields.push(`${key} = ?`);
                values.push(updates[key]);
            }
        });

        if (fields.length === 0) {
            return res.json({ message: 'No updates provided' });
        }

        values.push(id);
        values.push(companyId);

        await db.run(`UPDATE safety_incidents SET ${fields.join(', ')} WHERE id = ? AND companyId = ?`, values);

        res.json({ message: 'Safety incident updated successfully' });
    } catch (error) {
        logger.error('Error updating safety incident:', error);
        res.status(500).json({ error: 'Failed to update safety incident' });
    }
};

// --- Safety Hazards (AI Detected or Manual) ---

export const getSafetyHazards = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { projectId } = req.query;
        const companyId = req.user!.companyId;

        let query = 'SELECT * FROM safety_hazards WHERE companyId = ?';
        const params: any[] = [companyId];

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

        res.json(parsedHazards);
    } catch (error) {
        logger.error('Error fetching safety hazards:', error);
        res.status(500).json({ error: 'Failed to fetch safety hazards' });
    }
};

export const createSafetyHazard = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const {
            id, projectId, type, severity, riskScore, description,
            recommendation, regulation, box_2d, timestamp
        } = req.body;
        const companyId = req.user!.companyId;

        const db = getDb();
        await db.run(
            `INSERT INTO safety_hazards (
        id, companyId, projectId, type, severity, riskScore,
        description, recommendation, regulation, box_2d, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, companyId, projectId, type, severity, riskScore,
                description, recommendation, regulation,
                JSON.stringify(box_2d), // Store complex object as JSON string
                timestamp
            ]
        );

        res.status(201).json({ message: 'Safety hazard created successfully' });
    } catch (error) {
        logger.error('Error creating safety hazard:', error);
        res.status(500).json({ error: 'Failed to create safety hazard' });
    }
};
