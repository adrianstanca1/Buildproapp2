import { getDb } from '../database.js';
import api from '../../services/api.js';

export const resolvers = {
    Query: {
        // Projects
        projects: async (_: any, __: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM projects WHERE company_id = ?
      `).all(context.tenantId);
        },

        project: async (_: any, { id }: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM projects WHERE id = ? AND company_id = ?
      `).get(id, context.tenantId);
        },

        // Tasks
        tasks: async (_: any, { projectId }: any, context: any) => {
            const db = getDb();
            let query = 'SELECT * FROM tasks WHERE company_id = ?';
            const params: any[] = [context.tenantId];

            if (projectId) {
                query += ' AND project_id = ?';
                params.push(projectId);
            }

            return db.prepare(query).all(...params);
        },

        task: async (_: any, { id }: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM tasks WHERE id = ? AND company_id = ?
      `).get(id, context.tenantId);
        },

        // Analytics
        executiveKPIs: async (_: any, __: any, context: any) => {
            // Call existing analytics controller logic
            const db = getDb();
            const companyId = context.tenantId;

            const activeProjects = db.prepare(`
        SELECT COUNT(*) as count FROM projects
        WHERE company_id = ? AND status = 'Active'
      `).get(companyId);

            const budgetData = db.prepare(`
        SELECT 
          COALESCE(SUM(budget), 0) as totalBudget,
          COALESCE(SUM(actualCost), 0) as totalSpent
        FROM projects
        WHERE company_id = ? AND status IN ('Active', 'Planning')
      `).get(companyId);

            const budgetHealth = {
                totalBudget: (budgetData as any).totalBudget || 0,
                totalSpent: (budgetData as any).totalSpent || 0,
                variance: ((budgetData as any).totalBudget || 0) - ((budgetData as any).totalSpent || 0),
                percentageUsed: (budgetData as any).totalBudget > 0
                    ? (((budgetData as any).totalSpent / (budgetData as any).totalBudget) * 100).toFixed(1)
                    : '0',
            };

            return {
                activeProjects: (activeProjects as any).count || 0,
                budgetHealth,
                safetyScore: 95,
                teamVelocity: 42,
                openRFIs: 8,
            };
        },

        // Comments
        comments: async (_: any, { entityType, entityId }: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM comments
        WHERE company_id = ? AND entity_type = ? AND entity_id = ?
        ORDER BY created_at DESC
      `).all(context.tenantId, entityType, entityId);
        },

        // Activity
        activityFeed: async (_: any, { projectId, limit = 50 }: any, context: any) => {
            const db = getDb();
            let query = `SELECT * FROM activity_feed WHERE company_id = ?`;
            const params: any[] = [context.tenantId];

            if (projectId) {
                query += ' AND project_id = ?';
                params.push(projectId);
            }

            query += ' ORDER BY created_at DESC LIMIT ?';
            params.push(limit);

            return db.prepare(query).all(...params);
        },
    },

    Mutation: {
        // Projects
        createProject: async (_: any, { input }: any, context: any) => {
            const db = getDb();
            const id = crypto.randomUUID();

            db.prepare(`
        INSERT INTO projects (id, company_id, name, description, client, location, budget, start_date, end_date, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Planning', ?)
      `).run(
                id,
                context.tenantId,
                input.name,
                input.description,
                input.client,
                input.location,
                input.budget,
                input.startDate,
                input.endDate,
                new Date().toISOString()
            );

            return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        },

        // Tasks
        createTask: async (_: any, { input }: any, context: any) => {
            const db = getDb();
            const id = crypto.randomUUID();

            db.prepare(`
        INSERT INTO tasks (id, company_id, project_id, title, description, status, priority, assignee_name, due_date, start_date, duration, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                id,
                context.tenantId,
                input.projectId,
                input.title,
                input.description,
                input.status || 'pending',
                input.priority || 'medium',
                input.assigneeName,
                input.dueDate,
                input.startDate,
                input.duration,
                new Date().toISOString()
            );

            return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        },

        // Comments
        createComment: async (_: any, { input }: any, context: any) => {
            const db = getDb();
            const id = crypto.randomUUID();

            db.prepare(`
        INSERT INTO comments (id, company_id, entity_type, entity_id, user_id, user_name, content, mentions, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                id,
                context.tenantId,
                input.entityType,
                input.entityId,
                context.userId,
                context.userName,
                input.content,
                JSON.stringify(input.mentions || []),
                new Date().toISOString()
            );

            return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
        },
    },

    // Field resolvers
    Project: {
        tasks: async (parent: any, _: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM tasks WHERE project_id = ? AND company_id = ?
      `).all(parent.id, context.tenantId);
        },

        comments: async (parent: any, _: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM comments WHERE entity_type = 'project' AND entity_id = ? AND company_id = ?
      `).all(parent.id, context.tenantId);
        },
    },

    Task: {
        project: async (parent: any, _: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM projects WHERE id = ? AND company_id = ?
      `).get(parent.project_id, context.tenantId);
        },

        comments: async (parent: any, _: any, context: any) => {
            const db = getDb();
            return db.prepare(`
        SELECT * FROM comments WHERE entity_type = 'task' AND entity_id = ? AND company_id = ?
      `).all(parent.id, context.tenantId);
        },
    },
};
