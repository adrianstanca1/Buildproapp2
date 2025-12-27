import fetch from 'node-fetch';

const supabaseUrl = 'https://zpbuvuxpfemldsknerew.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik';

async function setupSuperadmin() {
    console.log('🔧 Manual setup using REST API...\n');

    try {
        // Step 1: Try to insert company
        console.log('Step 1: Creating company...');
        const companyResponse = await fetch(`${supabaseUrl}/rest/v1/companies`, {
            method: 'POST',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                id: 'platform-admin',
                name: 'Platform Administration'
            })
        });

        if (!companyResponse.ok) {
            const error = await companyResponse.text();
            console.log('⚠️  Company response:', companyResponse.status, error);
        } else {
            console.log('✅ Company created/exists');
        }

        // Step 2: Get logged-in user's ID from a known location
        // Since we can't query auth.users, we need the user to provide their ID
        console.log('\n⚠️  Cannot automatically get user ID from auth.users');
        console.log('\nTo complete setup, please:');
        console.log('1. Log into your app at https://buildpro-app-432002951446.us-central1.run.app');
        console.log('2. Open browser DevTools Console (F12)');
        console.log('3. Run this command:');
        console.log('   localStorage.getItem("sb-zpbuvuxpfemldsknerew-supabase-co-auth-token")');
        console.log('4. Look for the "user" object and copy the "id" field');
        console.log('5. Run: node insert-membership.mjs YOUR_USER_ID_HERE');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupSuperadmin();