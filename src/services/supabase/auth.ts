import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { UserProfile } from '../../types';
import { fetchUserProfile, upsertUserProfile } from './profiles';
import { fetchCharacterSettings, upsertCharacterSettings } from './character';
import { seedDefaultCategories } from './categories';
import { DEFAULT_POLARIS } from '../../utils/rewards';
import { getTodayString } from '../../utils/dateUtils';
import { DEFAULT_USER } from '../../utils/storage';

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserProfile | null; error: string | null; needsEmailConfirmation?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase não está configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      options: {
        data: {
          name: name.trim(),
        },
      },
    });

    if (error) {
      return { user: null, error: translateAuthError(error.message) };
    }

    if (!data.user) {
      return { user: null, error: 'Falha ao criar usuário.' };
    }

    const userId = data.user.id;
    const userName = name.trim() || email.split('@')[0];

    // Initialize or upsert Profile in Supabase
    const initialProfile: Partial<UserProfile> & { id: string; email: string; name: string } = {
      id: userId,
      name: userName.charAt(0).toUpperCase() + userName.slice(1),
      email: email.trim().toLowerCase(),
      streakDays: 1,
      lastActiveDate: getTodayString(),
      tasksCompleted: 0,
      focusMinutes: 0,
      preferences: DEFAULT_USER.preferences,
    };

    let profileData: Partial<UserProfile> | null = null;
    try {
      profileData = await upsertUserProfile(initialProfile);
    } catch (e) {
      console.warn('Profile auto-trigger might have created profile:', e);
      profileData = await fetchUserProfile(userId);
    }

    // Initialize Character Settings
    let polarisData = null;
    try {
      polarisData = await upsertCharacterSettings(userId, DEFAULT_POLARIS);
    } catch (e) {
      console.warn('Character settings creation fallback:', e);
      polarisData = await fetchCharacterSettings(userId);
    }

    // Seed default categories
    await seedDefaultCategories(userId);

    const fullProfile: UserProfile = {
      ...DEFAULT_USER,
      ...(profileData || initialProfile),
      id: userId,
      name: userName,
      email: email.toLowerCase(),
      polaris: polarisData || DEFAULT_POLARIS,
    };

    const needsEmailConfirmation = !data.session && Boolean(data.user);

    return {
      user: fullProfile,
      error: null,
      needsEmailConfirmation,
    };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Erro inesperado ao registrar.' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'Supabase não está configurado. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error) {
      return { user: null, error: translateAuthError(error.message) };
    }

    if (!data.user) {
      return { user: null, error: 'Usuário não encontrado.' };
    }

    const userId = data.user.id;
    const profile = await fetchUserProfile(userId);
    const polaris = await fetchCharacterSettings(userId);

    const fullProfile: UserProfile = {
      ...DEFAULT_USER,
      ...(profile || {}),
      id: userId,
      name: profile?.name || data.user.user_metadata?.name || email.split('@')[0],
      email: data.user.email || email,
      polaris: polaris || DEFAULT_POLARIS,
    };

    return { user: fullProfile, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Erro inesperado ao entrar.' };
  }
}

export async function signOutUser(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Sign out error:', e);
  }
}

export async function getFullCurrentUserData(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return null;
    }

    const userId = session.user.id;
    const profile = await fetchUserProfile(userId);
    const polaris = await fetchCharacterSettings(userId);

    return {
      ...DEFAULT_USER,
      ...(profile || {}),
      id: userId,
      name: profile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
      email: session.user.email || profile?.email || '',
      polaris: polaris || DEFAULT_POLARIS,
    };
  } catch (err) {
    console.error('Error fetching current user session:', err);
    return null;
  }
}

function translateAuthError(msg: string): string {
  if (msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar com sua senha.';
  }
  if (msg.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('Email rate limit exceeded')) {
    return 'Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'E-mail não confirmado. Verifique sua caixa de entrada ou desative a confirmação de e-mail no painel do Supabase.';
  }
  return msg;
}
