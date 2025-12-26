import { Request, Response, NextFunction } from 'express';
import { getDb } from '../database.js';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';
import { permissionService } from '../services/permissionService.js';
import { membershipService } from '../services/membershipService.js';
import { tenantService, getTenantUsage } from '../services/tenantService.js';
import { UserRole } from '../types/rbac.js';
import { emailService } from '../services/emailService.js';

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Return the static role metadata based on the enum
        const roles = [
            { id: UserRole.SUPERADMIN, name: 'Superadmin', description: 'Full platform access, manages all companies', level: 6 },
            { id: UserRole.COMPANY_ADMIN, name: 'Company Admin', description: 'Full access within their company', level: 5 },
            { id: UserRole.PROJECT_MANAGER, name: 'Project Manager', description: 'Manages projects, tasks, and team assignments', level: 4 },
            { id: UserRole.FINANCE, name: 'Finance', description: 'Access to financial data and reports', level: 3 },
            { id: UserRole.SUPERVISOR, name: 'Supervisor', description: 'Oversees field operations and teams', level: 2 },
            { id: UserRole.OPERATIVE, name: 'Operative', description: 'Field workers, can update tasks', level: 1 },
            { id: UserRole.READ_ONLY, name: 'Read Only', description: 'View-only access', level: 0 },
        ];
        res.json(roles);
    } catch (e) {
        next(e);
    }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = getDb();
        const { name, description, permissions } = req.body;

        if (!name) throw new AppError('Role name is required', 400);

        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO roles (id, name, description, permissions, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, description, JSON.stringify(permissions || []), now, now]
        );

        // Audit Log (Simplified inline)
        const logId = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logId, (req as any).tenantId || 'system', (req as any).userId, (req as any).userName, 'CREATE', 'roles', id, JSON.stringify({ name, permissions }), 'success', now, req.ip, req.headers['user-agent']]
        ).catch(err => logger.error('Audit log failed', err));

        res.json({ id, name, description, permissions, createdAt: now, updatedAt: now });
    } catch (e) {
        next(e);
    }
};

export const assignUserRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, companyId, role } = req.body;

        if (!userId || !companyId || !role) {
            throw new AppError('userId, companyId, and role are required', 400);
        }

        const membership = await membershipService.getMembership(userId, companyId);
        if (!membership) {
            throw new AppError('User membership not found for this company', 404);
        }

        const updated = await membershipService.updateMembership(membership.id, { role: role as UserRole });

        // Audit Log (Simplified inline)
        const db = getDb();
        const now = new Date().toISOString();
        const logId = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logId, companyId, (req as any).userId, (req as any).userName, 'UPDATE_ROLE', 'memberships', membership.id, JSON.stringify({ oldRole: membership.role, newRole: role }), 'success', now, req.ip, req.headers['user-agent']]
        ).catch(err => logger.error('Audit log failed', err));

        res.json(updated);
    } catch (e) {
        next(e);
    }
};

export const getUserRoles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, companyId } = req.params;

        if (!userId || !companyId) throw new AppError('userId and companyId are required', 400);

        const permissions = await permissionService.getUserPermissions(userId, companyId);

        // Return a simplified structure for now as we don't have multiple roles per user per company in this schema
        // The membership table currently has one role field
        const db = getDb();
        const membership = await db.get('SELECT role FROM memberships WHERE userId = ? AND companyId = ?', [userId, companyId]);

        res.json([{
            userId,
            companyId,
            roleId: membership?.role || UserRole.READ_ONLY,
            permissions
        }]);
    } catch (e) {
        next(e);
    }
};

export const getAllPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const permissions = await permissionService.getPermissions();
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getRolePermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = req.params.role as UserRole;
        if (!role) throw new AppError('Role is required', 400);
        const permissions = await permissionService.getRolePermissions(role);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getCurrentUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, tenantId } = (req as any).context || {};

        if (!userId) throw new AppError('Authentication required', 401);
        if (!tenantId) throw new AppError('Company selection required', 400);

        const permissions = await permissionService.getUserPermissions(userId, tenantId);
        res.json(permissions);
    } catch (e) {
        next(e);
    }
};

export const getCurrentUserContext = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const context = (req as any).context;

        if (!context || !context.userId) {
            throw new AppError('Authentication required', 401);
        }

        if (!context.tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        // Fetch additional aggregate data
        const [usage, tenant] = await Promise.all([
            getTenantUsage(context.tenantId),
            tenantService.getTenant(context.tenantId)
        ]);

        res.json({
            ...context,
            usage,
            tenant
        });
    } catch (e) {
        next(e);
    }
};

