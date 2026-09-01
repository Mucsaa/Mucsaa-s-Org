import { NinoExpression, NinoThemeColor } from '../types';

export interface PolarisStarColorState {
  id: string;
  name: string;
  badgeText: string;
  reason: string;
  primary: string;
  secondary: string;
  coreHighlight: string;
  accent: string;
  glow: string;
  auraBg: string;
  eyeColor: string;
  sparkColor: string;
  cheeksColor: string;
}

interface ComputeColorProps {
  expression?: NinoExpression | string;
  completedTasksCount?: number;
  totalTasksCount?: number;
  completionPercent?: number;
  preferredColor?: NinoThemeColor | string;
  isNight?: boolean;
}

export function computePolarisStarColor(props: ComputeColorProps): PolarisStarColorState {
  const {
    expression = 'happy',
    completedTasksCount = 0,
    totalTasksCount = 0,
    completionPercent: explicitPercent,
    preferredColor = 'amber',
    isNight = false,
  } = props;

  const percent =
    typeof explicitPercent === 'number'
      ? explicitPercent
      : totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  // 1. All Tasks Completed / Cosmic Supernova (100% Victory)
  if ((totalTasksCount > 0 && completedTasksCount >= totalTasksCount) || expression === 'celebrating') {
    return {
      id: 'supernova_gold',
      name: 'Ouro Supernova Celestial',
      badgeText: '✨ Supernova 100% Concluído',
      reason: 'Todas as tarefas do dia cumpridas com maestria!',
      primary: '#FFB800',
      secondary: '#FF7A00',
      coreHighlight: '#FFFBEB',
      accent: '#FDE047',
      glow: 'rgba(255, 184, 0, 0.65)',
      auraBg: 'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, rgba(245, 158, 11, 0.4) 60%, transparent 100%)',
      eyeColor: '#1E1B4B',
      sparkColor: '#FEF08A',
      cheeksColor: '#FB7185',
    };
  }

  // 2. High Completion (60% - 99%) or Excited Mood
  if (percent >= 60 || expression === 'excited') {
    return {
      id: 'radiant_amber',
      name: 'Âmbar Solar Radiante',
      badgeText: '🔥 Radiante & Empolgado',
      reason: 'Ritmo acelerado e alta produtividade!',
      primary: '#F59E0B',
      secondary: '#EA580C',
      coreHighlight: '#FEF3C7',
      accent: '#FBBF24',
      glow: 'rgba(245, 158, 11, 0.5)',
      auraBg: 'radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, rgba(234, 88, 12, 0.3) 65%, transparent 100%)',
      eyeColor: '#1E293B',
      sparkColor: '#FDE68A',
      cheeksColor: '#FDA4AF',
    };
  }

  // 3. Sleepy Night State
  if (expression === 'sleepy' || (isNight && totalTasksCount > 0 && completedTasksCount === totalTasksCount)) {
    return {
      id: 'lunar_indigo',
      name: 'Periwinkle Noturno Lunar',
      badgeText: '🌙 Descanso Sereno',
      reason: 'Hora de recarregar a luz estelar para amanhã.',
      primary: '#6366F1',
      secondary: '#4338CA',
      coreHighlight: '#EEF2FF',
      accent: '#818CF8',
      glow: 'rgba(99, 102, 241, 0.45)',
      auraBg: 'radial-gradient(circle, rgba(129, 140, 248, 0.6) 0%, rgba(67, 56, 202, 0.25) 70%, transparent 100%)',
      eyeColor: '#0F172A',
      sparkColor: '#C7D2FE',
      cheeksColor: '#E0E7FF',
    };
  }

  // 4. Thinking / Deep Focus
  if (expression === 'thinking') {
    return {
      id: 'cosmic_violet',
      name: 'Ametista & Violeta Focado',
      badgeText: '🧠 Foco & Reflexão',
      reason: 'Canalizando sabedoria e planejamento.',
      primary: '#8B5CF6',
      secondary: '#6D28D9',
      coreHighlight: '#F5F3FF',
      accent: '#C084FC',
      glow: 'rgba(139, 92, 246, 0.5)',
      auraBg: 'radial-gradient(circle, rgba(192, 132, 252, 0.65) 0%, rgba(109, 40, 217, 0.3) 70%, transparent 100%)',
      eyeColor: '#1E1B4B',
      sparkColor: '#E9D5FF',
      cheeksColor: '#F472B6',
    };
  }

  // 5. Concerned / Impending Deadlines
  if (expression === 'concerned') {
    return {
      id: 'sunset_rose',
      name: 'Aurora Rosa & Coral de Alerta',
      badgeText: '⚠️ Atenção & Cuidado',
      reason: 'Tarefas urgentes precisando de carinho e ação!',
      primary: '#F43F5E',
      secondary: '#BE123C',
      coreHighlight: '#FFF1F2',
      accent: '#FB7185',
      glow: 'rgba(244, 63, 94, 0.45)',
      auraBg: 'radial-gradient(circle, rgba(251, 113, 133, 0.6) 0%, rgba(190, 18, 60, 0.25) 70%, transparent 100%)',
      eyeColor: '#1E293B',
      sparkColor: '#FECDD3',
      cheeksColor: '#FDA4AF',
    };
  }

  // 6. Active Progress (25% - 59%) or Proud
  if (percent >= 25 || expression === 'proud') {
    return {
      id: 'mint_emerald',
      name: 'Esmeralda & Menta Produtiva',
      badgeText: '🌱 Progresso Ativo',
      reason: 'Passo a passo no caminho das metas!',
      primary: '#10B981',
      secondary: '#047857',
      coreHighlight: '#ECFDF5',
      accent: '#34D399',
      glow: 'rgba(16, 185, 129, 0.45)',
      auraBg: 'radial-gradient(circle, rgba(52, 211, 153, 0.6) 0%, rgba(4, 120, 87, 0.25) 70%, transparent 100%)',
      eyeColor: '#064E3B',
      sparkColor: '#A7F3D0',
      cheeksColor: '#6EE7B7',
    };
  }

  // 7. Neutral / Baseline Star Theme based on preference
  switch (preferredColor) {
    case 'indigo':
      return {
        id: 'indigo_cosmic',
        name: 'Índigo Cósmico',
        badgeText: '🌌 Índigo Cósmico',
        reason: 'Profundidade sideral e harmonia focada.',
        primary: '#4F46E5',
        secondary: '#312E81',
        coreHighlight: '#EEF2FF',
        accent: '#818CF8',
        glow: 'rgba(79, 70, 229, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(129, 140, 248, 0.7) 0%, rgba(49, 46, 129, 0.3) 70%, transparent 100%)',
        eyeColor: '#1E1B4B',
        sparkColor: '#C7D2FE',
        cheeksColor: '#FDA4AF',
      };
    case 'orange':
      return {
        id: 'solar_orange',
        name: 'Laranja Solar',
        badgeText: '☀️ Laranja Solar',
        reason: 'Energia cintilante e calor motivador.',
        primary: '#F97316',
        secondary: '#C2410C',
        coreHighlight: '#FFF7ED',
        accent: '#FB923C',
        glow: 'rgba(249, 115, 22, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(251, 146, 60, 0.7) 0%, rgba(194, 65, 12, 0.3) 70%, transparent 100%)',
        eyeColor: '#431407',
        sparkColor: '#FED7AA',
        cheeksColor: '#FDA4AF',
      };
    case 'violet':
      return {
        id: 'cosmic_violet',
        name: 'Violeta Místico',
        badgeText: '💜 Violeta',
        reason: 'Poder astral e intuição elevada.',
        primary: '#8B5CF6',
        secondary: '#5B21B6',
        coreHighlight: '#F5F3FF',
        accent: '#C084FC',
        glow: 'rgba(139, 92, 246, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(192, 132, 252, 0.7) 0%, rgba(91, 33, 182, 0.3) 70%, transparent 100%)',
        eyeColor: '#1E1B4B',
        sparkColor: '#E9D5FF',
        cheeksColor: '#FDA4AF',
      };
    case 'emerald':
      return {
        id: 'emerald_base',
        name: 'Esmeralda Serena',
        badgeText: '💚 Esmeralda',
        reason: 'Crescimento constante e tranquilidade mental.',
        primary: '#10B981',
        secondary: '#047857',
        coreHighlight: '#ECFDF5',
        accent: '#6EE7B7',
        glow: 'rgba(16, 185, 129, 0.5)',
        auraBg: 'radial-gradient(circle, rgba(110, 231, 183, 0.7) 0%, rgba(4, 120, 87, 0.3) 70%, transparent 100%)',
        eyeColor: '#064E3B',
        sparkColor: '#A7F3D0',
        cheeksColor: '#FDA4AF',
      };
    case 'rose':
      return {
        id: 'rose_base',
        name: 'Rosa Cósmico',
        badgeText: '🌸 Rosa Cósmico',
        reason: 'Gentileza, carinho e empatia com sua jornada.',
        primary: '#F43F5E',
        secondary: '#9F1239',
        coreHighlight: '#FFF1F2',
        accent: '#FB7185',
        glow: 'rgba(244, 63, 94, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(251, 113, 133, 0.7) 0%, rgba(159, 18, 57, 0.3) 70%, transparent 100%)',
        eyeColor: '#1E293B',
        sparkColor: '#FECDD3',
        cheeksColor: '#FDA4AF',
      };
    case 'cyan':
      return {
        id: 'cyan_base',
        name: 'Azul Nebulosa',
        badgeText: '💙 Azul Nebulosa',
        reason: 'Claridade mental e serenidade cósmica.',
        primary: '#06B6D4',
        secondary: '#0E7490',
        coreHighlight: '#ECFEFF',
        accent: '#67E8F9',
        glow: 'rgba(6, 182, 212, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(103, 232, 249, 0.7) 0%, rgba(14, 116, 144, 0.3) 70%, transparent 100%)',
        eyeColor: '#164E63',
        sparkColor: '#BAE6FD',
        cheeksColor: '#FDA4AF',
      };
    case 'red':
      return {
        id: 'red_stellar',
        name: 'Vermelho Estelar',
        badgeText: '❤️ Vermelho Estelar',
        reason: 'Força imparável de uma supernova em ignição.',
        primary: '#EF4444',
        secondary: '#991B1B',
        coreHighlight: '#FEF2F2',
        accent: '#F87171',
        glow: 'rgba(239, 68, 68, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(248, 113, 113, 0.7) 0%, rgba(153, 27, 27, 0.3) 70%, transparent 100%)',
        eyeColor: '#450A0A',
        sparkColor: '#FECACA',
        cheeksColor: '#FDA4AF',
      };
    case 'silver':
      return {
        id: 'silver_lunar',
        name: 'Prata Lunar',
        badgeText: '🤍 Prata Lunar',
        reason: 'Reflexo puro e nobre da luz prateada das luas.',
        primary: '#94A3B8',
        secondary: '#475569',
        coreHighlight: '#F8FAFC',
        accent: '#CBD5E1',
        glow: 'rgba(203, 213, 225, 0.6)',
        auraBg: 'radial-gradient(circle, rgba(241, 245, 249, 0.8) 0%, rgba(71, 85, 105, 0.3) 70%, transparent 100%)',
        eyeColor: '#0F172A',
        sparkColor: '#E2E8F0',
        cheeksColor: '#FDA4AF',
      };
    case 'rainbow':
      return {
        id: 'rainbow_cosmic',
        name: 'Arco-Íris Cósmico',
        badgeText: '🌈 Arco-Íris Cósmico',
        reason: 'Prisma estelar supremo unindo todos os espectros de luz.',
        primary: '#EC4899',
        secondary: '#8B5CF6',
        coreHighlight: '#FEF08A',
        accent: '#38BDF8',
        glow: 'rgba(236, 72, 153, 0.6)',
        auraBg: 'radial-gradient(circle, rgba(254, 240, 138, 0.6) 0%, rgba(56, 189, 248, 0.4) 40%, rgba(139, 92, 246, 0.3) 75%, transparent 100%)',
        eyeColor: '#1E1B4B',
        sparkColor: '#FDE047',
        cheeksColor: '#FB7185',
      };
    case 'amber':
    default:
      return {
        id: 'starlight_gold',
        name: 'Dourado Solar',
        badgeText: '💛 Dourado Solar',
        reason: 'A luz pura e original que guia sua jornada estelar!',
        primary: '#F59E0B',
        secondary: '#B45309',
        coreHighlight: '#FFFBEB',
        accent: '#FCD34D',
        glow: 'rgba(245, 158, 11, 0.55)',
        auraBg: 'radial-gradient(circle, rgba(252, 211, 77, 0.7) 0%, rgba(180, 83, 9, 0.3) 70%, transparent 100%)',
        eyeColor: '#1E293B',
        sparkColor: '#FEF08A',
        cheeksColor: '#FDA4AF',
      };
  }
}
