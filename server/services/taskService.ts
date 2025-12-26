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
        const { query: baseQuery, params: baseParams } = this.scopeQueryByTenant(
            'SELECT * FROM tasks',
            tenantId,
            't'
        );

        let query = baseQuery;
        const params: any[] = [...baseParams];

        if (projectId) {
            // Validate project belongs to tenant
            await this.validateResourceTenant('projects', projectId, tenantId);
            query += ' AND t.projectId = ?';
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
        const { query, params } = this.scopeQueryByTenant(
            'SELECT * FROM tasks WHERE id = ?',
            tenantId,
            't'
        );

        const task = await db.get(query, [taskId, ...params]);

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
     * Validate dependencies
     * Returns true if all dependencies are completed
     */
    async validateDependencies(tenantId: string, dependencyIds: string[]): Promise<boolean> {
        if (!dependencyIds || dependencyIds.length === 0) {
            return true;
        }

        const db = this.getDb();
        const placeholders = dependencyIds.map(() => '?').join(',');

        // Count non-completed dependencies
        const query = `
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE companyId = ? 
            AND id IN (${placeholders}) 
            AND status != 'completed'
        `;

        const result = await db.get(query, [tenantId, ...dependencyIds]);
        return result.count === 0;
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

        // Dependency Validation Logic
        if (updates.status && ['in_progress', 'completed'].includes(updates.status)) {
            let dependenciesToCheck = updates.dependencies;

            // If dependencies not in update, fetch existing
            if (!dependenciesToCheck) {
                const currentTask = await this.getTask(userId, tenantId, taskId);
                dependenciesToCheck = currentTask.dependencies;
            }

            // Ensure we have an array
            if (typeof dependenciesToCheck === 'string') {
                try {
                    dependenciesToCheck = JSON.parse(dependenciesToCheck);
                } catch (e) {
                    dependenciesToCheck = [];
                }
            }

            const areDependenciesMet = await this.validateDependencies(tenantId, dependenciesToCheck || []);

            if (!areDependenciesMet) {
                throw new AppError('Cannot start task: Waiting for unresolved dependencies', 400);
            }
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
