
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    logger.warn('Supabase credentials missing. Storage service will fail.');
}

let supabase: any;

try {
    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    } else {
        throw new Error('Missing credentials');
    }
} catch (e) {
    logger.warn('Supabase Not Configured. Storage operations will fail safely.', { error: e.message });
    supabase = {
        storage: {
            from: () => ({
                upload: async () => ({ error: new Error('Supabase not configured') }),
                createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }), // Mock response
                remove: async () => ({ error: null })
            })
        }
    };
}

export const uploadFile = async (
    bucket: string,
    fileBuffer: Buffer,
    mimeType: string,
    originalName: string,
    pathPrefix: string = ''
): Promise<{ path: string; url: string | null; error: any }> => {
    try {
        const fileExt = originalName.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = pathPrefix ? `${pathPrefix}/${fileName}` : fileName;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false
            });

        if (error) {
            logger.error('Supabase Upload Error:', error);
            return { path: '', url: null, error };
        }

        return { path: data.path, url: null, error: null };
    } catch (e) {
        logger.error('Storage Service Exception:', e);
        return { path: '', url: null, error: e };
    }
};

export const getSignedUrl = async (bucket: string, path: string, expiresIn: number = 3600) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

    if (error) {
        logger.error('Get Signed URL Error:', error);
        throw error;
    }
    return data.signedUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
        .from(bucket)
        .remove([path]);

    if (error) {
        logger.error('Delete File Error:', error);
        throw error;
    }
    return data;
};
