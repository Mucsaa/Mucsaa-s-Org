import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl: string = metaEnv.VITE_SUPABASE_URL || '';
const supabasePublishableKey: string = metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabasePublishableKey &&
    supabaseUrl.startsWith('https://') &&
    !supabaseUrl.includes('placeholder')
  );
};

// Create a typed Supabase client
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabasePublishableKey || 'placeholder-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

