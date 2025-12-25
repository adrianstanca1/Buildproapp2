import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase.js';

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
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check for Impersonation Token
    if (token.startsWith('imp_v1:')) {
        try {
            const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
            if (!secret) {
                console.error('SUPABASE_SERVICE_ROLE_KEY missing; cannot validate impersonation tokens');
                return res.status(500).json({ error: 'Server misconfigured' });
            }
            const parts = token.split(':');
            // Format: imp_v1:{userId}:{timestamp}:{signature}
            // token looks like: imp_v1:userId:timestamp:signature
            // But split might handle colons, userId shouldn't have colons (uuid)

            if (parts.length !== 4) throw new Error('Invalid token format');

            const [prefix, userId, timestamp, signature] = parts;
            const payload = `${prefix}:${userId}:${timestamp}`;

            // Verify HMAC
            const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

            if (signature !== expectedSignature) {
                return res.status(403).json({ error: 'Invalid impersonation token signature' });
            }

            // Check Expiry (e.g. 1 hour)
            const tokenTime = parseInt(timestamp);
            if (Date.now() - tokenTime > 3600000) {
                return res.status(401).json({ error: 'Impersonation session expired' });
            }

            // Hydrate User Context (Minimal)
            // In a real app we might fetch user from DB here to be sure, but for perm middleware:
            // rbacMiddleware usually triggers context/db lookup if needed.
            // BUT req.user usually comes from supabase.auth.getUser

            req.userId = userId;
            req.user = { id: userId, email: 'impersonated@session', app_metadata: { provider: 'impersonation' } };

            // Allow header override for tenant context in impersonation
            req.tenantId = req.headers['x-company-id'];

            if (!req.tenantId) {
                // Try to find default company for this user if missing?
                // For now enforce header.
                return res.status(400).json({ error: 'Tenant context required for impersonation' });
            }

            req.context = {
                userId: req.userId,
                tenantId: req.tenantId,
                role: 'impersonated' // Role lookup will happen in permissionService
            };

            return next();
        } catch (e) {
            console.error('Impersonation Auth Failed:', e);
            return res.status(403).json({ error: 'Invalid impersonation token' });
        }
    }

    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

        if (error || !user) {
            console.error('Auth Error:', error);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        req.userId = user.id;

        // Trust JWT metadata first, fallback to header
        const jwtTenantId = user.user_metadata?.companyId;
        const headerTenantId = req.headers['x-company-id'];

        req.tenantId = jwtTenantId || headerTenantId;

        req.tenantId = jwtTenantId || headerTenantId;

        // Routes that do not require tenant context
        const isPlatformRoute = req.path.includes('/api/companies') ||
            req.path.includes('/api/system-settings') ||
            req.path.includes('/api/auth');

        const isSuperAdmin = user.user_metadata?.role === 'super_admin' || user.user_metadata?.role === 'SUPERADMIN';

        if (!req.tenantId && !isPlatformRoute && !isSuperAdmin) {
            // Block request if no tenant context implies security risk
            console.warn(`[Auth] No tenant context for user ${user.id} on path ${req.path}`);
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
