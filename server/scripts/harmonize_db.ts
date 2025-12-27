
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const dotenv = require('dotenv');
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load Env
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const pgUrl = process.env.DATABASE_URL;

if (!pgUrl) {
    console.error('❌ Error: DATABASE_URL is not defined in .env');
    process.exit(1);
}

async function harmonize() {
    console.log('🐘 Connecting to PostgreSQL for schema harmonization...');
    const pool = new Pool({
        connectionString: pgUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    const client = await pool.connect();

    const renames = [
        { table: 'vendors', old: 'company_id', new: 'companyId' },
        { table: 'cost_codes', old: 'project_id', new: 'projectId' },
        { table: 'cost_codes', old: 'company_id', new: 'companyId' },
        { table: 'comments', old: 'company_id', new: 'companyId' },
        { table: 'comments', old: 'entity_type', new: 'entityType' },
        { table: 'comments', old: 'entity_id', new: 'entityId' },
        { table: 'comments', old: 'user_id', new: 'userId' },
        { table: 'comments', old: 'user_name', new: 'userName' },
        { table: 'comments', old: 'parent_id', new: 'parentId' },
        { table: 'comments', old: 'created_at', new: 'createdAt' },
        { table: 'comments', old: 'updated_at', new: 'updatedAt' },
        { table: 'activity_feed', old: 'company_id', new: 'companyId' },
        { table: 'activity_feed', old: 'project_id', new: 'projectId' },
        { table: 'activity_feed', old: 'user_id', new: 'userId' },
        { table: 'activity_feed', old: 'user_name', new: 'userName' },
        { table: 'activity_feed', old: 'entity_type', new: 'entityType' },
        { table: 'activity_feed', old: 'entity_id', new: 'entityId' },
        { table: 'activity_feed', old: 'created_at', new: 'createdAt' },
        { table: 'system_events', old: 'is_read', new: 'isRead' },
        { table: 'system_events', old: 'created_at', new: 'createdAt' },
        { table: 'webhooks', old: 'company_id', new: 'companyId' },
        { table: 'webhooks', old: 'last_triggered', new: 'lastTriggered' },
        { table: 'webhooks', old: 'created_at', new: 'createdAt' },
    ];

    try {
        for (const r of renames) {
            // Check if old column exists
            const checkOld = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
            `, [r.table, r.old]);

            if (checkOld.rows.length > 0) {
                // Check if new column already exists
                const checkNew = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [r.table, r.new]);

                if (checkNew.rows.length === 0) {
                    console.log(`🔄 Renaming ${r.table}.${r.old} to ${r.new}...`);
                    await client.query(`ALTER TABLE ${r.table} RENAME COLUMN ${r.old} TO ${r.new}`);
                    console.log(`✅ Success.`);
                } else {
                    console.log(`◽ Skipping ${r.table}.${r.old} -> ${r.new} (New column already exists)`);
                }
            } else {
                console.log(`◽ Skipping ${r.table}.${r.old} (Old column not found)`);
            }
        }

        console.log('🎉 Schema harmonization complete!');
    } catch (err) {
        console.error('❌ Error during harmonization:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

harmonize();
