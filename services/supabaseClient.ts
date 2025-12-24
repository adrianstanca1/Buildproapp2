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

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env?.VITE_SUPABASE_ANON_KEY;

// Detect placeholder or invalid URLs
const isPlaceholder = !supabaseUrl ||
  supabaseUrl === 'your_supabase_url' ||
  !supabaseUrl.startsWith('http');

const isKeyPlaceholder = !supabaseAnonKey ||
  supabaseAnonKey === 'your_anon_key' ||
  supabaseAnonKey.length < 20;

if (isPlaceholder || isKeyPlaceholder) {
  console.warn('⚠️  Supabase credentials are missing or invalid. Using placeholder values. Supabase features will not work.');
}

// Use placeholders to prevent crash if env vars are missing or invalid
const validUrl = isPlaceholder ? 'https://placeholder.supabase.co' : supabaseUrl;
const validKey = isKeyPlaceholder ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder' : supabaseAnonKey;

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
