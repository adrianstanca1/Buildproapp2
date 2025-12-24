import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

class LocalFileAdapter {
    async upload(bucket: string, filePath: string, fileBuffer: Buffer) {
        const fullPath = path.join(UPLOADS_DIR, bucket, filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(fullPath, fileBuffer);
        return { data: { path: `${bucket}/${filePath}` }, error: null };
    }

    getPublicUrl(bucket: string, filePath: string) {
        return { data: { publicUrl: `/uploads/${bucket}/${filePath}` } };
    }
}

const localAdapter = new LocalFileAdapter();

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
    logger.warn('Supabase Not Configured. Using Local Filesystem Storage.');
    supabase = {
        storage: {
            from: (bucket: string) => ({
                upload: async (path: string, file: Buffer) => localAdapter.upload(bucket, path, file),
                createSignedUrl: async (path: string) => ({ data: { signedUrl: `/uploads/${bucket}/${path}` }, error: null }),
                remove: async () => ({ error: null })
            }),
            createBucket: async (name: string) => ({ data: { name }, error: null }),
            getBucket: async (name: string) => ({ data: null, error: { message: 'Not found' } })
        }
    };
}

/**
 * Creates a dedicated storage bucket for a tenant
 */
export const createTenantBucket = async (tenantId: string) => {
    const bucketName = `tenant-${tenantId}`;
    logger.info(`Provisioning storage bucket: ${bucketName}`);

    const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB
        allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (error && error.message !== 'Bucket already exists') {
        logger.error('Failed to create tenant bucket:', error);
        return { error };
    }

    return { data, error: null };
};

/**
 * Ensures a tenant bucket exists, creating it if necessary
 */
export const ensureTenantBucket = async (tenantId: string) => {
    const bucketName = `tenant-${tenantId}`;
    const { data: bucket, error: getError } = await supabase.storage.getBucket(bucketName);

    if (getError || !bucket) {
        return createTenantBucket(tenantId);
    }

    return { data: bucket, error: null };
};

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

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const extractDocumentData = async (
    fileBuffer: Buffer,
    mimeType: string,
    promptType: 'invoice' | 'rfi' | 'general' = 'general'
) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('Gemini API key missing for OCR');
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const part = {
            inlineData: {
                data: fileBuffer.toString('base64'),
                mimeType
            }
        };

        const prompts = {
            invoice: 'Extract data from this invoice: vendor name, invoice date, amount due, and line items. Return JSON.',
            rfi: 'Extract data from this RFI document: subject, question, assigned to, and due date. Return JSON.',
            general: 'Extract the most important structured data from this construction document. Return JSON.'
        };

        const result = await model.generateContent([prompts[promptType], part]);
        const response = await result.response;
        const text = response.text();

        // Extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : { text };
    } catch (error) {
        logger.error('OCR Extraction Error:', error);
        throw error;
    }
};
