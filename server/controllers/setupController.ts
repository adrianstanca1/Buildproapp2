import { createServerSupabaseClient } from '../../services/supabaseClient.js';

export const setupSuperadmin = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const supabase = createServerSupabaseClient();

        // 1. Get user from auth
        const { data: authData } = await supabase.auth.admin.listUsers();
        const user = authData.users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ error: 'User not found in auth system' });
        }

        // 2. Create platform company
        const { error: companyError } = await supabase
            .from('companies')
            .upsert({
                id: 'platform-admin',
                name: 'Platform Administration',
                created_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (companyError) {
            console.error('Company error:', companyError);
        }

        // 3. Create SUPERADMIN membership
        const { data: membership, error: membershipError } = await supabase
            .from('memberships')
            .upsert({
                user_id: user.id,
                company_id: 'platform-admin',
                role: 'SUPERADMIN',
                status: 'ACTIVE',
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,company_id' })
            .select();

        if (membershipError) {
            return res.status(500).json({ error: membershipError.message });
        }

        res.json({
            success: true,
            message: 'User is now a SUPERADMIN',
            membership
        });

    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ error: error.message });
    }
};
