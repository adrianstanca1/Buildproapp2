import {
    createClient
} from '@supabase/supabase-js';

const supabaseUrl = 'https://zpbuvuxpfemldsknerew.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupSuperadmin() {
    console.log('🔧 Setting up SUPERADMIN for adrian.stanca1@gmail.com...\n');

    try {
        // Step 1: Get user ID from auth
        console.log('Step 1: Getting user ID from auth...');
        const {
            data: authData,
            error: authError
        } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Error listing users:', authError);
            return;
        }

        const user = authData.users.find(u => u.email === 'adrian.stanca1@gmail.com');

        if (!user) {
            console.error('❌ User not found in auth system');
            return;
        }

        console.log('✅ Found user:', user.email);
        console.log('   User ID:', user.id);

        // Step 2: Create platform company
        console.log('\nStep 2: Creating platform administration company...');
        const {
            error: companyError
        } = await supabase
            .from('companies')
            .upsert({
                id: 'platform-admin',
                name: 'Platform Administration',
                created_at: new Date().toISOString()
            }, {
                onConflict: 'id'
            });

        if (companyError) {
            console.error('❌ Company error:', companyError);
            return;
        }

        console.log('✅ Platform company ready');

        // Step 3: Create SUPERADMIN membership
        console.log('\nStep 3: Creating SUPERADMIN membership...');
        const {
            data: membership,
            error: membershipError
        } = await supabase
            .from('memberships')
            .upsert({
                user_id: user.id,
                company_id: 'platform-admin',
                role: 'SUPERADMIN',
                status: 'ACTIVE',
                created_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,company_id'
            })
            .select();

        if (membershipError) {
            console.error('❌ Membership error:', membershipError);
            return;
        }

        console.log('✅ SUPERADMIN membership created!');
        console.log('   Membership:', JSON.stringify(membership, null, 2));

        console.log('\n🎉 Setup complete! Please refresh your browser.');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

setupSuperadmin();