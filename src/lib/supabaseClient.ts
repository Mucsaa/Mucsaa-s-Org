import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Centralized credentials provided for the project
const DEFAULT_SUPABASE_URL = 'https://qytekphleuholefczmyo.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_4tWk4JDx9qLSzQWyKCwo0Q_HNPoCmZv';

// Safely retrieve environment variables with fallbacks to provided project credentials
const env = (import.meta as any).env || {};

/**
 * Normalizes the Supabase URL to ensure it is only the base domain (e.g., https://xyz.supabase.co).
 * Eliminates any trailing slashes, /auth/v1, /rest/v1, or subpaths.
 */
export function normalizeSupabaseUrl(inputUrl?: string): string {
  if (!inputUrl || typeof inputUrl !== 'string') return DEFAULT_SUPABASE_URL;
  const cleaned = inputUrl.trim().replace(/^["']|["']$/g, '');
  if (!cleaned) return DEFAULT_SUPABASE_URL;

  try {
    const urlObj = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
    return urlObj.origin;
  } catch {
    return cleaned
      .replace(/\/auth\/v1.*$/i, '')
      .replace(/\/rest\/v1.*$/i, '')
      .replace(/\/+$/, '');
  }
}

/**
 * Checks if a candidate API key is a safe, public client-side key (anon / publishable).
 * Secret keys (sb_secret_* or service_role) are strictly rejected to protect security
 * and prevent browser-level exceptions.
 */
export function isSafePublicKey(candidate?: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const key = candidate.trim().replace(/^["']|["']$/g, '');
  if (!key || key.length < 10) return false;

  // Reject secret keys immediately
  if (key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role')) {
    return false;
  }

  // If it is a JWT, verify payload role is not service_role
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload?.role && payload.role !== 'anon' && payload.role !== 'authenticated') {
        return false;
      }
    }
  } catch {
    // Non-JWT keys like sb_publishable_* are standard in modern Supabase
  }

  return true;
}

/**
 * Selects strictly a valid public/anon/publishable key for browser execution.
 */
export function resolveSupabasePublicKey(): string {
  const candidates = [
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    env.VITE_SUPABASE_ANON_KEY,
    env.SUPABASE_ANON_KEY,
    env.VITE_SUPABASE_KEY,
  ];

  for (const candidate of candidates) {
    if (isSafePublicKey(candidate)) {
      return candidate.trim().replace(/^["']|["']$/g, '');
    }
  }

  return DEFAULT_SUPABASE_ANON_KEY;
}

export const supabaseUrl = normalizeSupabaseUrl(env.VITE_SUPABASE_URL || env.SUPABASE_URL) || DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = resolveSupabasePublicKey();

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

// Create a single centralized typed Supabase client using strictly public keys
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

