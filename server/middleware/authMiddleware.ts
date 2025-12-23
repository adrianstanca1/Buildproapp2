import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Auth middleware will fail.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

export const authenticateToken = async (req: any, res: any, next: any) => {
    // Allow public access to shared client portal routes
    // Check originalUrl because it contains the full path including /api prefix
    if (req.originalUrl.includes('/api/client-portal/shared/')) {
        return next();
    }

    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Handle string "null" or "undefined" from frontend
    if (token === 'null' || token === 'undefined') token = undefined;

    // Check environment (default to development if missing/undefined in local)
    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.ENABLE_DEMO_AUTH === 'true';

    if (!token) {
        if (isDev) {
            console.log('[Auth] No token provided - using demo mode (DEV ONLY)');
            req.user = {
                id: 'demo-user',
                email: 'demo@buildpro.app',
                role: 'admin'
            };
            req.userId = 'demo-user';
            req.tenantId = req.headers['x-company-id'] || 'c1';
            // Setup req.context for RBAC middleware
            req.context = {
                userId: req.userId,
                tenantId: req.tenantId,
                role: 'admin'
            };
            return next();
        }

        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Error:', error);

            // STRICT MODE but allow Dev Fallback
            // Re-calculate isDev here just in case, or assume variable scope
            const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV || process.env.ENABLE_DEMO_AUTH === 'true';

            if (isDev) {
                console.log('[Auth] Invalid token - falling back to demo mode (DEV ONLY)');
                req.user = { id: 'demo-user', email: 'demo@buildpro.app', role: 'admin' };
                req.userId = 'demo-user';
                req.tenantId = req.headers['x-company-id'] || 'c1';
                // Setup req.context for RBAC middleware
                req.context = {
                    userId: req.userId,
                    tenantId: req.tenantId,
                    role: 'admin'
                };
                return next();
            }

            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.userId = user.id;

        // Trust JWT metadata first, fallback to header
        const jwtTenantId = user.user_metadata?.companyId;
        const headerTenantId = req.headers['x-company-id'];

        req.tenantId = jwtTenantId || headerTenantId;

        if (!req.tenantId) {
            // Block request if no tenant context implies security risk
            console.warn(`[Auth] No tenant context for user ${user.id}`);
            return res.status(403).json({ error: 'Tenant context required' });
        }

        // Setup req.context for RBAC middleware
        req.context = {
            userId: req.userId,
            tenantId: req.tenantId,
            role: user.user_metadata?.role || 'user'
        };

        next();
    } catch (err) {
        console.error('Auth Exception:', err);
        return res.status(500).json({ error: 'Internal auth error' });
    }
};
