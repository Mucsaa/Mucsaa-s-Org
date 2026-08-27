import {
  PolarisStage,
  PolarisEvolution,
  PolarisAccessory,
  PolarisAura,
  DailyMission,
  LevelUpEvent,
  UserProfile,
  Task,
} from '../types';
import { getTodayString } from './dateUtils';

// XP Thresholds for levels (Level 1 to Level 30+)
export const LEVEL_THRESHOLDS = [
  0,     // Level 1 (0 XP)
  120,   // Level 2 (120 XP)
  280,   // Level 3 (280 XP) -> Evolve to Young at Lv 4
  500,   // Level 4 (500 XP)
  800,   // Level 5 (800 XP)
  1200,  // Level 6 (1200 XP)
  1700,  // Level 7 (1700 XP)
  2300,  // Level 8 (2300 XP) -> Evolve to Guardian at Lv 9
  3000,  // Level 9 (3000 XP)
  3800,  // Level 10 (3800 XP)
  4700,  // Level 11 (4700 XP)
  5700,  // Level 12 (5700 XP)
  6800,  // Level 13 (6800 XP)
  8000,  // Level 14 (8000 XP)
  9300,  // Level 15 (9300 XP)
  10700, // Level 16 (10700 XP) -> Evolve to Master at Lv 17
  12200, // Level 17 (12200 XP)
  13800, // Level 18 (13800 XP)
  15500, // Level 19 (15500 XP)
  17500, // Level 20 (17500 XP)
  20000, // Level 21+
];

export function getStageForLevel(level: number): PolarisStage {
  if (level <= 3) return 'baby';
  if (level <= 8) return 'young';
  if (level <= 16) return 'guardian';
  return 'master';
}

export function getLevelProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInCurrentLevel: number;
  xpNeededForNext: number;
  percent: number;
  stage: PolarisStage;
} {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 2500;
  const xpInCurrentLevel = Math.max(0, xp - currentLevelXp);
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelXp);
  const percent = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNext) * 100));
  const stage = getStageForLevel(level);

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    xpInCurrentLevel,
    xpNeededForNext,
    percent,
    stage,
  };
}

export const STAGE_CONFIGS: Record<
  PolarisStage,
  {
    name: string;
    badge: string;
    description: string;
    ageRange: string;
    perk: string;
    minLevel: number;
    dialogueGreeting: string;
    bannerColor: string;
  }
> = {
  baby: {
    name: 'Bebê Estelar',
    badge: '🐣 Bebê Estelar',
    description: 'Um orbe cósmico recém-nascido, curioso e carinhoso. Aprende sua rotina com entusiasmo!',
    ageRange: '1 a 6 dias cósmicos',
    perk: 'Bônus de Afeto (+15% afinidade diária)',
    minLevel: 1,
    dialogueGreeting: 'Piu! Estou crescendo com suas tarefas! Vamos focar juntinhos hoje? ✨',
    bannerColor: 'from-amber-400 to-orange-400',
  },
  young: {
    name: 'Jovem Astral',
    badge: '⚡ Jovem Astral',
    description: 'Ágil, antenado e cheio de energia! Ganha antenas de pulsar cósmico e velocidade de foco.',
    ageRange: '7 a 19 dias cósmicos',
    perk: 'Bônus de Cristais (+10% Stardust por tarefa)',
    minLevel: 4,
    dialogueGreeting: 'Energia máxima! Minhas antenas astrais estão captando alta produtividade! 🚀',
    bannerColor: 'from-sky-400 to-indigo-500',
  },
  guardian: {
    name: 'Guardião Cósmico',
    badge: '🛡️ Guardião Cósmico',
    description: 'Protetor veterano do tempo! Bloqueia procrastinação com capa estelar e asas de luz.',
    ageRange: '20 a 49 dias cósmicos',
    perk: 'Escudo Anti-Distração (+25% XP no Modo Foco)',
    minLevel: 9,
    dialogueGreeting: 'Sob minha guarda estelar, nenhuma meta sua ficará para trás! Concentração total! 🌌',
    bannerColor: 'from-violet-500 to-purple-600',
  },
  master: {
    name: 'Mestre Celestial',
    badge: '👑 Mestre Celestial',
    description: 'Forma suprema transcendental! Aura divina de constelações e sabedoria infinita do foco.',
    ageRange: '50+ dias cósmicos',
    perk: 'Aura de Maestria (+30% Cristais e XP em todas as ações)',
    minLevel: 17,
    dialogueGreeting: 'Sua consistência atingiu as estrelas mais altas! Você e eu somos imparáveis! 👑✨',
    bannerColor: 'from-amber-400 via-rose-500 to-violet-600',
  },
};

