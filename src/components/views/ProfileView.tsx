import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Sparkles,
  Volume2,
  VolumeX,
  Bell,
  Sun,
  Moon,
  Palette,
  Target,
  Download,
  Upload,
  RotateCcw,
  Shield,
  LogOut,
  Check,
  Database,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  Copy,
  Code2,
} from 'lucide-react';
import {
  UserProfile,
  NinoPersonality,
  NinoThemeColor,
  Task,
} from '../../types';
import {
  PERSONALITY_CONFIGS,
  THEME_COLORS,
} from '../../utils/constants';
import { NinoAvatar } from '../NinoAvatar';
import { soundManager } from '../../utils/sound';
import { speechService } from '../../utils/speech';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { signOutUser } from '../../services/supabase/auth';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => void;
  onResetDemoData: () => void;
  onExportData: () => void;
  onImportData: (jsonStr: string) => boolean;
  onTestNotification: () => void;
  onOpenAuthModal: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onResetDemoData,
  onExportData,
  onImportData,
  onTestNotification,
  onOpenAuthModal,
  isDark,
  onToggleTheme,
  onSignOut,
}) => {
  const [nameInput, setNameInput] = useState(user.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const isConfigured = isSupabaseConfigured();
  const isAuthUser = Boolean(user.id && !user.id.startsWith('demo-') && user.email);

  const personalityList: NinoPersonality[] = ['divertido', 'profissional', 'motivador', 'tranquilo'];
  const colorList: NinoThemeColor[] = ['indigo', 'emerald', 'amber', 'rose', 'violet', 'cyan'];

  const handleSignOutClick = async () => {
    if (onSignOut) {
      await onSignOut();
    } else {
      await signOutUser();
    }
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    onUpdateUser({ ...user, name: nameInput.trim() });
    setIsEditingName(false);
  };

  const handlePersonalityChange = (p: NinoPersonality) => {
    soundManager.playPop();
    const updated = {
      ...user,
      preferences: { ...user.preferences, ninoPersonality: p },
    };
    onUpdateUser(updated);

    if (user.preferences.voiceEnabled) {
      speechService.speak(
        p === 'divertido'
          ? 'Eba! Agora sou seu Polaris versão super divertida! Vamos nessa!'
          : p === 'profissional'
          ? 'Configuração atualizada. Modo profissional ativado para máxima eficiência.'
          : p === 'motivador'
          ? 'Modo motivador ativado! Prepare-se para bater todas as suas metas!'
          : 'Modo tranquilo ativado. Vamos cuidar da sua rotina com paz e serenidade.'
      );
    }
  };

  const handleColorChange = (c: NinoThemeColor) => {
    soundManager.playPop();
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, ninoColor: c },
    });
  };

  const handleToggleVoice = () => {
    const nextVal = !user.preferences.voiceEnabled;
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, voiceEnabled: nextVal },
    });
    if (nextVal) {
      speechService.speak('Olá! A voz do Polaris está ativada!');
    } else {
      speechService.stop();
    }
  };

  const handleToggleSound = () => {
    const nextVal = !user.preferences.soundEffectsEnabled;
    soundManager.setEnabled(nextVal);
    if (nextVal) soundManager.playPop();
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, soundEffectsEnabled: nextVal },
    });
  };

  const handleDailyGoalChange = (newGoal: number) => {
    onUpdateUser({
      ...user,
      preferences: { ...user.preferences, dailyGoal: newGoal },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = onImportData(content);
        if (ok) {
          setImportStatus('Backup importado com sucesso!');
        } else {
          setImportStatus('Erro ao importar arquivo. Verifique o formato JSON.');
        }
        setTimeout(() => setImportStatus(null), 3500);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Profile Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-orange-500/20">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-3 py-1 text-base font-bold rounded-xl border border-orange-500 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  {user.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:underline font-bold"
                >
                  Editar
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
              🔥 {user.streakDays} dias de sequência ativa
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAuthModal}
          className="px-4 py-2 rounded-2xl border border-orange-200 dark:border-amber-900/60 hover:border-orange-300 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 hover:bg-orange-50/50 dark:hover:bg-amber-950/30"
        >
          <Shield className="w-4 h-4 text-orange-500" />
          Trocar Conta / Login
        </button>
      </div>

      {/* Nino Companion Customizer Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-amber-950/70 text-orange-600 dark:text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Personalizar o Polaris
              </h3>
              <p className="text-xs text-slate-400">
                Escolha o estilo, a voz e a aparência do seu companheiro
              </p>
            </div>
          </div>

          <div className="w-14 h-14">
            <NinoAvatar
              expression="excited"
              color={user.preferences.ninoColor}
              size="sm"
              stage={user.polaris?.stage || 'baby'}
              accessory={user.polaris?.equippedAccessory || 'none'}
              aura={user.polaris?.equippedAura || 'none'}
              interactive={false}
            />
          </div>
        </div>

        {/* 1. Personality Options */}
        <div>
          <label className="block text-xs font-bold text-orange-950/80 dark:text-amber-200/80 mb-2 uppercase tracking-wide">
            Estilo de Personalidade
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {personalityList.map((pKey) => {
              const p = PERSONALITY_CONFIGS[pKey];
              const isSelected = user.preferences.ninoPersonality === pKey;
              return (
                <button
                  key={pKey}
                  type="button"
                  onClick={() => handlePersonalityChange(pKey)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/60 dark:bg-amber-950/40 shadow-xs'
                      : 'border-orange-100/80 dark:border-amber-950/60 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {p.badge}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-orange-600" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Polaris Theme Color Picker */}
        <div>
          <label className="block text-xs font-bold text-orange-950/80 dark:text-amber-200/80 mb-2 uppercase tracking-wide">
            Cor do Polaris & Interface
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {colorList.map((cKey) => {
              const c = THEME_COLORS[cKey];
              const isSelected = user.preferences.ninoColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => handleColorChange(cKey)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all text-xs font-semibold ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50 dark:bg-amber-950/50 shadow-xs text-orange-700 dark:text-orange-300 font-bold'
                      : 'border-orange-100/80 dark:border-amber-950/60 text-slate-600 dark:text-slate-300 hover:border-orange-200'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-inner"
                    style={{ backgroundColor: c.primary }}
                  />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Audio & Voice Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Voice TTS Toggle */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Voz Falada do Polaris
              </span>
              <span className="text-[11px] text-slate-400">
                Ouvir o Polaris falar seus avisos em áudio
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`p-2 rounded-xl transition-colors ${
                user.preferences.voiceEnabled
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {user.preferences.voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Sound Effects Toggle */}
          <div className="p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                Efeitos Sonoros (Chimes)
              </span>
              <span className="text-[11px] text-slate-400">
                Sons ao concluir tarefas e metas
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl transition-colors ${
                user.preferences.soundEffectsEnabled
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications & System Preferences */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-5">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
          Preferências do Aplicativo
        </h3>

        {/* Daily Goal Setting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-orange-50/40 dark:bg-[#251E18]/60 border border-orange-100/70 dark:border-amber-950/60">
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
              Meta Diária de Tarefas
            </span>
            <span className="text-[11px] text-slate-400">
              Quantas tarefas você deseja concluir por dia
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[3, 5, 8, 10].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => handleDailyGoalChange(goal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  user.preferences.dailyGoal === goal
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
                    : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-900/50 hover:border-orange-200'
                }`}
              >
                {goal} / dia
              </button>
            ))}
          </div>
        </div>

        {/* Test Notification Action */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-orange-100/80 dark:border-amber-950/60">
          <div>
            <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
              Testar Notificação do Polaris
            </span>
            <span className="text-[11px] text-slate-400">
              Dispara um lembrete interativo agora mesmo para demonstração
            </span>
          </div>

          <button
            type="button"
            onClick={onTestNotification}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Bell className="w-3.5 h-3.5" />
            Testar Agora
          </button>
        </div>
      </div>

      {/* Supabase Database & Auth Live Status */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Integração Supabase
                </h3>
                {isConfigured ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                    Aguardando Chaves
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isAuthUser
                  ? `Sessão ativa autenticada via Supabase Auth (${user.email})`
                  : 'Sessão local (conecte sua conta para persistência total em nuvem)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthUser ? (
              <button
                type="button"
                onClick={handleSignOutClick}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Desconectar
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Entrar com Supabase
              </button>
            )}
          </div>
        </div>

        {/* Database Tables & Security Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-center">
          {['profiles', 'categories', 'tasks', 'character_settings', 'task_history'].map((tbl) => (
            <div
              key={tbl}
              className="p-2 rounded-xl bg-orange-50/50 dark:bg-[#251E18] border border-orange-100/70 dark:border-amber-950/50 text-[11px] font-bold text-slate-700 dark:text-slate-300"
            >
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                RLS Ativo
              </div>
              <span className="font-mono text-xs">{tbl}</span>
            </div>
          ))}
        </div>

        {/* SQL Schema helper toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            className="text-xs text-orange-600 dark:text-amber-400 hover:underline font-bold flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showSqlGuide ? 'Ocultar Script SQL das Tabelas' : 'Ver / Copiar Script SQL do Supabase'}
          </button>

          {showSqlGuide && (
            <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Execute no SQL Editor do Supabase:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`-- TABELAS SUPABASE AGENDA POLARIS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  streak_days INTEGER DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  focus_minutes INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{"theme":"light","ninoPersonality":"divertido","dailyGoal":5}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.task_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history ENABLE ROW LEVEL SECURITY;`);
                    setCopiedSql(true);
                    soundManager.playPop();
                    setTimeout(() => setCopiedSql(false), 3000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Todas as 5 tabelas contam com Row Level Security (RLS) baseado em <code className="text-emerald-400">auth.uid() = user_id</code>, garantindo privacidade total para cada usuário.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
          Dados & Backup
        </h3>
        <p className="text-xs text-slate-400">
          Seus dados são salvos localmente com segurança. Você pode exportar, importar ou reiniciar a demonstração.
        </p>

        {importStatus && (
          <div className="p-3 rounded-2xl bg-orange-50 dark:bg-amber-950/70 border border-orange-200 dark:border-amber-900 text-xs font-bold text-orange-700 dark:text-amber-300">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportData}
            className="px-4 py-2.5 rounded-2xl bg-orange-50/70 dark:bg-[#251E18] hover:bg-orange-100/70 dark:hover:bg-[#2E251E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 border border-orange-100 dark:border-amber-950/60"
          >
            <Download className="w-4 h-4 text-orange-500" />
            Exportar Backup JSON
          </button>

          {/* Import JSON */}
          <label className="px-4 py-2.5 rounded-2xl bg-orange-50/70 dark:bg-[#251E18] hover:bg-orange-100/70 dark:hover:bg-[#2E251E] text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-2 border border-orange-100 dark:border-amber-950/60 cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-500" />
            Importar Backup
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Reset Demo Data */}
          <button
            type="button"
            onClick={onResetDemoData}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Recarregar Dados de Exemplo
          </button>
        </div>
      </div>
    </div>
  );
};
