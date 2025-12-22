
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export const inviteMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { email, name, role, projectId } = req.body;
        const tenantId = req.tenantId;

        if (!email || !name || !role) {
            throw new AppError('Email, name, and role are required', 400);
        }

        // Check if user already exists in this company
        const existing = await db.get(
            `SELECT id FROM users WHERE email = ? AND companyId = ?`,
            [email, tenantId]
        );

        if (existing) {
            throw new AppError('User already exists in this company', 409);
        }

        const id = uuidv4();
        // Create user with 'invited' status
        // In a real app, this would send an email and not set a password yet.
        // For this demo, we'll create a user who can login (authMiddleware checks email) 
        // OR we just create a "TeamMember" record if they are separate tables.
        // Based on types.ts, TeamMember and UserProfile are distinct but related. 
        // Let's assume we are adding to 'team' table first for visualization.

        await db.run(
            `INSERT INTO team (id, companyId, name, email, role, status, projectId, initials, color, joinDate)
             VALUES (?, ?, ?, ?, ?, 'Invited', ?, ?, ?, ?)`,
            [
                id,
                tenantId,
                name,
                email,
                role,
                projectId || null,
                name.substring(0, 2).toUpperCase(),
                'bg-gray-500', // Default color
                new Date().toISOString().split('T')[0]
            ]
        );

        // Also add to 'users' table so they can actually login if we are sharing auth
        // Assuming simple auth for now where email exists = can login (or we need a signup flow)
        // For now, let's just insert into 'team' as that's what TeamView consumes.
        // If we need them to login, we'd add to 'users' too.
        // Let's add to 'users' as 'invited' status.
        await db.run(
            `INSERT INTO users (id, companyId, email, name, role, status, createdAt)
              VALUES (?, ?, ?, ?, ?, 'invited', ?)`,
            [id, tenantId, email, name, role, new Date().toISOString()]
        );

        logger.info(`Invited member ${email} to company ${tenantId}`);

        res.status(201).json({ success: true, id, message: 'Member invited successfully' });
    } catch (e) {
        next(e);
    }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { role } = req.body;
        const tenantId = req.tenantId;

        // Verify member belongs to tenant
        const member = await db.get(`SELECT id FROM team WHERE id = ? AND companyId = ?`, [id, tenantId]);
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        await db.run(
            `UPDATE team SET role = ? WHERE id = ?`,
            [role, id]
        );

        // Sync with users table if it exists there
        await db.run(
            `UPDATE users SET role = ? WHERE id = ?`,
            [role, id]
        );

        res.json({ success: true, id, role });
    } catch (e) {
        next(e);
    }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const tenantId = req.tenantId;

        // Verify member belongs to tenant
        const member = await db.get(`SELECT id FROM team WHERE id = ? AND companyId = ?`, [id, tenantId]);
        if (!member) {
            throw new AppError('Member not found', 404);
        }

        await db.run(`DELETE FROM team WHERE id = ?`, [id]);
        await db.run(`DELETE FROM users WHERE id = ?`, [id]); // Also remove login access

        logger.info(`Removed member ${id} from company ${tenantId}`);

        res.json({ success: true, id });
    } catch (e) {
        next(e);
    }
};
