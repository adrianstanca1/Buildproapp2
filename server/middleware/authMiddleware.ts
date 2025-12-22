import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Auth middleware will fail.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // DEMO MODE: Allow unauthenticated access for development/demo
        // Create a mock demo user instead of rejecting the request
        console.log('[Auth] No token provided - using demo mode');
        req.user = {
            id: 'demo-user',
            email: 'demo@buildpro.app',
            role: 'admin'
        };
        req.userId = 'demo-user';
        req.tenantId = req.headers['x-company-id'] || 'c1'; // Default to first company
        return next();
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Error:', error);
            // Fall back to demo mode instead of rejecting
            console.log('[Auth] Invalid token - falling back to demo mode');
            req.user = {
                id: 'demo-user',
                email: 'demo@buildpro.app',
                role: 'admin'
            };
            req.userId = 'demo-user';
            req.tenantId = req.headers['x-company-id'] || 'c1';
            return next();
        }

        req.user = user;
        req.userId = user.id; // Sync with legacy middleware
        req.tenantId = user.user_metadata?.companyId || req.headers['x-company-id']; // Trust JWT over header if possible

        next();
    } catch (err) {
        console.error('Auth Exception:', err);
        // Fall back to demo mode instead of rejecting
        console.log('[Auth] Auth exception - falling back to demo mode');
        req.user = {
            id: 'demo-user',
            email: 'demo@buildpro.app',
            role: 'admin'
        };
        req.userId = 'demo-user';
        req.tenantId = req.headers['x-company-id'] || 'c1';
        return next();
    }
};
