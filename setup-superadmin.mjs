import pg from 'pg';

const {
    Client
} = pg;

const client = new Client({
    connectionString: 'postgresql://postgres:Cumparavinde1@db.zpbuvuxpfemldsknerew.supabase.co:5432/postgres'
});

async function setupSuperAdmin() {
    try {
        await client.connect();
        console.log('Connected to database');

        // 1. Get user ID from auth.users
        const userResult = await client.query(
            "SELECT id, email FROM auth.users WHERE email = $1",
            ['adrian.stanca1@gmail.com']
        );

        if (userResult.rows.length === 0) {
            console.error('❌ User not found in auth system');
            return;
        }

        const userId = userResult.rows[0].id;
        console.log('✅ Found user:', userResult.rows[0].email, 'ID:', userId);

        // 2. Create platform company if it doesn't exist
        await client.query(`
      INSERT INTO companies (id, name, created_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (id) DO NOTHING
    `, ['platform-admin', 'Platform Administration']);

        console.log('✅ Platform company ready');

        // 3. Create membership with SUPERADMIN role
        const membershipResult = await client.query(`
      INSERT INTO memberships (user_id, company_id, role, status, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id, company_id) 
      DO UPDATE SET role = $3, status = $4
      RETURNING *
    `, [userId, 'platform-admin', 'SUPERADMIN', 'ACTIVE']);

        console.log('✅ SUPERADMIN membership created:', membershipResult.rows[0]);
        console.log('\n🎉 Setup complete! Please refresh your browser.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

setupSuperAdmin();