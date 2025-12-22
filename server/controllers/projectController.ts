import { Request, Response } from 'express';
import { z } from 'zod';
import { projectService } from '../services/projectService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

// Validation schemas
const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    health: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
    budget: z.number().optional(),
    spent: z.number().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    manager: z.string().optional(),
    image: z.string().optional(),
    teamSize: z.number().optional(),
    weatherLocation: z.any().optional(),
    aiAnalysis: z.string().optional(),
    zones: z.array(z.any()).optional(),
    phases: z.array(z.any()).optional(),
    timelineOptimizations: z.array(z.any()).optional(),
});

const updateProjectSchema = createProjectSchema.partial();

/**
 * Get all projects for the current tenant
 */
export const getProjects = async (req: Request, res: Response) => {
    try {
        const { userId, tenantId } = req.context;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        const projects = await projectService.getProjects(userId, tenantId);
        res.json(projects);
    } catch (error) {
        logger.error('Error fetching projects:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to fetch projects' });
        }
    }
};

/**
 * Get a single project by ID
 */
export const getProject = async (req: Request, res: Response) => {
    try {
        const { userId, tenantId } = req.context;
        const { id } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        const project = await projectService.getProject(userId, tenantId, id);
        res.json(project);
    } catch (error) {
        logger.error('Error fetching project:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to fetch project' });
        }
    }
};

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
    try {
        const { userId, tenantId } = req.context;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        // Validate request body
        const validationResult = createProjectSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues,
            });
        }

        const project = await projectService.createProject(userId, tenantId, validationResult.data);
        res.status(201).json(project);
    } catch (error) {
        logger.error('Error creating project:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to create project' });
        }
    }
};

/**
 * Update a project
 */
export const updateProject = async (req: Request, res: Response) => {
    try {
        const { userId, tenantId } = req.context;
        const { id } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        // Validate request body
        const validationResult = updateProjectSchema.safeParse(req.body);
        if (!validationResult.success) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.error.issues,
            });
        }

        const project = await projectService.updateProject(userId, tenantId, id, validationResult.data);
        res.json(project);
    } catch (error) {
        logger.error('Error updating project:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update project' });
        }
    }
};

/**
 * Delete a project
 */
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const { userId, tenantId } = req.context;
        const { id } = req.params;

        if (!userId) {
            throw new AppError('User not authenticated', 401);
        }

        if (!tenantId) {
            throw new AppError('Tenant context required', 400);
        }

        const result = await projectService.deleteProject(userId, tenantId, id);
        res.json(result);
    } catch (error) {
        logger.error('Error deleting project:', error);
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete project' });
        }
    }
};
