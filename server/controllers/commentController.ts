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

        const comments = db.prepare(`
      SELECT * FROM comments
      WHERE company_id = ? AND entity_type = ? AND entity_id = ?
      ORDER BY created_at ASC
    `).all(companyId, entityType, entityId);

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
        const userId = req.userId;
        const userName = req.userName;
        const id = uuidv4();

        db.prepare(`
      INSERT INTO comments (
        id, company_id, entity_type, entity_id, user_id, user_name,
        parent_id, content, mentions, attachments, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
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
        );

        // Send notifications to mentioned users
        if (validatedData.mentions && validatedData.mentions.length > 0) {
            for (const mentionedUserId of validatedData.mentions) {
                await sendNotification(
                    companyId,
                    mentionedUserId,
                    'mention',
                    `${userName} mentioned you in a comment`,
                    {
                        entityType: validatedData.entityType,
                        entityId: validatedData.entityId,
                        commentId: id,
                    }
                );
            }
        }

        const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
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
        const userId = req.userId;
        const { id } = req.params;
        const { content } = req.body;

        // Verify the comment belongs to the user
        const existingComment = db.prepare(`
      SELECT * FROM comments WHERE id = ? AND company_id = ? AND user_id = ?
    `).get(id, companyId, userId);

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        db.prepare(`
      UPDATE comments
      SET content = ?, updated_at = ?
      WHERE id = ?
    `).run(content, new Date().toISOString(), id);

        const updatedComment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
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
        const userId = req.userId;
        const { id } = req.params;

        // Verify the comment belongs to the user
        const existingComment = db.prepare(`
      SELECT * FROM comments WHERE id = ? AND company_id = ? AND user_id = ?
    `).get(id, companyId, userId);

        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found or unauthorized' });
        }

        db.prepare('DELETE FROM comments WHERE id = ?').run(id);
        res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
