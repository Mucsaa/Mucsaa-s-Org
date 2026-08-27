import { supabase, isSupabaseConfigured, isValidUUID } from '../../lib/supabaseClient';
import { PolarisEvolution, PolarisStage } from '../../types';
import { CharacterSettingsRow, Database } from '../../types/database';
import { DEFAULT_POLARIS } from '../../utils/rewards';

export function mapRowToPolaris(row: CharacterSettingsRow): PolarisEvolution {
  return {
    xp: row.xp,
    level: row.level,
    stardust: row.stardust,
    ageDays: row.age_days,
    stage: (row.stage || 'baby') as PolarisStage,
    affinity: row.affinity,
    equippedAccessory: row.equipped_accessory || 'none',
    equippedAura: row.equipped_aura || 'none',
    unlockedItems: Array.isArray(row.unlocked_items) ? row.unlocked_items : ['none'],
    claimedMissions: Array.isArray(row.claimed_missions) ? row.claimed_missions : [],
    lastFedDate: row.last_fed_date || undefined,
    totalCareCount: row.total_care_count || 0,
  };
}

export async function fetchCharacterSettings(userId: string): Promise<PolarisEvolution | null> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return null;
    }

    const { data, error } = await (supabase as any)
      .from('character_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetchCharacterSettings note:', error?.message || error);
      return null;
    }

    if (!data) {
      return null;
    }

    return mapRowToPolaris(data as CharacterSettingsRow);
  } catch (err) {
    console.warn('Supabase fetchCharacterSettings exception:', err);
    return null;
  }
}

export async function upsertCharacterSettings(
  userId: string,
  polaris: PolarisEvolution
): Promise<PolarisEvolution> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return polaris;
  }

  try {
    // Only attempt database upsert if current session matches the user_id (satisfies RLS auth.uid() = user_id)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return polaris;
    }

    const payload: Database['public']['Tables']['character_settings']['Insert'] = {
      user_id: userId,
      xp: polaris.xp,
      level: polaris.level,
      stardust: polaris.stardust,
      age_days: polaris.ageDays,
      stage: polaris.stage,
      affinity: polaris.affinity,
      equipped_accessory: polaris.equippedAccessory,
      equipped_aura: polaris.equippedAura,
      unlocked_items: polaris.unlockedItems,
      claimed_missions: polaris.claimedMissions,
      last_fed_date: polaris.lastFedDate || null,
      total_care_count: polaris.totalCareCount,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase as any)
      .from('character_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase upsertCharacterSettings note:', error?.message || error);
      return polaris;
    }

    return data ? mapRowToPolaris(data as CharacterSettingsRow) : polaris;
  } catch (err) {
    console.warn('Supabase upsertCharacterSettings exception:', err);
    return polaris;
  }
}
