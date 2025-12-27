import {
    createClient
} from '@supabase/supabase-js';

const supabaseUrl = 'https://zpbuvuxpfemldsknerew.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjExNDMxNywiZXhwIjoyMDcxNjkwMzE3fQ.gY8kq22SiOxULPdpdhf-sz-C7V9hC2ZtPy5003UYsik';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createDemoUser() {
    console.log('Creating demo user...');

    const {
        data,
        error
    } = await supabase.auth.admin.createUser({
        email: 'demo@buildpro.app',
        password: 'password',
        email_confirm: true,
        user_metadata: {
            full_name: 'Demo User'
        }
    });

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('Demo user created successfully:', data);
    }
}

createDemoUser();