// Accessories Catalog
export const POLARIS_ACCESSORIES: PolarisAccessory[] = [
  {
    id: 'none',
    name: 'Natural',
    description: 'Visual puro original do Polaris.',
    icon: '✨',
    minLevel: 1,
    stardustCost: 0,
    rarity: 'common',
  },
  {
    id: 'star_pin',
    name: 'Broche Estrela Cadente',
    description: 'Um pequeno pingente cintilante que irradia boas vibrações.',
    icon: '⭐',
    minLevel: 1,
    stardustCost: 0,
    rarity: 'common',
  },
  {
    id: 'cool_glasses',
    name: 'Óculos de Hiperfoco',
    description: 'Estilosos óculos escuros que filtram qualquer distração.',
    icon: '🕶️',
    minLevel: 2,
    stardustCost: 50,
    rarity: 'common',
  },
  {
    id: 'wizard_hat',
    name: 'Chapéu do Mago do Tempo',
    description: 'Encantado com magias ancestrais de pontualidade.',
    icon: '🧙‍♂️',
    minLevel: 4,
    stardustCost: 100,
    rarity: 'rare',
  },
  {
    id: 'gamer_headset',
    name: 'Headset Gamer Cósmico',
    description: 'Toca frequências binaurais para concentração extrema.',
    icon: '🎧',
    minLevel: 6,
    stardustCost: 160,
    rarity: 'rare',
  },
  {
    id: 'angel_halo',
    name: 'Auréola da Disciplina',
    description: 'Brilha intensamente quando você completa seus compromissos.',
    icon: '😇',
    minLevel: 9,
    stardustCost: 240,
    rarity: 'epic',
  },
  {
    id: 'ninja_band',
    name: 'Faixa Ninja Silenciosa',
    description: 'Treinado nas artes da agilidade e tarefas concluídas com precisão.',
    icon: '🥷',
    minLevel: 12,
    stardustCost: 320,
    rarity: 'epic',
  },
  {
    id: 'cosmic_crown',
    name: 'Coroa Imperial de Supernova',
    description: 'A coroa digna de quem domina completamente sua própria agenda.',
    icon: '👑',
    minLevel: 15,
    stardustCost: 500,
    rarity: 'legendary',
  },
];

// Auras Catalog
export const POLARIS_AURAS: PolarisAura[] = [
  {
    id: 'none',
    name: 'Sem Aura',
    description: 'Sem efeito de brilho adicional.',
    icon: '✨',
    minLevel: 1,
    stardustCost: 0,
    rarity: 'common',
    glowColor: 'transparent',
  },
  {
    id: 'sparkles',
    name: 'Poeira Estelar',
    description: 'Partículas douradas cintilantes que flutuam ao redor.',
    icon: '🌟',
    minLevel: 1,
    stardustCost: 0,
    rarity: 'common',
    glowColor: '#F59E0B',
  },
  {
    id: 'solar_flame',
    name: 'Chama Solar',
    description: 'Fogo energético que queima com determinação e paixão.',
    icon: '🔥',
    minLevel: 3,
    stardustCost: 80,
    rarity: 'rare',
    glowColor: '#EF4444',
  },
  {
    id: 'galaxy_mist',
    name: 'Nebulosa Mística',
    description: 'Nuvem cósmica de tons roxos e azuis profundos.',
    icon: '🌌',
    minLevel: 7,
    stardustCost: 180,
    rarity: 'rare',
    glowColor: '#8B5CF6',
  },
  {
    id: 'lightning',
    name: 'Relâmpagos de Produtividade',
    description: 'Centelhas elétricas para mentes rápidas e atentas.',
    icon: '⚡',
    minLevel: 11,
    stardustCost: 300,
    rarity: 'epic',
    glowColor: '#06B6D4',
  },
  {
    id: 'zen_bubbles',
    name: 'Orbes Zen Celestiais',
    description: 'Gotas de harmonia e serenidade para um foco impecável.',
    icon: '🔮',
    minLevel: 14,
    stardustCost: 420,
    rarity: 'legendary',
    glowColor: '#10B981',
  },
];

