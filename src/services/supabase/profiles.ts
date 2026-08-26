import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { UserProfile, UserPreferences } from '../../types';
import { ProfileRow, Database } from '../../types/database';
import { DEFAULT_POLARIS } from '../../utils/rewards';
import { getTodayString } from '../../utils/dateUtils';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  ninoPersonality: 'divertido',
  ninoColor: 'indigo',
  voiceEnabled: false,
  soundEffectsEnabled: true,
  browserNotificationsEnabled: true,
  dailyGoal: 5,
};

export function mapRowToProfile(row: ProfileRow): Partial<UserProfile> {
  const prefs = typeof row.preferences === 'object' && row.preferences !== null
    ? { ...DEFAULT_PREFERENCES, ...(row.preferences as unknown as Partial<UserPreferences>) }
    : DEFAULT_PREFERENCES;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url || undefined,
    streakDays: row.streak_days,
    lastActiveDate: row.last_active_date,
    tasksCompleted: row.tasks_completed,
    focusMinutes: row.focus_minutes,
    preferences: prefs,
    createdAt: row.created_at,
  };
}

export async function fetchUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile from Supabase:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRowToProfile(data as ProfileRow);
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string; email: string; name: string }): Promise<Partial<UserProfile>> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase credentials not configured');
  }

  const payload: Database['public']['Tables']['profiles']['Insert'] = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatarUrl || null,
    streak_days: profile.streakDays ?? 1,
    last_active_date: profile.lastActiveDate || getTodayString(),
    tasks_completed: profile.tasksCompleted ?? 0,
    focus_minutes: profile.focusMinutes ?? 0,
    preferences: (profile.preferences || DEFAULT_PREFERENCES) as unknown as Database['public']['Tables']['profiles']['Insert']['preferences'],
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await (supabase as any)
    .from('profiles')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Error saving profile to Supabase:', error);
    throw error;
  }

  return mapRowToProfile(data as ProfileRow);
}

export async function updateUserStats(
  userId: string,
  stats: {
    tasksCompleted?: number;
    focusMinutes?: number;
    streakDays?: number;
    lastActiveDate?: string;
  }
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const updateData: Database['public']['Tables']['profiles']['Update'] = {
    updated_at: new Date().toISOString(),
  };

  if (stats.tasksCompleted !== undefined) updateData.tasks_completed = stats.tasksCompleted;
  if (stats.focusMinutes !== undefined) updateData.focus_minutes = stats.focusMinutes;
  if (stats.streakDays !== undefined) updateData.streak_days = stats.streakDays;
  if (stats.lastActiveDate !== undefined) updateData.last_active_date = stats.lastActiveDate;

  const { error } = await (supabase as any)
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user stats in Supabase:', error);
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await (supabase as any)
    .from('profiles')
    .update({
      preferences: preferences as unknown as Database['public']['Tables']['profiles']['Update']['preferences'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating preferences in Supabase:', error);
    throw error;
  }
}
