
import { initializeDatabase, getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

const RESOURCES = ['projects', 'tasks', 'companies', 'users', 'roles', 'automations', 'reports', 'settings', 'client_portal', 'daily_logs', 'documents', 'rfis', 'punch_items', 'safety_incidents', 'equipment', 'timesheets', 'chats', 'finance', 'inventory', 'defects', 'risks'];
const ACTIONS = ['create', 'read', 'update', 'delete'];

async function main() {
    console.log('Initializing DB...');
    try {
        // Force DB init
        await initializeDatabase();
        const db = getDb();
        console.log('DB Initialized.');

        // Create tables if they didn't exist (initializeSchema is called by db promise)
        // But we need to ensure the new tables are created. 
        // Since initializeSchema is called once on import/init, and we edited it, it should run.

        const now = new Date().toISOString();

        console.log('Seeding permissions...');

        const permissions: any[] = [];

        for (const resource of RESOURCES) {
            for (const action of ACTIONS) {
                permissions.push({
                    name: `${resource}.${action}`,
                    resource,
                    action,
                    description: `${action} ${resource}`
                });
            }
        }

        // Additional specific permissions if needed
        permissions.push({ name: '*', resource: '*', action: '*', description: 'Superadmin access' });

        let count = 0;
        for (const p of permissions) {
            // Check if existing
            const existing = await db.get('SELECT id FROM permissions WHERE name = ?', [p.name]);
            if (!existing) {
                const id = uuidv4();
                await db.run(
                    `INSERT INTO permissions (id, name, description, resource, action, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [id, p.name, p.description, p.resource, p.action, now, now]
                );
                count++;
            }
        }

        console.log(`Seeded ${count} permissions.`);

        // Verify basic fetch
        const all = await db.all('SELECT name FROM permissions');
        console.log(`Total permissions in DB: ${all.length}`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
