import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Supabase features will not work.');
}

// Use placeholders to prevent crash if env vars are missing
const validUrl = supabaseUrl || 'https://placeholder.supabase.co';
const validKey = supabaseAnonKey || 'placeholder';

export const supabase = createClient(
  validUrl,
  validKey
);

export const uploadFile = async (file: File, bucket: string = 'documents', path?: string) => {
    if (!supabaseUrl) throw new Error("Supabase not configured");

    const filePath = path ? `${path}/${file.name}` : `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

    return publicUrl;
};
