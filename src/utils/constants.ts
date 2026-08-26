import { CategoryConfig, NinoPersonality, NinoThemeColor, TaskCategory } from '../types';

export const CATEGORIES: Record<TaskCategory, CategoryConfig> = {
  work: {
    id: 'work',
    name: 'Trabalho',
    icon: 'Briefcase',
    color: '#2563EB', // Vibrant Royal Blue
    bgLight: 'bg-blue-50',
    bgDark: 'dark:bg-blue-950/40',
    textLight: 'text-blue-700 dark:text-blue-300',
    borderLight: 'border-blue-200 dark:border-blue-800',
  },
  study: {
    id: 'study',
    name: 'Estudos',
    icon: 'GraduationCap',
    color: '#8B5CF6', // Radiant Violet
    bgLight: 'bg-purple-50',
    bgDark: 'dark:bg-purple-950/40',
    textLight: 'text-purple-700 dark:text-purple-300',
    borderLight: 'border-purple-200 dark:border-purple-800',
  },
  health: {
    id: 'health',
    name: 'Saúde',
    icon: 'HeartPulse',
    color: '#F43F5E', // Vibrant Rose Pink
    bgLight: 'bg-rose-50',
    bgDark: 'dark:bg-rose-950/40',
    textLight: 'text-rose-700 dark:text-rose-300',
    borderLight: 'border-rose-200 dark:border-rose-800',
  },
  home: {
    id: 'home',
    name: 'Casa',
    icon: 'Home',
    color: '#FF7A00', // Vibrant Warm Amber / Orange
    bgLight: 'bg-orange-50',
    bgDark: 'dark:bg-orange-950/40',
    textLight: 'text-orange-700 dark:text-orange-300',
    borderLight: 'border-orange-200 dark:border-orange-800',
  },
  shopping: {
    id: 'shopping',
    name: 'Compras',
    icon: 'ShoppingCart',
    color: '#10B981', // Radiant Mint Emerald
    bgLight: 'bg-emerald-50',
    bgDark: 'dark:bg-emerald-950/40',
    textLight: 'text-emerald-700 dark:text-emerald-300',
    borderLight: 'border-emerald-200 dark:border-emerald-800',
  },
  exercise: {
    id: 'exercise',
    name: 'Exercícios',
    icon: 'Dumbbell',
    color: '#EF4444', // Energetic Scarlet
    bgLight: 'bg-red-50',
    bgDark: 'dark:bg-red-950/40',
    textLight: 'text-red-700 dark:text-red-300',
    borderLight: 'border-red-200 dark:border-red-800',
  },
  personal: {
    id: 'personal',
    name: 'Pessoal',
    icon: 'User',
    color: '#6366F1', // Electric Indigo
    bgLight: 'bg-indigo-50',
    bgDark: 'dark:bg-indigo-950/40',
    textLight: 'text-indigo-700 dark:text-indigo-300',
    borderLight: 'border-indigo-200 dark:border-indigo-800',
  },
  other: {
    id: 'other',
    name: 'Outros',
    icon: 'Bookmark',
    color: '#64748B', // Slate
    bgLight: 'bg-slate-100',
    bgDark: 'dark:bg-slate-800/50',
    textLight: 'text-slate-700 dark:text-slate-300',
    borderLight: 'border-slate-200 dark:border-slate-700',
  },
};

export const PERSONALITY_CONFIGS: Record<NinoPersonality, {
  name: string;
  description: string;
  badge: string;
  tone: string;
}> = {
  divertido: {
    name: 'Divertido & Animado',
    description: 'Espontâneo, cheio de energia, piadinhas e incentivos bem humorados.',
    badge: '⚡ Divertido',
    tone: 'casual e animado',
  },
  profissional: {
    name: 'Profissional & Focado',
    description: 'Direto, cortês, organizado e com foco total em produtividade.',
    badge: '💼 Profissional',
    tone: 'executivo e polido',
  },
  motivador: {
    name: 'Motivador & Treinador',
    description: 'Inspirador, entusiasta das suas vitórias e sempre te empurrando para frente.',
    badge: '🔥 Motivador',
    tone: 'inspirador e enérgico',
  },
  tranquilo: {
    name: 'Tranquilo & Zen',
    description: 'Paz de espírito, lembretes de respiração e ritmo saudável sem estresse.',
    badge: '🌿 Tranquilo',
    tone: 'sereno e calmo',
  },
};

export const THEME_COLORS: Record<NinoThemeColor, {
  name: string;
  primary: string;
  glow: string;
  gradient: string;
  badgeBg: string;
}> = {
  amber: {
    name: 'Laranja Solar',
    primary: '#FF6B35',
    glow: 'rgba(255, 107, 53, 0.45)',
    gradient: 'from-orange-500 via-amber-500 to-yellow-400',
    badgeBg: 'bg-orange-500',
  },
  indigo: {
    name: 'Azul Cósmico',
    primary: '#4F46E5',
    glow: 'rgba(79, 70, 229, 0.4)',
    gradient: 'from-indigo-500 to-sky-400',
    badgeBg: 'bg-indigo-500',
  },
  emerald: {
    name: 'Verde Menta',
    primary: '#059669',
    glow: 'rgba(5, 150, 105, 0.4)',
    gradient: 'from-emerald-500 to-teal-400',
    badgeBg: 'bg-emerald-500',
  },
  rose: {
    name: 'Rosa Aurora',
    primary: '#E11D48',
    glow: 'rgba(225, 29, 72, 0.4)',
    gradient: 'from-rose-500 to-pink-400',
    badgeBg: 'bg-rose-500',
  },
  violet: {
    name: 'Roxo Místico',
    primary: '#7C3AED',
    glow: 'rgba(124, 58, 237, 0.4)',
    gradient: 'from-violet-500 to-fuchsia-400',
    badgeBg: 'bg-violet-500',
  },
  cyan: {
    name: 'Ciano Elétrico',
    primary: '#0891B2',
    glow: 'rgba(8, 145, 178, 0.4)',
    gradient: 'from-cyan-500 to-blue-400',
    badgeBg: 'bg-cyan-500',
  },
};
