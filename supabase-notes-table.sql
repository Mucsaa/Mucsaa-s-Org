-- ==========================================================
-- POLARIS AGENDA - CRIAÇÃO DA TABELA NOTES (SUPABASE)
-- Execute este script no SQL Editor do Supabase Dashboard
-- ==========================================================

-- 1. Cria a tabela de notas se não existir
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

-- 2. Índices de performance para busca rápida e ordenação
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_pinned_updated ON public.notes(user_id, is_pinned DESC, updated_at DESC);

-- 3. Habilita Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acesso RLS isoladas por usuário (auth.uid() = user_id)
DROP POLICY IF EXISTS "Usuários podem ver suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem ver suas próprias notas"
  ON public.notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem criar suas próprias notas"
  ON public.notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem atualizar suas próprias notas"
  ON public.notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias notas" ON public.notes;
CREATE POLICY "Usuários podem deletar suas próprias notas"
  ON public.notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Concede permissões necessárias para a API (PostgREST)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.notes TO authenticated;
GRANT SELECT ON public.notes TO anon;

-- 6. Força o recarregamento imediato do cache de esquemas do PostgREST
NOTIFY pgrst, 'reload schema';
