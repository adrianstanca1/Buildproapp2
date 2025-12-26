
import { initializeDatabase, getDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

async function fix() {
    console.log('Initializing DB...');
    await initializeDatabase();
    const db = getDb();

    const membership = {
        id: uuidv4(),
        userId: 'demo-user',
        companyId: 'c1',
        role: 'SUPERADMIN',
        status: 'active'
    };

    console.log('Checking for existing membership...');
    const existing = await db.get('SELECT * FROM memberships WHERE userId = ? AND companyId = ?', [membership.userId, membership.companyId]);

    if (existing) {
        console.log('Membership already exists:', existing);
        // Force update to be sure
        await db.run('UPDATE memberships SET role = ?, status = ? WHERE userId = ? AND companyId = ?',
            ['SUPERADMIN', 'active', membership.userId, membership.companyId]);
        console.log('Updated existing membership.');
    } else {
        console.log('Inserting membership...');
        await db.run(
            `INSERT INTO memberships (id, userId, companyId, role, status, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [membership.id, membership.userId, membership.companyId, membership.role, membership.status, new Date().toISOString(), new Date().toISOString()]
        );
        console.log('Inserted membership.');
    }
}

fix().catch(console.error);
