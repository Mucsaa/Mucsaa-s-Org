-- ==========================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS SUPABASE
-- Agenda Inteligente & Nino / Polaris Companion
-- ==========================================================

-- 1. TABELA DE PERFIS DE USUÁRIOS (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  streak_days INTEGER DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{
    "theme": "light",
    "ninoPersonality": "divertido",
    "ninoColor": "indigo",
    "voiceEnabled": false,
    "soundEffectsEnabled": true,
    "browserNotificationsEnabled": true,
    "dailyGoal": 5
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE CATEGORIAS DE TAREFAS (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  bg_light TEXT,
  bg_dark TEXT,
  text_light TEXT,
  border_light TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id, user_id)
);

-- 3. TABELA DE TAREFAS (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TEXT,
  is_all_day BOOLEAN DEFAULT FALSE,
  category TEXT NOT NULL DEFAULT 'work',
  custom_category_name TEXT,
  custom_color TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  recurrence TEXT NOT NULL DEFAULT 'none',
  estimated_minutes INTEGER,
  reminders JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CONFIGURAÇÕES DO PERSONAGEM (character_settings)
CREATE TABLE IF NOT EXISTS public.character_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  stardust INTEGER DEFAULT 0,
  age_days INTEGER DEFAULT 1,
  stage TEXT DEFAULT 'baby',
  affinity INTEGER DEFAULT 50,
  equipped_accessory TEXT DEFAULT 'none',
  equipped_aura TEXT DEFAULT 'none',
  unlocked_items TEXT[] DEFAULT ARRAY['none']::TEXT[],
  claimed_missions TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_fed_date DATE,
  total_care_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE HISTÓRICO DE AÇÕES (task_history)
CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  action TEXT NOT NULL, -- 'created', 'completed', 'reopened', 'updated', 'deleted'
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE NOTAS (notes)
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general',
  color TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE PUSH SUBSCRIPTIONS (push_subscriptions)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  device_type TEXT DEFAULT 'browser',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE ENTREGAS DE NOTIFICAÇÕES (notification_deliveries - Idempotência)
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  CONSTRAINT unique_task_reminder_delivery UNIQUE (task_id, scheduled_for)
);

-- ==========================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- POLÍTICAS DE ACESSO (POLICIES)
-- ==========================================================

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem deletar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem deletar seu próprio perfil"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- CATEGORIES POLICIES
DROP POLICY IF EXISTS "Usuários podem ver suas próprias categorias" ON public.categories;
CREATE POLICY "Usuários podem ver suas próprias categorias"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar categorias" ON public.categories;
CREATE POLICY "Usuários podem criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas categorias" ON public.categories;
CREATE POLICY "Usuários podem atualizar suas categorias"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas categorias" ON public.categories;
CREATE POLICY "Usuários podem deletar suas categorias"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- TASKS POLICIES
DROP POLICY IF EXISTS "Usuários podem ver apenas suas próprias tarefas" ON public.tasks;
CREATE POLICY "Usuários podem ver apenas suas próprias tarefas"
  ON public.tasks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar tarefas para si" ON public.tasks;
CREATE POLICY "Usuários podem criar tarefas para si"
  ON public.tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas tarefas" ON public.tasks;
CREATE POLICY "Usuários podem atualizar suas tarefas"
  ON public.tasks FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas tarefas" ON public.tasks;
CREATE POLICY "Usuários podem deletar suas tarefas"
  ON public.tasks FOR DELETE
  USING (auth.uid() = user_id);

-- CHARACTER SETTINGS POLICIES
DROP POLICY IF EXISTS "Usuários podem ver seus dados do Polaris" ON public.character_settings;
CREATE POLICY "Usuários podem ver seus dados do Polaris"
  ON public.character_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar seus dados do Polaris" ON public.character_settings;
CREATE POLICY "Usuários podem criar seus dados do Polaris"
  ON public.character_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar seus dados do Polaris" ON public.character_settings;
CREATE POLICY "Usuários podem atualizar seus dados do Polaris"
  ON public.character_settings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus dados do Polaris" ON public.character_settings;
CREATE POLICY "Usuários podem deletar seus dados do Polaris"
  ON public.character_settings FOR DELETE
  USING (auth.uid() = user_id);

-- TASK HISTORY POLICIES
DROP POLICY IF EXISTS "Usuários podem ver seu próprio histórico de tarefas" ON public.task_history;
CREATE POLICY "Usuários podem ver seu próprio histórico de tarefas"
  ON public.task_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir registros no seu histórico" ON public.task_history;
CREATE POLICY "Usuários podem inserir registros no seu histórico"
  ON public.task_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NOTES POLICIES
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem ver suas próprias notas"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem criar suas próprias notas"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem atualizar suas próprias notas"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem deletar suas próprias notas"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- PUSH SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Usuários podem ver apenas suas próprias push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Usuários podem ver apenas suas próprias push subscriptions"
  ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem cadastrar suas push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Usuários podem cadastrar suas push subscriptions"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Usuários podem atualizar suas push subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Usuários podem deletar suas push subscriptions"
  ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- NOTIFICATION DELIVERIES POLICIES
DROP POLICY IF EXISTS "Usuários podem ver suas entregas de notificações" ON public.notification_deliveries;
CREATE POLICY "Usuários podem ver suas entregas de notificações"
  ON public.notification_deliveries FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem registrar entregas de notificações" ON public.notification_deliveries;
CREATE POLICY "Usuários podem registrar entregas de notificações"
  ON public.notification_deliveries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas entregas de notificações" ON public.notification_deliveries;
CREATE POLICY "Usuários podem atualizar suas entregas de notificações"
  ON public.notification_deliveries FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas entregas de notificações" ON public.notification_deliveries;
CREATE POLICY "Usuários podem deletar suas entregas de notificações"
  ON public.notification_deliveries FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================================
-- TRIGGER AUTOMÁTICO PARA NOVOS USUÁRIOS
-- Cria perfil e dados iniciais automaticamente no Auth Sign-Up
-- ==========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name_val TEXT;
BEGIN
  user_name_val := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  -- 1. Cria o perfil do usuário
  INSERT INTO public.profiles (id, name, email, streak_days, last_active_date, tasks_completed, focus_minutes)
  VALUES (
    NEW.id,
    user_name_val,
    NEW.email,
    1,
    CURRENT_DATE,
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Cria as configurações do personagem Polaris
  INSERT INTO public.character_settings (user_id, xp, level, stardust, age_days, stage, affinity, equipped_accessory, equipped_aura, unlocked_items, claimed_missions)
  VALUES (
    NEW.id,
    0,
    1,
    0,
    1,
    'baby',
    50,
    'none',
    'none',
    ARRAY['none']::TEXT[],
    ARRAY[]::TEXT[]
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- 3. Cria as categorias padrão para o novo usuário
  INSERT INTO public.categories (id, user_id, name, icon, color, bg_light, bg_dark, text_light, border_light)
  VALUES
    ('work', NEW.id, 'Trabalho', 'Briefcase', 'indigo', 'bg-indigo-50', 'bg-indigo-950/40', 'text-indigo-700', 'border-indigo-200'),
    ('study', NEW.id, 'Estudos', 'BookOpen', 'amber', 'bg-amber-50', 'bg-amber-950/40', 'text-amber-700', 'border-amber-200'),
    ('health', NEW.id, 'Saúde', 'Heart', 'rose', 'bg-rose-50', 'bg-rose-950/40', 'text-rose-700', 'border-rose-200'),
    ('exercise', NEW.id, 'Exercício', 'Dumbbell', 'emerald', 'bg-emerald-50', 'bg-emerald-950/40', 'text-emerald-700', 'border-emerald-200'),
    ('home', NEW.id, 'Casa', 'Home', 'orange', 'bg-orange-50', 'bg-orange-950/40', 'text-orange-700', 'border-orange-200'),
    ('shopping', NEW.id, 'Compras', 'ShoppingCart', 'cyan', 'bg-cyan-50', 'bg-cyan-950/40', 'text-cyan-700', 'border-cyan-200'),
    ('personal', NEW.id, 'Pessoal', 'User', 'purple', 'bg-purple-50', 'bg-purple-950/40', 'text-purple-700', 'border-purple-200'),
    ('other', NEW.id, 'Outros', 'CheckSquare', 'slate', 'bg-slate-50', 'bg-slate-900/40', 'text-slate-700', 'border-slate-200')
  ON CONFLICT (id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================================
-- PERMISSÕES E ATUALIZAÇÃO DO SCHEMA CACHE DO POSTGREST
-- ==========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Notifica o PostgREST para recarregar o schema cache instantaneamente
NOTIFY pgrst, 'reload schema';

