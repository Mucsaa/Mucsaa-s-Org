import { UserProfile, UserPreferences } from '../../types';
import { DEFAULT_USER } from '../../utils/storage';

/**
 * Profiles helper operating on local storage and user metadata.
 * Note: Table 'profiles' is NOT queried to match the exact 4-table Supabase schema:
 * categories, tasks, character_settings, task_history.
 */

export async function fetchUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
  // Returns null so App.tsx can use auth metadata + character_settings without making invalid table queries
  return null;
}

export async function upsertUserProfile(profile: Partial<UserProfile> & { id: string; email: string; name: string }): Promise<Partial<UserProfile>> {
  return profile;
}

export async function updateUserStats(
  _userId: string,
  _stats: {
    tasksCompleted?: number;
    focusMinutes?: number;
    streakDays?: number;
    lastActiveDate?: string;
  }
): Promise<void> {
  // Stats are kept in local storage and Mascot state (character_settings)
}

export async function updateUserPreferences(
  _userId: string,
  _preferences: UserPreferences
): Promise<void> {
  // Preferences are managed client-side
}
