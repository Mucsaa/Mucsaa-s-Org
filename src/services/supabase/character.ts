import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
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
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await (supabase as any)
    .from('character_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching character settings from Supabase:', error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapRowToPolaris(data as CharacterSettingsRow);
}

export async function upsertCharacterSettings(
  userId: string,
  polaris: PolarisEvolution
): Promise<PolarisEvolution> {
  if (!isSupabaseConfigured()) {
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
    .single();

  if (error) {
    console.error('Error updating character settings in Supabase:', error);
    throw error;
  }

  return mapRowToPolaris(data as CharacterSettingsRow);
}
