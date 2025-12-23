import { getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError.js';

export interface Automation {
    id: string;
    companyId: string;
    name: string;
    triggerType: string;
    actionType: string;
    configuration: string; // JSON
    enabled: boolean;
}

export class WorkflowService {
    /**
     * Trigger an automation flow
     */
    static async trigger(companyId: string, triggerType: string, context: any) {
        const db = getDb();
        const automations = await db.all(
            'SELECT * FROM automations WHERE companyId = ? AND triggerType = ? AND enabled = 1',
            [companyId, triggerType]
        );

        console.log(`[Workflow] Triggered ${triggerType} for company ${companyId}. Found ${automations.length} automations.`);

        for (const automation of automations) {
            try {
                await this.executeAction(automation, context);
            } catch (error) {
                console.error(`[Workflow] Failed to execute action for automation ${automation.id}:`, error);
            }
        }
    }

    /**
     * Execute specific action
     */
    private static async executeAction(automation: any, context: any) {
        const config = JSON.parse(automation.configuration || '{}');
        const db = getDb();

        switch (automation.actionType) {
            case 'send_notification':
                // Integration with existing notification system
                // (Assuming a global notification helper or direct DB insert)
                const notificationId = uuidv4();
                await db.run(
                    'INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt, tenantId) SELECT ?, id, ?, ?, ?, 0, ?, ? FROM users WHERE companyId = ?',
                    [
                        notificationId,
                        config.title || `Automation: ${automation.name}`,
                        config.message || `Triggered by ${automation.triggerType}`,
                        config.type || 'info',
                        new Date().toISOString(),
                        automation.companyId,
                        automation.companyId
                    ]
                );
                console.log(`[Workflow] Action Executed: Notification sent for ${automation.id}`);
                break;

            case 'update_task_priority':
                if (context.taskId && config.priority) {
                    await db.run(
                        'UPDATE tasks SET priority = ?, updatedAt = ? WHERE id = ? AND companyId = ?',
                        [config.priority, new Date().toISOString(), context.taskId, automation.companyId]
                    );
                    console.log(`[Workflow] Action Executed: Task ${context.taskId} priority updated to ${config.priority}`);
                }
                break;

            default:
                console.warn(`[Workflow] Unknown action type: ${automation.actionType}`);
        }
    }

    /**
     * CRUD: Get all automations for a tenant
     */
    static async getAutomations(companyId: string) {
        const db = getDb();
        return await db.all('SELECT * FROM automations WHERE companyId = ?', [companyId]);
    }

    /**
     * CRUD: Create automation
     */
    static async createAutomation(companyId: string, data: any) {
        const db = getDb();
        const id = uuidv4();
        const now = new Date().toISOString();

        await db.run(
            'INSERT INTO automations (id, companyId, name, triggerType, actionType, configuration, enabled, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                id,
                companyId,
                data.name,
                data.triggerType,
                data.actionType,
                JSON.stringify(data.configuration || {}),
                data.enabled ?? 1,
                now,
                now
            ]
        );

        return { id, ...data };
    }

    /**
     * CRUD: Update automation
     */
    static async updateAutomation(companyId: string, id: string, data: any) {
        const db = getDb();
        const existing = await db.get('SELECT id FROM automations WHERE id = ? AND companyId = ?', [id, companyId]);
        if (!existing) throw new AppError('Automation not found', 404);

        const updates: string[] = [];
        const params: any[] = [];

        if (data.name) { updates.push('name = ?'); params.push(data.name); }
        if (data.triggerType) { updates.push('triggerType = ?'); params.push(data.triggerType); }
        if (data.actionType) { updates.push('actionType = ?'); params.push(data.actionType); }
        if (data.configuration) { updates.push('configuration = ?'); params.push(JSON.stringify(data.configuration)); }
        if (data.enabled !== undefined) { updates.push('enabled = ?'); params.push(data.enabled ? 1 : 0); }

        updates.push('updatedAt = ?');
        params.push(new Date().toISOString());

        params.push(id);
        params.push(companyId);

        await db.run(
            `UPDATE automations SET ${updates.join(', ')} WHERE id = ? AND companyId = ?`,
            params
        );

        return { id, success: true };
    }

    /**
     * CRUD: Delete automation
     */
    static async deleteAutomation(companyId: string, id: string) {
        const db = getDb();
        await db.run('DELETE FROM automations WHERE id = ? AND companyId = ?', [id, companyId]);
        return { success: true };
    }
}
