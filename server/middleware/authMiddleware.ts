import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Auth middleware will fail.');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export const authenticateToken = async (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        // For migration period, we might want to allow legacy headers if env var is set
        if (process.env.ALLOW_LEGACY_AUTH === 'true' && req.headers['x-user-id']) {
            req.user = { id: req.headers['x-user-id'], role: 'admin' }; // Mock
            return next();
        }
        return res.status(401).json({ error: 'Missing authentication token' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Error:', error);
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        req.userId = user.id; // Sync with legacy middleware
        req.tenantId = user.user_metadata?.companyId || req.headers['x-company-id']; // Trust JWT over header if possible

        next();
    } catch (err) {
        console.error('Auth Exception:', err);
        return res.status(403).json({ error: 'Authentication failed' });
    }
};
