import '../types/express.d.ts';
import { Request, Response } from 'express';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { createCommentSchema } from '../validation/schemas.js';
import { sendNotification } from '../services/notificationService.js';

/**
 * Get comments for an entity
 */
export const getComments = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const { entityType, entityId } = req.query;

        if (!entityType || !entityId) {
            return res.status(400).json({ error: 'entityType and entityId are required' });
        }

        const comments = await db.all(`
      SELECT * FROM comments
      WHERE companyId = ? AND entityType = ? AND entityId = ?
      ORDER BY createdAt ASC
    `, [companyId, entityType, entityId]);

        // Parse JSON fields
        const parsedComments = comments.map((comment: any) => ({
            ...comment,
            mentions: comment.mentions ? JSON.parse(comment.mentions) : [],
            attachments: comment.attachments ? JSON.parse(comment.attachments) : [],
        }));

        res.json(parsedComments);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new comment
 */
export const createComment = async (req: Request, res: Response) => {
    try {
        // Validate request body
        const validatedData = createCommentSchema.parse(req.body);

        const db = getDb();
        const companyId = req.tenantId;
        const userId = (req as any).userId;
        const userName = (req as any).userName;
        const id = uuidv4();

        await db.run(`
      INSERT INTO comments (
        id, companyId, entityType, entityId, userId, userName,
        parentId, content, mentions, attachments, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            id,
            companyId,
            validatedData.entityType,
            validatedData.entityId,
            userId,
            userName,
            validatedData.parentId || null,
            validatedData.content,
            validatedData.mentions ? JSON.stringify(validatedData.mentions) : null,
            validatedData.attachments ? JSON.stringify(validatedData.attachments) : null,
            new Date().toISOString()
        ]);

        // Send notifications to mentioned users
        if (validatedData.mentions && validatedData.mentions.length > 0) {
            for (const mentionedUserId of validatedData.mentions) {
                await sendNotification(
                    companyId,
                    mentionedUserId,
                    'info',
                    'New Mention',
                    `${userName} mentioned you in a comment`,
                    `/${validatedData.entityType}s/${validatedData.entityId}`
                );
            }
        }

        const comment = await db.get('SELECT * FROM comments WHERE id = ?', [id]);
        res.json(comment);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * Update a comment
 */
export const updateComment = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const userId = (req as any).userId;
        const { id } = req.params;
        const { content } = req.body;

        // Verify the comment belongs to the user
        const existingComment = await db.get(`
      SELECT * FROM comments WHERE id = ? AND companyId = ? AND userId = ?
    `, [id, companyId, userId]);

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        await db.run(`
      UPDATE comments
      SET content = ?, updatedAt = ?
      WHERE id = ?
    `, [content, new Date().toISOString(), id]);

        const updatedComment = await db.get('SELECT * FROM comments WHERE id = ?', [id]);
        res.json(updatedComment);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response) => {
    try {
        const db = getDb();
        const companyId = req.tenantId;
        const userId = (req as any).userId;
        const { id } = req.params;

        // Verify the comment belongs to the user
        const existingComment = await db.get(`
      SELECT * FROM comments WHERE id = ? AND companyId = ? AND userId = ?
    `, [id, companyId, userId]);

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        await db.run('DELETE FROM comments WHERE id = ?', [id]);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
