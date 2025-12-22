import { Request, Response, NextFunction } from 'express';
import { BucketRegistry } from '../buckets/DataBucket.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Task Controller
 * Handles task CRUD operations with strict tenant isolation
 */

const taskBucket = BucketRegistry.getOrCreate('tasks', 'companyId');

// Validation schemas
const createTaskSchema = z.object({
    projectId: z.string().min(1),
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    assignedTo: z.string().optional(),
    dueDate: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

/**
 * Get all tasks for tenant (optionally filtered by project)
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
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
export const getTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
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
export const createTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Validate request body
        const validatedData = createTaskSchema.parse(req.body);

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
            next(new AppError('Validation failed', 400, error.errors));
        } else {
            next(error);
        }
    }
};

/**
 * Update task
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;
        const { id } = req.params;

        if (!tenantId || !userId) {
            throw new AppError('Authentication required', 401);
        }

        // Validate request body
        const validatedData = updateTaskSchema.parse(req.body);

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
            next(new AppError('Validation failed', 400, error.errors));
        } else {
            next(error);
        }
    }
};

/**
 * Delete task
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;
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
export const assignTask = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;
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
export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tenantId = req.user?.companyId;
        const userId = req.user?.id;
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
