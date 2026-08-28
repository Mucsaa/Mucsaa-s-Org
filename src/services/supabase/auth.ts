import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { UserProfile } from '../../types';
import { fetchCharacterSettings, upsertCharacterSettings } from './character';
import { seedDefaultCategories } from './categories';
import { DEFAULT_POLARIS } from '../../utils/rewards';
import { DEFAULT_USER } from '../../utils/storage';

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ user: UserProfile | null; error: string | null; needsEmailConfirmation?: boolean }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'As variáveis do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não estão configuradas.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
      options: {
        data: {
          name: cleanName,
        },
      },
    });

    if (error) {
      return { user: null, error: formatAuthError(error) };
    }

    if (!data.user) {
      return { user: null, error: 'Não foi possível registrar o usuário no Supabase.' };
    }

    const userId = data.user.id;

    // Check if session is already active (auto-confirm enabled on Supabase)
    let activeSession = data.session;
    if (!activeSession) {
      // Try immediate sign-in in case auto-confirm is active on server
      try {
        const signInRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPassword,
        });
        activeSession = signInRes.data?.session || null;
      } catch {
        // Confirmation required via email
      }
    }

    let polarisData = null;
    if (activeSession) {
      // Session is established and verified in Supabase auth; initialize user tables
      try {
        polarisData = await upsertCharacterSettings(userId, DEFAULT_POLARIS);
      } catch (e) {
        console.warn('Character settings creation fallback:', e);
      }

      try {
        await seedDefaultCategories(userId);
      } catch (e) {
        console.warn('Seed default categories fallback:', e);
      }
    }

    const fullProfile: UserProfile = {
      ...DEFAULT_USER,
      id: userId,
      name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
      email: cleanEmail,
      polaris: polarisData || DEFAULT_POLARIS,
    };

    return {
      user: fullProfile,
      error: null,
      needsEmailConfirmation: !activeSession,
    };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Erro inesperado ao registrar no Supabase.' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: UserProfile | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return {
      user: null,
      error: 'As variáveis do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não estão configuradas.',
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (error) {
      return { user: null, error: formatAuthError(error) };
    }

    if (!data.user || !data.session) {
      return { user: null, error: 'Usuário ou sessão não encontrados.' };
    }

    const userId = data.user.id;

    // Load or initialize character settings
    let polaris = await fetchCharacterSettings(userId);
    if (!polaris) {
      polaris = await upsertCharacterSettings(userId, DEFAULT_POLARIS);
    }

    // Seed default categories if first login
    await seedDefaultCategories(userId);

    const metaName = data.user.user_metadata?.name || cleanEmail.split('@')[0];

    const fullProfile: UserProfile = {
      ...DEFAULT_USER,
      id: userId,
      name: metaName.charAt(0).toUpperCase() + metaName.slice(1),
      email: data.user.email || cleanEmail,
      polaris: polaris || DEFAULT_POLARIS,
    };

    return { user: fullProfile, error: null };
  } catch (err: any) {
    return { user: null, error: err?.message || 'Erro inesperado ao entrar no Supabase.' };
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
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || !session.user) {
      return null;
    }

    const userId = session.user.id;
    let polaris = await fetchCharacterSettings(userId);
    if (!polaris) {
      polaris = await upsertCharacterSettings(userId, DEFAULT_POLARIS);
    }

    await seedDefaultCategories(userId);

    const metaName =
      session.user.user_metadata?.name ||
      session.user.email?.split('@')[0] ||
      'Usuário';

    return {
      ...DEFAULT_USER,
      id: userId,
      name: metaName.charAt(0).toUpperCase() + metaName.slice(1),
      email: session.user.email || '',
      polaris: polaris || DEFAULT_POLARIS,
    };
  } catch (err) {
    console.error('Error fetching current user session:', err);
    return null;
  }
}

function formatAuthError(error: any): string {
  if (!error) return 'Erro de autenticação desconhecido.';
  const msg = typeof error === 'string' ? error : error.message || error.error_description || String(error);

  if (msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado. Faça login com sua senha.';
  }
  if (msg.includes('Password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.';
  }
  if (msg.includes('Email rate limit exceeded') || msg.includes('over_email_send_rate_limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'E-mail não confirmado. Desative a confirmação de e-mail no painel do Supabase (Authentication > Providers > Email) para login imediato.';
  }
  if (msg.includes('Invalid path specified')) {
    return 'Erro na URL do Supabase: certifique-se de que VITE_SUPABASE_URL contenha apenas a URL base (ex: https://xxx.supabase.co).';
  }
  if (msg.includes('Forbidden use of secret API key') || msg.includes('secret API key')) {
    return 'Chave de API inválida no navegador: você usou a chave secreta (Secret/Service Role). No Supabase, use a chave pública "anon" (Project Settings > API > Project API keys > anon public).';
  }

  return msg;
}
