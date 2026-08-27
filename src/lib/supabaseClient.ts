import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Safely retrieve environment variables with fallbacks
const env = (import.meta as any).env || {};

const rawUrl: string =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  '';

const rawKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_KEY ||
  '';

/**
 * Normalizes the Supabase URL to ensure it is only the base domain (e.g., https://xyz.supabase.co).
 * Eliminates any trailing slashes, /auth/v1, /rest/v1, or subpaths that cause "Invalid path specified in request URL".
 */
export function normalizeSupabaseUrl(inputUrl?: string): string {
  if (!inputUrl || typeof inputUrl !== 'string') return '';
  let cleaned = inputUrl.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';

  try {
    const urlObj = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    // Return strictly protocol + host (origin) without any pathname or trailing slash
    return urlObj.origin;
  } catch {
    // Fallback regex cleaning if URL parser fails
    return cleaned
      .replace(/\/auth\/v1.*$/i, '')
      .replace(/\/rest\/v1.*$/i, '')
      .replace(/\/+$/, '');
  }
}

/**
 * Normalizes the API key by trimming whitespace and surrounding quotes.
 */
export function normalizeSupabaseKey(inputKey?: string): string {
  if (!inputKey || typeof inputKey !== 'string') return '';
  return inputKey.trim().replace(/^["']|["']$/g, '');
}

export const supabaseUrl = normalizeSupabaseUrl(rawUrl);
export const supabaseAnonKey = normalizeSupabaseKey(rawKey);

/**
 * Checks if Supabase has been properly configured with valid URL and key.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};

export const isValidUUID = (id?: string | null): boolean => {
  if (!id || typeof id !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

export const isAuthUser = (user?: { id?: string | null; email?: string | null } | null): boolean => {
  if (!user || !user.id) return false;
  return isSupabaseConfigured() && isValidUUID(user.id) && Boolean(user.email);
};

// Use valid configured URL/Key, or fallback to standard dummy for type-safe offline mode
const clientUrl = isSupabaseConfigured() ? supabaseUrl : 'https://ziuhudpvqflxggfiwemz.supabase.co';
const clientKey = isSupabaseConfigured() ? supabaseAnonKey : 'sb_publishable_placeholder';

// Create a single centralized typed Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(
  clientUrl,
  clientKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
