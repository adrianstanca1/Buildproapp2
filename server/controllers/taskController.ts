import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express.js';
import { BucketRegistry } from '../buckets/DataBucket.js';
import { z } from 'zod';
import { AppError } from '../utils/AppError.js';
import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { createTaskSchema as globalCreateTaskSchema, updateTaskSchema as globalUpdateTaskSchema } from '../validation/schemas.js';

import { calculateCriticalPath } from '../services/cpmService.js';

/**
 * Task Controller
 * Handles task CRUD operations with strict tenant isolation
 */

const taskBucket = BucketRegistry.getOrCreate('tasks', 'companyId');

// Use locally defined schemas or global ones based on preference
// For now, we prefer the local ones for backward compatibility if they differ
const localCreateTaskSchema = z.object({
    projectId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assignedTo: z.string().optional(),
    dueDate: z.string().optional(),
    startDate: z.string().optional(),
    duration: z.number().int().min(1).optional(),
    dependencies: z.union([z.string(), z.array(z.string())]).optional(), // Accept string (JSON) or array
    progress: z.number().min(0).max(100).optional(),
    color: z.string().optional(),
});

const localUpdateTaskSchema = localCreateTaskSchema.partial();

/**
 * Get all tasks for tenant (optionally filtered by project)
 */
export const getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { projectId } = req.query;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const filters = projectId ? { projectId: projectId as string } : undefined;
        const tasks = await taskBucket.query(tenantId, filters, {
            orderBy: 'createdAt',
            orderDirection: 'DESC',
        });

        res.json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single task by ID
 */
export const getTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { id } = req.params;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const task = await taskBucket.getById(tenantId, id);

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new task
 */
export const createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId, userId } = req.context;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Validate request body
        const validatedData = localCreateTaskSchema.parse(req.body);

        // Create task with tenant scoping
        const task = await taskBucket.create(
            tenantId,
            {
                id: `task-${Date.now()}`,
                ...validatedData,
                createdBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            userId
        );

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError('Validation failed: ' + JSON.stringify(error.issues), 400));
        } else {
            next(error);
        }
    }
};

/**
 * Update task
 */
export const updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId, userId } = req.context;
        const { id } = req.params;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Validate request body
        const validatedData = localUpdateTaskSchema.parse(req.body);

        // Update task (validates ownership)
        await taskBucket.update(
            tenantId,
            id,
            {
                ...validatedData,
                updatedAt: new Date().toISOString(),
            },
            userId
        );

        const updatedTask = await taskBucket.getById(tenantId, id);

        res.json({ success: true, data: updatedTask });
    } catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError('Validation failed: ' + JSON.stringify(error.issues), 400));
        } else {
            next(error);
        }
    }
};

/**
 * Delete task
 */
export const deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId, userId } = req.context;
        const { id } = req.params;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Delete task (validates ownership)
        await taskBucket.delete(tenantId, id, userId);

        res.json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Assign task to user
 */
export const assignTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId, userId } = req.context;
        const { id } = req.params;
        const { assignedTo } = req.body;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        if (!assignedTo) {
            throw new AppError('assignedTo is required', 400);
        }

        // Update task assignment
        await taskBucket.update(
            tenantId,
            id,
            {
                assignedTo,
                updatedAt: new Date().toISOString(),
            },
            userId
        );

        const updatedTask = await taskBucket.getById(tenantId, id);

        res.json({ success: true, data: updatedTask });
    } catch (error) {
        next(error);
    }
};

/**
 * Update task status
 */
export const updateTaskStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId, userId } = req.context;
        const { id } = req.params;
        const { status } = req.body;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        if (!status || !['pending', 'in_progress', 'completed', 'blocked'].includes(status)) {
            throw new AppError('Invalid status', 400);
        }

        // Update task status
        await taskBucket.update(
            tenantId,
            id,
            {
                status,
                updatedAt: new Date().toISOString(),
                ...(status === 'completed' && { completedAt: new Date().toISOString() }),
            },
            userId
        );

        const updatedTask = await taskBucket.getById(tenantId, id);

        res.json({ success: true, data: updatedTask });
    } catch (error) {
        next(error);
    }
};

/**
 * Get critical path for a project
 */
export const getCriticalPath = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const { tenantId } = req.context;
        const { projectId } = req.params;

        if (!tenantId) {
            throw new AppError('Tenant ID required', 401);
        }

        const criticalPath = await calculateCriticalPath(projectId, tenantId);
        res.json({ success: true, data: criticalPath });
    } catch (error) {
        next(error);
    }
};
