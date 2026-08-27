import { supabase, isSupabaseConfigured, isValidUUID } from '../../lib/supabaseClient';
import { CategoryConfig, TaskCategory } from '../../types';
import { CategoryRow, Database } from '../../types/database';
import { CATEGORIES } from '../../utils/constants';

export function mapRowToCategory(row: CategoryRow): CategoryConfig {
  return {
    id: row.id as TaskCategory,
    name: row.name,
    icon: row.icon,
    color: row.color,
    bgLight: row.bg_light || 'bg-slate-50',
    bgDark: row.bg_dark || 'bg-slate-900/40',
    textLight: row.text_light || 'text-slate-800',
    borderLight: row.border_light || 'border-slate-200',
  };
}

export async function fetchUserCategories(userId: string): Promise<CategoryConfig[]> {
  const defaultList = Object.values(CATEGORIES);

  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return defaultList;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return defaultList;
    }

    const { data, error } = await (supabase as any)
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetchUserCategories note:', error?.message || error);
      return defaultList;
    }

    if (!data || data.length === 0) {
      return defaultList;
    }

    return (data as CategoryRow[]).map(mapRowToCategory);
  } catch (err) {
    console.warn('Supabase fetchUserCategories exception:', err);
    return defaultList;
  }
}

export async function createCategory(
  userId: string,
  category: CategoryConfig
): Promise<CategoryConfig> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return category;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return category;
    }

    const payload: Database['public']['Tables']['categories']['Insert'] = {
      id: category.id,
      user_id: userId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      bg_light: category.bgLight,
      bg_dark: category.bgDark,
      text_light: category.textLight,
      border_light: category.borderLight,
    };

    const { data, error } = await (supabase as any)
      .from('categories')
      .insert(payload)
      .select()
      .maybeSingle();

    if (error) {
      console.warn('Supabase createCategory note:', error?.message || error);
      return category;
    }

    return data ? mapRowToCategory(data) : category;
  } catch (err) {
    console.warn('Supabase createCategory exception:', err);
    return category;
  }
}

export async function seedDefaultCategories(userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return;
    }

    // Check if categories already exist for this user to avoid redundant upserts and RLS checks
    const { data: existing, error: fetchErr } = await (supabase as any)
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (fetchErr) {
      console.warn('Supabase check existing categories note:', fetchErr?.message || fetchErr);
    }

    if (existing && existing.length > 0) {
      return; // Already initialized for this user
    }

    const rows: Database['public']['Tables']['categories']['Insert'][] = Object.values(CATEGORIES).map((cat) => ({
      id: cat.id,
      user_id: userId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      bg_light: cat.bgLight,
      bg_dark: cat.bgDark,
      text_light: cat.textLight,
      border_light: cat.borderLight,
    }));

    const { error } = await (supabase as any).from('categories').upsert(rows);
    if (error) {
      console.warn('Could not seed default categories into Supabase:', error?.message || error);
    }
  } catch (e) {
    console.warn('Seed default categories exception:', e);
  }
}
