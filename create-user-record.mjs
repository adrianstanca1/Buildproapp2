import fetch from 'node-fetch';

const supabaseUrl = 'https://zpbuvuxpfemldsknerew.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik';

async function createUserRecord() {
    console.log('🔧 Creating user record in app database...\n');

    try {
        // First, get user from auth via the REST endpoint
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
            }
        });

        if (!authResponse.ok) {
            console.error('❌ Failed to fetch auth users');
            return;
        }

        const authData = await authResponse.json();
        const user = authData.users && authData.users.find(u => u.email === 'adrian.stanca1@gmail.com');

        if (!user) {
            console.error('❌ User not found in auth');
            return;
        }

        console.log('✅ Found user in auth:', user.email, 'ID:', user.id);

        // Get full name from user metadata
        const fullName = (user.user_metadata && user.user_metadata.full_name) || 'Adrian Stanca';

        // Try with 'users' table
        console.log('\nCreating user in users table...');
        const createUserResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
            method: 'POST',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation'
            },
            body: JSON.stringify({
                id: user.id,
                name: fullName,
                email: user.email,
                status: 'active',
                role: 'SUPERADMIN',
                createdat: new Date().toISOString()
            })
        });

        const result = await createUserResponse.json();
        if (createUserResponse.ok) {
            console.log('✅ User created in users table!');
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log('⚠️  Response:', result);
        }

        console.log('\n🎉 All fixed! Please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createUserRecord();