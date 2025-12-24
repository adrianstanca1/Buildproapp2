import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  return undefined;
};

// Fallback to production credentials if env vars are missing
const DEFAULT_URL = 'https://zpbuvuxpfemldsknerew.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwYnV2dXhwZmVtbGRza25lcmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTQzMTcsImV4cCI6MjA3MTY5MDMxN30.4wb8_qMaJ0hpkLEv51EWh0pRtVXD3GWWOsuCmZsOx6A';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL || DEFAULT_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY || DEFAULT_KEY;

// Detect placeholder or invalid URLs
const isPlaceholder = !supabaseUrl ||
  supabaseUrl === 'your_supabase_url' ||
  !supabaseUrl.startsWith('http');

const isKeyPlaceholder = !supabaseAnonKey ||
  supabaseAnonKey === 'your_anon_key' ||
  supabaseAnonKey.length < 20;

if (isPlaceholder || isKeyPlaceholder) {
  console.warn('⚠️  Supabase credentials are missing (and defaults failed). Supabase features will not work.');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
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
