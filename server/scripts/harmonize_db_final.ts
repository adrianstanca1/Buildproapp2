
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');

const pgUrl = "postgres://postgres.zwxyoeqsbntsogvgwily:Cumparavinde1.@aws-1-eu-west-2.pooler.supabase.co:6543/postgres?sslmode=require&pgbouncer=true";

async function harmonize() {
    console.log('🐘 Connecting to PostgreSQL (zwxyoeqsbntsogvgwily - CORRECTED HOST) for schema harmonization...');
    const pool = new Pool({
        connectionString: pgUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        const client = await pool.connect();
        console.log('✅ Connected.');

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

        for (const r of renames) {
            const checkOld = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
            `, [r.table, r.old]);

            if (checkOld.rows.length > 0) {
                const checkNew = await client.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [r.table, r.new]);

                if (checkNew.rows.length === 0) {
                    console.log(`🔄 Renaming ${r.table}.${r.old} to ${r.new}...`);
                    await client.query(`ALTER TABLE ${r.table} RENAME COLUMN ${r.old} TO "${r.new}"`);
                    console.log(`✅ Success.`);
                } else {
                    console.log(`◽ Skipping ${r.table}.${r.old} -> ${r.new} (already exists)`);
                }
            } else {
                console.log(`◽ Skipping ${r.table}.${r.old} (not found)`);
            }
        }

        console.log('🎉 Schema harmonization complete!');
        client.release();
    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

harmonize();
