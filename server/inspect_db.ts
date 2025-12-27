
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects';
    `);
        console.log('Projects Schema:', res.rows);

        const res2 = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shared_links';
    `);
        console.log('Shared Links Schema:', res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

inspect();
