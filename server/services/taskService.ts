import { v4 as uuidv4 } from 'uuid';
import { BaseTenantService } from './baseTenantService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * TaskService
 * Handles all task-related operations with strict tenant isolation
 */
export class TaskService extends BaseTenantService {
    constructor() {
        super('TaskService');
    }

    /**
     * Get all tasks for a tenant (optionally filtered by project)
     */
    async getTasks(userId: string, tenantId: string, projectId?: string) {
        await this.validateTenantAccess(userId, tenantId);

        const db = this.getDb();
        let query = 'SELECT * FROM tasks WHERE companyId = ?';
        const params: any[] = [tenantId];

        if (projectId) {
            // Validate project belongs to tenant
            await this.validateResourceTenant('projects', projectId, tenantId);
            query += ' AND projectId = ?';
            params.push(projectId);
        }

        query += ' ORDER BY dueDate ASC';

        const tasks = await db.all(query, params);
        return tasks.map(t => ({
            ...t,
            dependencies: t.dependencies ? JSON.parse(t.dependencies) : [],
        }));
    }

    /**
     * Get a single task by ID
     */
    async getTask(userId: string, tenantId: string, taskId: string) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('tasks', taskId, tenantId);

        const db = this.getDb();
        const task = await db.get(
            'SELECT * FROM tasks WHERE id = ? AND companyId = ?',
            [taskId, tenantId]
        );

        if (!task) {
            throw new AppError('Task not found', 404);
        }

        return {
            ...task,
            dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        };
    }

    /**
     * Create a new task
     */
    async createTask(userId: string, tenantId: string, taskData: any) {
        await this.validateTenantAccess(userId, tenantId);

        // Validate project belongs to tenant
        if (taskData.projectId) {
            await this.validateResourceTenant('projects', taskData.projectId, tenantId);
        }

        const db = this.getDb();
        const id = taskData.id || uuidv4();

        const task = {
            ...taskData,
            id,
            companyId: tenantId, // Force tenant ID
        };

        const dependencies = task.dependencies ? JSON.stringify(task.dependencies) : null;

        await db.run(
            `INSERT INTO tasks (
        id, companyId, title, description, projectId, status, priority,
        assigneeId, assigneeName, assigneeType, dueDate, latitude, longitude,
        dependencies, startDate, duration
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, tenantId, task.title, task.description, task.projectId,
                task.status, task.priority, task.assigneeId, task.assigneeName,
                task.assigneeType, task.dueDate, task.latitude, task.longitude,
                dependencies, task.startDate, task.duration
            ]
        );

        await this.auditAction('create', userId, tenantId, 'tasks', id, { title: task.title });

        logger.info(`Task created: ${id} in tenant ${tenantId}`);
        return this.getTask(userId, tenantId, id);
    }

    /**
     * Update a task
     */
    async updateTask(userId: string, tenantId: string, taskId: string, updates: any) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('tasks', taskId, tenantId);

        // If changing project, validate new project belongs to tenant
        if (updates.projectId) {
            await this.validateResourceTenant('projects', updates.projectId, tenantId);
        }

        const db = this.getDb();

        // Serialize JSON fields
        if (updates.dependencies) {
            updates.dependencies = JSON.stringify(updates.dependencies);
        }

        const fields: string[] = [];
        const values: any[] = [];

        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'companyId') {
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        values.push(taskId);
        values.push(tenantId);

        await db.run(
            `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND companyId = ?`,
            values
        );

        await this.auditAction('update', userId, tenantId, 'tasks', taskId, updates);

        logger.info(`Task updated: ${taskId} in tenant ${tenantId}`);
        return this.getTask(userId, tenantId, taskId);
    }

    /**
     * Delete a task
     */
    async deleteTask(userId: string, tenantId: string, taskId: string) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('tasks', taskId, tenantId);

        const db = this.getDb();

        const result = await db.run(
            'DELETE FROM tasks WHERE id = ? AND companyId = ?',
            [taskId, tenantId]
        );

        if (result.changes === 0) {
            throw new AppError('Task not found', 404);
        }

        await this.auditAction('delete', userId, tenantId, 'tasks', taskId);

        logger.info(`Task deleted: ${taskId} from tenant ${tenantId}`);
        return { success: true, id: taskId };
    }
}

export const taskService = new TaskService();
export default taskService;