// Default initial Polaris state (starts completely clean from zero at Level 1)
export const DEFAULT_POLARIS: PolarisEvolution = {
  xp: 0,
  level: 1,
  stardust: 0,
  ageDays: 1,
  stage: 'baby',
  affinity: 0,
  equippedAccessory: 'none',
  equippedAura: 'none',
  unlockedItems: ['none'],
  claimedMissions: [],
  totalCareCount: 0,
  lastFedDate: undefined,
};

// Daily Missions Generation Engine
export function getDailyMissions(tasks: Task[], user: UserProfile): DailyMission[] {
  const today = getTodayString();
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const urgentCompleted = todayTasks.filter((t) => t.completed && (t.priority === 'high' || t.priority === 'urgent')).length;
  const claimedMissions = user.polaris?.claimedMissions || [];

  return [
    {
      id: 'mission_tasks_3',
      title: 'Tríplice Vitória',
      description: 'Conclua 3 tarefas da sua lista hoje.',
      rewardXp: 60,
      rewardStardust: 30,
      target: 3,
      current: completedToday,
      completed: completedToday >= 3,
      claimed: claimedMissions.includes('mission_tasks_3'),
      iconName: 'CheckCircle2',
    },
    {
      id: 'mission_focus_25',
      title: 'Mergulho em Hiperfoco',
      description: 'Acumule ao menos 20 minutos no Modo Foco com Polaris.',
      rewardXp: 80,
      rewardStardust: 45,
      target: 20,
      current: Math.min(user.focusMinutes || 0, 20),
      completed: (user.focusMinutes || 0) >= 20,
      claimed: claimedMissions.includes('mission_focus_25'),
      iconName: 'Zap',
    },
    {
      id: 'mission_urgent_1',
      title: 'Prioridade Absoluta',
      description: 'Finalize ao menos 1 tarefa de Alta Prioridade ou Urgente.',
      rewardXp: 50,
      rewardStardust: 25,
      target: 1,
      current: Math.min(urgentCompleted, 1),
      completed: urgentCompleted >= 1,
      claimed: claimedMissions.includes('mission_urgent_1'),
      iconName: 'Flame',
    },
    {
      id: 'mission_care_polaris',
      title: 'Laço de Afeto',
      description: 'Alimente ou faça um carinho no Polaris hoje.',
      rewardXp: 40,
      rewardStardust: 20,
      target: 1,
      current: user.polaris?.lastFedDate === today ? 1 : 0,
      completed: user.polaris?.lastFedDate === today,
      claimed: claimedMissions.includes('mission_care_polaris'),
      iconName: 'Heart',
    },
  ];
}

// Reward Grant Engine with Level Up detection
export function addPolarisXP(
  user: UserProfile,
  xpGain: number,
  stardustGain: number = 0
): {
  updatedUser: UserProfile;
  levelUpEvent: LevelUpEvent | null;
} {
  const currentPolaris = user.polaris || DEFAULT_POLARIS;
  const oldXp = currentPolaris.xp || 0;
  const newXp = oldXp + xpGain;
  const newStardust = (currentPolaris.stardust || 0) + stardustGain;

  const oldProg = getLevelProgress(oldXp);
  const newProg = getLevelProgress(newXp);

  const didLevelUp = newProg.level > oldProg.level;
  const didEvolve = newProg.stage !== oldProg.stage;

  // New age calculation: Base age + extra days earned through levels & consistency
  const calculatedAge = Math.max(
    currentPolaris.ageDays || 1,
    user.streakDays + Math.floor(newProg.level * 1.5)
  );

  let levelUpEvent: LevelUpEvent | null = null;

  const newlyUnlocked: string[] = [];
  if (didLevelUp) {
    // Check if new items became unlockable
    POLARIS_ACCESSORIES.forEach((acc) => {
      if (acc.minLevel <= newProg.level && !currentPolaris.unlockedItems.includes(acc.id) && acc.stardustCost === 0) {
        newlyUnlocked.push(acc.id);
      }
    });

    const levelBonusStardust = newProg.level * 30 + (didEvolve ? 100 : 0);

    levelUpEvent = {
      oldLevel: oldProg.level,
      newLevel: newProg.level,
      oldStage: oldProg.stage,
      newStage: newProg.stage,
      rewardStardust: levelBonusStardust,
      unlockedItems: newlyUnlocked,
      evolved: didEvolve,
    };
  }

  const updatedUnlocked = Array.from(new Set([...(currentPolaris.unlockedItems || []), ...newlyUnlocked]));

  const updatedPolaris: PolarisEvolution = {
    ...currentPolaris,
    xp: newXp,
    level: newProg.level,
    stage: newProg.stage,
    stardust: newStardust + (levelUpEvent ? levelUpEvent.rewardStardust : 0),
    ageDays: calculatedAge,
    affinity: Math.min(100, (currentPolaris.affinity || 50) + 2),
    unlockedItems: updatedUnlocked,
  };

  const updatedUser: UserProfile = {
    ...user,
    polaris: updatedPolaris,
  };

  return {
    updatedUser,
    levelUpEvent,
  };
}

