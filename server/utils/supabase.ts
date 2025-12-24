
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Service Role Key missing in server environment.');
}

/**
 * Server-side Supabase client with admin privileges
 * Used for tasks like inviting users, managing storage buckets, etc.
 */
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);
