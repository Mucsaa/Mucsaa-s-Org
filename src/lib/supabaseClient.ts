import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Credentials provided for the project
const DEFAULT_SUPABASE_URL = 'https://qytekphleuholefczmyo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_4tWk4JDx9qLSzQWyKCwo0Q_HNPoCmZv';

// Safely retrieve environment variables with fallbacks to provided project credentials
const env = (import.meta as any).env || {};

const rawUrl: string =
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const rawKey: string =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

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
 * If a secret key (starting with sb_secret_ or service_role) is detected, it is rejected
 * to prevent the "Forbidden use of secret API key in browser" error.
 */
export function normalizeSupabaseKey(inputKey?: string): string {
  if (!inputKey || typeof inputKey !== 'string') return '';
  const cleaned = inputKey.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return '';

  // Secret keys must never be used in browser client
  if (cleaned.startsWith('sb_secret_') || cleaned.toLowerCase().includes('service_role')) {
    console.warn('Secret key detected in browser environment variables. Supabase blocks secret keys in browsers. Use the "anon" / "publishable" key.');
    return DEFAULT_SUPABASE_ANON_KEY;
  }

  return cleaned;
}

export const supabaseUrl = normalizeSupabaseUrl(rawUrl) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = normalizeSupabaseKey(rawKey) || DEFAULT_SUPABASE_ANON_KEY;

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

// Create a single centralized typed Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
