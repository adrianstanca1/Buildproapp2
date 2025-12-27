import {
    createClient
} from '@supabase/supabase-js';

const supabaseUrl = 'https://zpbuvuxpfemldsknerew.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik';

async function fixCompanyData() {
    console.log('🔧 Fixing platform-admin company data...\n');

    try {
        // Update company with only fields that exist in the schema
        const response = await fetch(`${supabaseUrl}/rest/v1/companies?id=eq.platform-admin`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                name: 'Platform Administration',
                plan: 'Enterprise',
                status: 'Active',
                maxusers: 999,
                maxprojects: 999
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('❌ Update failed:', error);
            return;
        }

        const result = await response.json();
        console.log('✅ Company data updated!');
        console.log(JSON.stringify(result, null, 2));
        console.log('\n🎉 All fixed! Please refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixCompanyData();