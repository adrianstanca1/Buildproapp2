import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import type { Membership, CreateMembershipDto, UpdateMembershipDto, UserRole, MembershipStatus } from '../types/rbac.js';

/**
 * MembershipService
 * Manages user memberships to companies with roles and permissions
 */
export class MembershipService {
    /**
     * Add a new member to a company
     */
    async addMember(data: CreateMembershipDto): Promise<Membership> {
        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        // Check if membership already exists
        const existing = await this.getMembership(data.userId, data.companyId);
        if (existing) {
            throw new AppError('User is already a member of this company', 400);
        }

        const permissions = data.permissions ? JSON.stringify(data.permissions) : null;

        await db.run(
            `INSERT INTO memberships (id, userId, companyId, role, permissions, status, joinedAt, invitedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, data.userId, data.companyId, data.role, permissions, 'active', now, data.invitedBy, now, now]
        );

        logger.info(`Membership created: ${data.userId} → ${data.companyId} as ${data.role}`);

        return this.getMembershipById(id);
    }

    /**
     * Update a member's role or permissions
     */
    async updateMembership(membershipId: string, updates: UpdateMembershipDto): Promise<Membership> {
        const db = getDb();
        const now = new Date().toISOString();

        const membership = await this.getMembershipById(membershipId);
        if (!membership) {
            throw new AppError('Membership not found', 404);
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (updates.role) {
            fields.push('role = ?');
            values.push(updates.role);
        }

        if (updates.permissions !== undefined) {
            fields.push('permissions = ?');
            values.push(updates.permissions ? JSON.stringify(updates.permissions) : null);
        }

        if (updates.status) {
            fields.push('status = ?');
            values.push(updates.status);
        }

        if (fields.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        fields.push('updatedAt = ?');
        values.push(now);
        values.push(membershipId);

        await db.run(
            `UPDATE memberships SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        logger.info(`Membership updated: ${membershipId}`);

        return this.getMembershipById(membershipId);
    }

    /**
     * Remove a member from a company
     */
    async removeMember(membershipId: string): Promise<void> {
        const db = getDb();

        const result = await db.run('DELETE FROM memberships WHERE id = ?', [membershipId]);

        if (result.changes === 0) {
            throw new AppError('Membership not found', 404);
        }

        logger.info(`Membership removed: ${membershipId}`);
    }

    /**
     * Get a membership by user and company
     */
    async getMembership(userId: string, companyId: string): Promise<Membership | null> {
        const db = getDb();

        const row = await db.get(
            'SELECT * FROM memberships WHERE userId = ? AND companyId = ?',
            [userId, companyId]
        );

        return row ? this.parseMembership(row) : null;
    }

    /**
     * Get a membership by ID
     */
    async getMembershipById(id: string): Promise<Membership> {
        const db = getDb();

        const row = await db.get('SELECT * FROM memberships WHERE id = ?', [id]);

        if (!row) {
            throw new AppError('Membership not found', 404);
        }

        return this.parseMembership(row);
    }

    /**
     * Get all memberships for a user
     */
    async getUserMemberships(userId: string): Promise<Membership[]> {
        const db = getDb();

        const rows = await db.all(
            'SELECT * FROM memberships WHERE userId = ? AND status = ?',
            [userId, 'active']
        );

        return rows.map(row => this.parseMembership(row));
    }

    /**
     * Get all members of a company
     */
    async getCompanyMembers(companyId: string): Promise<Membership[]> {
        const db = getDb();

        const rows = await db.all(
            'SELECT * FROM memberships WHERE companyId = ?',
            [companyId]
        );

        return rows.map(row => this.parseMembership(row));
    }

    /**
     * Check if user has active membership in company
     */
    async hasActiveMembership(userId: string, companyId: string): Promise<boolean> {
        const membership = await this.getMembership(userId, companyId);
        return membership !== null && membership.status === 'active';
    }

    /**
     * Parse database row to Membership object
     */
    private parseMembership(row: any): Membership {
        return {
            ...row,
            permissions: row.permissions ? JSON.parse(row.permissions) : undefined,
        };
    }
}

// Export singleton instance
export const membershipService = new MembershipService();