/**
 * Updates daily missions upon a task completion event
 */
export function updateDailyMissionsOnTaskComplete(
  missions: DailyMission[],
  completedTask: Task,
  allTasks: Task[]
): DailyMission[] {
  const today = getTodayString();
  const completedToday = allTasks.filter((t) => t.date === today && t.completed).length;
  const urgentCompletedToday = allTasks.filter(
    (t) => t.date === today && t.completed && (t.priority === 'urgent' || t.priority === 'high')
  ).length;

  return missions.map((m) => {
    if (m.id === 'mission_tasks_1') {
      const current = Math.min(completedToday, m.target);
      return {
        ...m,
        current,
        completed: current >= m.target,
      };
    }
    if (m.id === 'mission_tasks_3') {
      const current = Math.min(completedToday, m.target);
      return {
        ...m,
        current,
        completed: current >= m.target,
      };
    }
    if (m.id === 'mission_urgent_1') {
      const current = Math.min(urgentCompletedToday, m.target);
      return {
        ...m,
        current,
        completed: current >= m.target,
      };
    }
    return m;
  });
}

/**
 * Claim reward for a completed daily mission
 */
export function claimMissionReward(
  user: UserProfile,
  tasks: Task[],
  missionId: string
): {
  updatedUser: UserProfile;
  levelUpEvent: LevelUpEvent | null;
} {
  const currentPolaris = user.polaris || DEFAULT_POLARIS;
  const missions = getDailyMissions(tasks, user);
  const targetMission = missions.find((m) => m.id === missionId);

  if (!targetMission || !targetMission.completed || targetMission.claimed) {
    return { updatedUser: user, levelUpEvent: null };
  }

  const updatedClaimedList = Array.from(
    new Set([...(currentPolaris.claimedMissions || []), missionId])
  );

  const userWithClaimedMissions: UserProfile = {
    ...user,
    polaris: {
      ...currentPolaris,
      claimedMissions: updatedClaimedList,
    },
  };

  return addPolarisXP(
    userWithClaimedMissions,
    targetMission.rewardXp,
    targetMission.rewardStardust
  );
}

/**
 * Perform a caring interaction with Polaris (Feed, Pet, Play, Rest)
 */
export function performCareAction(
  user: UserProfile,
  actionType: 'feed' | 'pet' | 'play' | 'rest'
): {
  updatedUser: UserProfile;
  levelUpEvent: LevelUpEvent | null;
} {
  const currentPolaris = user.polaris || DEFAULT_POLARIS;
  const today = getTodayString();

  let xpGain = 15;
  let stardustGain = 5;
  let affinityGain = 5;

  if (actionType === 'feed') {
    xpGain = 20;
    stardustGain = 10;
    affinityGain = 8;
  } else if (actionType === 'play') {
    xpGain = 25;
    stardustGain = 8;
    affinityGain = 10;
  } else if (actionType === 'pet') {
    xpGain = 15;
    stardustGain = 5;
    affinityGain = 6;
  } else if (actionType === 'rest') {
    xpGain = 15;
    stardustGain = 5;
    affinityGain = 5;
  }

  const updatedPolaris: PolarisEvolution = {
    ...currentPolaris,
    lastFedDate: actionType === 'feed' ? today : currentPolaris.lastFedDate,
    totalCareCount: (currentPolaris.totalCareCount || 0) + 1,
    affinity: Math.min(100, (currentPolaris.affinity || 50) + affinityGain),
  };

  const userWithCare: UserProfile = {
    ...user,
    polaris: updatedPolaris,
  };

  return addPolarisXP(userWithCare, xpGain, stardustGain);
}