export const inviteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, role, companyId } = req.body;
        const inviterId = (req as any).userId;

        if (!email || !role || !companyId) {
            throw new AppError('Email, role, and companyId are required', 400);
        }

        const db = getDb();

        const inviterGlobalRole = await permissionService.getUserGlobalRole(inviterId);

        if (inviterGlobalRole !== 'SUPERADMIN') {
            const membership = await membershipService.getMembership(inviterId, companyId);
            if (!membership || membership.status !== 'active') {
                throw new AppError('You do not have permission to invite users to this company', 403);
            }

            // Check for specific permission or role
            if (membership.role !== 'COMPANY_ADMIN' && membership.role !== 'SUPERADMIN') {
                throw new AppError('Only Company Admins can invite users', 403);
            }
        }
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            // If user exists, just add membership
            const existingMember = await membershipService.getMembership(existingUser.id, companyId);
            if (existingMember) {
                throw new AppError('User is already a member of this company', 409);
            }
            // Add membership
            await membershipService.addMember({ userId: existingUser.id, companyId, role });
            res.status(200).json({ message: 'User added to company', userId: existingUser.id });
            return; // stop execution
        }

        // 2. If user does NOT exist, create specific "Invite" record or Placeholder User
        const newUserId = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            `INSERT INTO users (id, email, name, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [newUserId, email, email.split('@')[0], 'invited', now, now]
        );

        await membershipService.addMember({ userId: newUserId, companyId, role });

        // 3. Log Audit
        const logId = uuidv4();
        await db.run(
            `INSERT INTO audit_logs (id, companyId, userId, userName, action, resource, resourceId, changes, status, timestamp, ipAddress, userAgent)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [logId, companyId, inviterId, 'Inviter', 'INVITE_USER', 'users', newUserId, JSON.stringify({ email, role }), 'success', now, req.ip, req.headers['user-agent']]
        ).catch(err => logger.error('Audit log failed', err));

        // 4. Send Email
        const company = await db.get('SELECT name FROM companies WHERE id = ?', [companyId]);
        const companyName = company?.name || 'the company';
        const inviteLink = `${process.env.APP_URL || 'http://localhost:3000'}/accept-invite?userId=${newUserId}&companyId=${companyId}`;

        try {
            await emailService.sendInvitation(email, role, companyName, inviteLink);
        } catch (emailError) {
            logger.error('Failed to send invitation email', emailError);
            // Verify if we should rollback or just warn. For now, we warn.
        }

        res.status(201).json({ message: 'Invitation sent', userId: newUserId });
    } catch (e) {
        next(e);
    }
};

export const impersonateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.body;
        const adminId = (req as any).userId;

        if (!userId) throw new AppError('Target userId is required', 400);

        // Security Check: Only Global SUPERADMIN can impersonate
        const inviterGlobalRole = await permissionService.getUserGlobalRole(adminId);
        if (inviterGlobalRole !== 'SUPERADMIN') {
            throw new AppError('Only Super Admins can impersonate users', 403);
        }

        const db = getDb();
        const targetUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (!targetUser) throw new AppError('Target user not found', 404);

        // Generate Signed Token
        // Format: imp_v1:{userId}:{timestamp}:{signature}
        const timestamp = Date.now();
        const payload = `imp_v1:${userId}:${timestamp}`;
        const signature = signToken(payload);
        const token = `${payload}:${signature}`;

        res.json({
            user: {
                id: targetUser.id,
                email: targetUser.email,
                name: targetUser.name,
                role: targetUser.role || 'OPERATIVE',
                permissions: [],
                avatarInitials: targetUser.name ? targetUser.name[0] : '?',
                companyId: targetUser.companyId || 'c1'
            },
            token
        });

    } catch (e) {
        next(e);
    }
};

export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId, email, name, companyName } = req.body;

        if (!userId || !email || !companyName) {
            throw new AppError('userId, email, and companyName are required', 400);
        }

        const db = getDb();
        const now = new Date().toISOString();

        // 1. Create Company
        const companyId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + uuidv4().slice(0, 8);
        await db.run(
            `INSERT INTO companies (id, name, status, plan, maxUsers, createdAt, updatedAt, settings, subscription)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [companyId, companyName, 'active', 'free', 5, now, now, '{}', JSON.stringify({ status: 'active', plan: 'free' })]
        );

        // 2. Create User (if not exists)
        const existingUser = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

        if (!existingUser) {
            await db.run(
                `INSERT INTO users (id, email, name, status, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, email, name || email.split('@')[0], 'active', now, now]
            );
        } else {
            await db.run(
                `UPDATE users SET name = ?, status = 'active', updatedAt = ? WHERE id = ?`,
                [name || existingUser.name, now, userId]
            );
        }

        // 3. Add Membership (COMPANY_ADMIN)
        await membershipService.addMember({
            userId,
            companyId,
            role: UserRole.COMPANY_ADMIN
        });

        res.status(201).json({ message: 'User and Company registered successfully', companyId });

    } catch (e) {
        next(e);
    }
};

const signToken = (payload: string): string => {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-fallback-secret';
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
};
