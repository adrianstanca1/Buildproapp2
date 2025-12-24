import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { getDb } from '../database.js';
import { logger } from '../utils/logger.js';
import { randomUUID } from 'crypto';
import { sendNotification } from '../services/notificationService.js';
import { WorkflowService } from '../services/workflowService.js';
import { AppError } from '../utils/AppError.js';

export const getRFIs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.context!;
        const projectId = req.query.projectId as string;

        let sql = 'SELECT * FROM rfis WHERE companyId = ?';
        const params = [tenantId];

        if (projectId) {
            sql += ' AND projectId = ?';
            params.push(projectId);
        }

        sql += ' ORDER BY createdAt DESC';

        const db = getDb();
        const rfis = await db.all(sql, params);
        res.json({ success: true, data: rfis });
    } catch (error) {
        logger.error('Error fetching RFIs:', error);
        res.status(500).json({ error: 'Failed to fetch RFIs' });
    }
};

export const createRFI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { tenantId } = req.context!;
        const name = (req as any).userName || 'Unknown';
        const { projectId, subject, question, assignedTo, dueDate, number, status } = req.body;

        if (!projectId || !subject || !question) {
            res.status(400).json({ error: 'Project ID, Subject, and Question are required' });
            return;
        }

        const id = randomUUID();
        // Use supplied number or auto-generate simpler one if needed logic
        const rfiNumber = number || `RFI-${Date.now().toString().slice(-4)}`;

        const db = getDb();
        await db.run(
            `INSERT INTO rfis (
                id, companyId, projectId, number, subject, description, 
                raisedBy, assignedTo, status, dueDate, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, tenantId, projectId, rfiNumber, subject, question, // Mapping question -> description
                name, assignedTo || 'Unassigned', status || 'Open', dueDate, new Date().toISOString()
            ]
        );

        if (assignedTo && assignedTo !== 'Unassigned') {
            await sendNotification(
                tenantId,
                assignedTo,
                'info',
                'New RFI Assigned',
                `You have been assigned RFI-${rfiNumber}: ${subject}`,
                `/rfi`
            );
        }

        const newRfi = await db.get('SELECT * FROM rfis WHERE id = ?', [id]);

        // Trigger Workflow Automation (Phase 14)
        await WorkflowService.trigger(tenantId, 'rfi_created', { rfiId: id, rfi: newRfi });

        res.status(201).json({ success: true, data: { id, number: rfiNumber, status: 'Open' } });
    } catch (error) {
        logger.error('Error creating RFI:', error);
        res.status(500).json({ error: 'Failed to create RFI' });
    }
};

export const updateRFI = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { tenantId } = req.context!;
        const updates = req.body; // Expect { answer, status }

        const db = getDb();
        const existing = await db.get('SELECT * FROM rfis WHERE id = ? AND companyId = ?', [id, tenantId]);
        if (!existing) {
            res.status(404).json({ error: 'RFI not found' });
            return;
        }

        // Logic for answering
        if (updates.answer) {
            await db.run(
                'UPDATE rfis SET response = ?, status = ?, responseAt = ? WHERE id = ?',
                [updates.answer, 'Closed', new Date().toISOString(), id]
            );
            // Note: Schema might need `responseAt` if not present, but generic `response` field exists
            res.json({ message: 'RFI answered and closed' });
            return;
        }

        // Logic for other updates (status, assignment)
        const allowedFields = ['status', 'assignedTo', 'dueDate', 'priority'];
        const fieldsToUpdate = Object.keys(updates).filter(key => allowedFields.includes(key));

        if (fieldsToUpdate.length > 0) {
            const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
            const values = fieldsToUpdate.map(field => updates[field]);
            values.push(id);

            await db.run(`UPDATE rfis SET ${setClause} WHERE id = ?`, values);
        }

        const updatedRfi = await db.get('SELECT * FROM rfis WHERE id = ?', [id]);

        // Trigger Workflow Automation (Phase 14)
        await WorkflowService.trigger(tenantId, 'rfi_status_changed', { rfiId: id, rfi: updatedRfi });

        res.json({ success: true, data: updatedRfi });
    } catch (error) {
        logger.error('Error updating RFI:', error);
        res.status(500).json({ error: 'Failed to update RFI' });
    }
};
