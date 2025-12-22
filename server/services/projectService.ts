import { v4 as uuidv4 } from 'uuid';
import { BaseTenantService } from './baseTenantService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * ProjectService
 * Handles all project-related operations with strict tenant isolation
 */
export class ProjectService extends BaseTenantService {
    constructor() {
        super('ProjectService');
    }

    /**
     * Get all projects for a tenant
     */
    async getProjects(userId: string, tenantId: string) {
        await this.validateTenantAccess(userId, tenantId);

        const db = this.getDb();
        const projects = await db.all(
            'SELECT * FROM projects WHERE companyId = ? ORDER BY createdAt DESC',
            [tenantId]
        );

        return projects.map(p => ({
            ...p,
            zones: p.zones ? JSON.parse(p.zones) : [],
            phases: p.phases ? JSON.parse(p.phases) : [],
            timelineOptimizations: p.timelineOptimizations ? JSON.parse(p.timelineOptimizations) : [],
            weatherLocation: p.weatherLocation ? JSON.parse(p.weatherLocation) : null,
        }));
    }

    /**
     * Get a single project by ID
     */
    async getProject(userId: string, tenantId: string, projectId: string) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('projects', projectId, tenantId);

        const db = this.getDb();
        const project = await db.get(
            'SELECT * FROM projects WHERE id = ? AND companyId = ?',
            [projectId, tenantId]
        );

        if (!project) {
            throw new AppError('Project not found', 404);
        }

        return {
            ...project,
            zones: project.zones ? JSON.parse(project.zones) : [],
            phases: project.phases ? JSON.parse(project.phases) : [],
            timelineOptimizations: project.timelineOptimizations ? JSON.parse(project.timelineOptimizations) : [],
            weatherLocation: project.weatherLocation ? JSON.parse(project.weatherLocation) : null,
        };
    }

    /**
     * Create a new project
     */
    async createProject(userId: string, tenantId: string, projectData: any) {
        await this.validateTenantAccess(userId, tenantId);

        const db = this.getDb();
        const id = projectData.id || uuidv4();
        const now = new Date().toISOString();

        // Ensure companyId matches tenant context
        const project = {
            ...projectData,
            id,
            companyId: tenantId, // Force tenant ID
            createdAt: now,
            updatedAt: now,
        };

        // Serialize JSON fields
        const zones = project.zones ? JSON.stringify(project.zones) : null;
        const phases = project.phases ? JSON.stringify(project.phases) : null;
        const timelineOptimizations = project.timelineOptimizations ? JSON.stringify(project.timelineOptimizations) : null;
        const weatherLocation = project.weatherLocation ? JSON.stringify(project.weatherLocation) : null;

        await db.run(
            `INSERT INTO projects (
        id, companyId, name, code, description, location, type, status, health,
        progress, budget, spent, startDate, endDate, manager, image, teamSize,
        weatherLocation, aiAnalysis, zones, phases, timelineOptimizations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, tenantId, project.name, project.code, project.description,
                project.location, project.type, project.status, project.health,
                project.progress, project.budget, project.spent, project.startDate,
                project.endDate, project.manager, project.image, project.teamSize,
                weatherLocation, project.aiAnalysis, zones, phases, timelineOptimizations
            ]
        );

        await this.auditAction('create', userId, tenantId, 'projects', id, { name: project.name });

        logger.info(`Project created: ${id} in tenant ${tenantId}`);
        return this.getProject(userId, tenantId, id);
    }

    /**
     * Update a project
     */
    async updateProject(userId: string, tenantId: string, projectId: string, updates: any) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('projects', projectId, tenantId);

        const db = this.getDb();
        const now = new Date().toISOString();

        // Build update query dynamically
        const fields: string[] = [];
        const values: any[] = [];

        // Serialize JSON fields
        if (updates.zones) updates.zones = JSON.stringify(updates.zones);
        if (updates.phases) updates.phases = JSON.stringify(updates.phases);
        if (updates.timelineOptimizations) updates.timelineOptimizations = JSON.stringify(updates.timelineOptimizations);
        if (updates.weatherLocation) updates.weatherLocation = JSON.stringify(updates.weatherLocation);

        for (const [key, value] of Object.entries(updates)) {
            if (key !== 'id' && key !== 'companyId') { // Never allow changing these
                fields.push(`${key} = ?`);
                values.push(value);
            }
        }

        if (fields.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        fields.push('updatedAt = ?');
        values.push(now);
        values.push(projectId);
        values.push(tenantId);

        await db.run(
            `UPDATE projects SET ${fields.join(', ')} WHERE id = ? AND companyId = ?`,
            values
        );

        await this.auditAction('update', userId, tenantId, 'projects', projectId, updates);

        logger.info(`Project updated: ${projectId} in tenant ${tenantId}`);
        return this.getProject(userId, tenantId, projectId);
    }

    /**
     * Delete a project
     */
    async deleteProject(userId: string, tenantId: string, projectId: string) {
        await this.validateTenantAccess(userId, tenantId);
        await this.validateResourceTenant('projects', projectId, tenantId);

        const db = this.getDb();

        const result = await db.run(
            'DELETE FROM projects WHERE id = ? AND companyId = ?',
            [projectId, tenantId]
        );

        if (result.changes === 0) {
            throw new AppError('Project not found', 404);
        }

        await this.auditAction('delete', userId, tenantId, 'projects', projectId);

        logger.info(`Project deleted: ${projectId} from tenant ${tenantId}`);
        return { success: true, id: projectId };
    }
}

export const projectService = new ProjectService();
export default projectService;
