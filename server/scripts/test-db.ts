
import 'dotenv/config';
import { initializeDatabase, getDb } from '../database.js';
import { logger } from '../utils/logger.js';

async function verifyDatabase() {
    try {
        logger.info('Starting Database Verification...');

        // 1. Initialize
        await initializeDatabase();
        const db = getDb();
        logger.info('✅ Database Initialized');

        // 2. Simple Query
        const connectivityCheck = await db.get('SELECT 1 as connected');
        logger.info(`✅ Simple Query Successful: connected=${connectivityCheck.connected}`);

        // 3. Check Tables
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map(t => t.name);
        logger.info(`✅ Found ${tables.length} tables: ${tableNames.join(', ')}`);

        // 4. Check Companies Table
        const companies = await db.all('SELECT count(*) as count FROM companies');
        logger.info(`✅ Companies Table Check: ${companies[0].count} companies found`);

        // 5. Check Users Table
        const users = await db.all('SELECT count(*) as count FROM users');
        logger.info(`✅ Users Table Check: ${users[0].count} users found`);

        logger.info('🎉 DATABASE VERIFICATION SUCCESSFUL');
        process.exit(0);
    } catch (error) {
        logger.error('❌ DATABASE VERIFICATION FAILED:', error);
        process.exit(1);
    }
}

verifyDatabase();
