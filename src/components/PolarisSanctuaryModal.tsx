import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  Heart,
  Zap,
  Gift,
  CheckCircle2,
  Lock,
  Shirt,
  Flame,
  Shield,
  Crown,
  Palette,
  Smile,
  Moon,
  Compass,
  Award,
  Check,
  Coins,
} from 'lucide-react';
import {
  UserProfile,
  Task,
  PolarisStage,
  NinoExpression,
  NinoThemeColor,
  ItemRarity,
} from '../types';
import {
  getLevelProgress,
  STAGE_CONFIGS,
  POLARIS_COLORS,
  POLARIS_OUTFITS,
  POLARIS_ACCESSORIES,
  POLARIS_AURAS,
  getDailyMissions,
} from '../utils/rewards';
import { NinoAvatar } from './NinoAvatar';
import { computePolarisStarColor } from '../utils/polarisColorEngine';
import { soundManager } from '../utils/sound';
import { speechService } from '../utils/speech';

interface PolarisSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  tasks: Task[];
  onUpdateUser?: (updated: UserProfile) => void;
  onClaimMission?: (missionId: string, rewardXp?: number, rewardStardust?: number) => void;
  onCareAction?: (actionType?: 'feed' | 'pet' | 'play' | 'rest') => void;
  onEquipAccessory?: (id: string) => void;
  onEquipOutfit?: (id: string) => void;
  onEquipAura?: (id: string) => void;
  onEquipColor?: (color: NinoThemeColor) => void;
  onUnlockItem?: (id: string, cost: number, type: 'accessory' | 'outfit' | 'aura' | 'color') => void;
}

type SanctuaryTab = 'colors' | 'outfits' | 'accessories' | 'auras' | 'evolution' | 'missions';

export const PolarisSanctuaryModal: React.FC<PolarisSanctuaryModalProps> = ({
  isOpen,
  onClose,
  user,
  tasks,
  onUpdateUser,
  onClaimMission,
  onCareAction,
  onEquipAccessory,
  onEquipOutfit,
  onEquipAura,
  onEquipColor,
  onUnlockItem,
}) => {
  const [activeTab, setActiveTab] = useState<SanctuaryTab>('colors');
  const [petExpression, setPetExpression] = useState<NinoExpression>('happy');
  const [petMessage, setPetMessage] = useState<string>(
    'Bem-vindo ao meu Santuário Cósmico! Como podemos brilhar juntos hoje?'
  );

  if (!isOpen || !user) return null;

  const polaris = user.polaris || {
    xp: 0,
    level: 1,
    stardust: 0,
    ageDays: 1,
    stage: 'baby' as PolarisStage,
    affinity: 50,
    equippedAccessory: 'none',
    equippedAura: 'none',
    equippedOutfit: 'none',
    equippedColor: user.preferences.ninoColor || 'amber',
    unlockedItems: ['none', 'amber', 'indigo', 'star_pin', 'sparkles', 'scarf_red'],
    claimedMissions: [],
    totalCareCount: 0,
  };

  const progress = getLevelProgress(polaris.xp || 0);
  const currentStageConfig = STAGE_CONFIGS[progress.stage];
  const missions = getDailyMissions(tasks, user);
  const claimableCount = missions.filter((m) => m.completed && !m.claimed).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const activeColor = (user.preferences.ninoColor || polaris.equippedColor || 'amber') as NinoThemeColor;
  const activeOutfit = polaris.equippedOutfit || 'none';
  const activeAccessory = polaris.equippedAccessory || 'none';
  const activeAura = polaris.equippedAura || 'none';
  const unlockedList = polaris.unlockedItems || [];

  const starTheme = computePolarisStarColor({
    expression: petExpression,
    completedTasksCount: completedToday,
    totalTasksCount: totalToday,
    completionPercent,
    preferredColor: activeColor,
  });

  // Pet Care Actions
  const handleCare = (action: 'feed' | 'pet' | 'play' | 'rest') => {
    if (action === 'feed') {
      soundManager.playCelebration();
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
      setPetExpression('celebrating');
      setPetMessage('Nham! Energia cósmica renovada! Foco total nas suas metas de hoje! 🌟⚡');
      if (user.preferences.voiceEnabled) {
        speechService.speak('Obrigado pela energia! Minha estrela está pronta para te guiar nas metas do dia!');
      }
    } else if (action === 'pet') {
      soundManager.playPop();
      setPetExpression('excited');
      setPetMessage('Adorei o carinho! Minha luz estelar está brilhando com força máxima! ✨💖');
    } else if (action === 'play') {
      soundManager.playPop();
      setPetExpression('proud');
      setPetMessage('Brincar juntos aumenta nossa sincronia cósmica! Prontos para vencer o dia! 🚀');
    } else if (action === 'rest') {
      soundManager.playPop();
      setPetExpression('sleepy');
      setPetMessage('Relaxando sob a luz da constelação... mente descansada produz mais! 🌙💤');
    }

    if (onCareAction) {
      onCareAction(action);
    }

    setTimeout(() => {
      setPetExpression('happy');
    }, 3200);
  };

  // 1. STAR COLOR ACTIONS
  const handleEquipStarColor = (colorId: NinoThemeColor) => {
    soundManager.playPop();
    if (onEquipColor) {
      onEquipColor(colorId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        preferences: {
          ...user.preferences,
          ninoColor: colorId,
        },
        polaris: {
          ...polaris,
          equippedColor: colorId,
        },
      });
    }
    setPetExpression('excited');
    setPetMessage(`Minha luz estelar agora brilha com a cor ${colorId.toUpperCase()}! ✨`);
  };

  const handleBuyStarColor = (colorId: NinoThemeColor, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playError();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais ✨! Conclua tarefas para ganhar.`);
      return;
    }

    soundManager.playCelebration();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    if (onUnlockItem) {
      onUnlockItem(colorId, cost, 'color');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...unlockedList, colorId]));
      onUpdateUser({
        ...user,
        preferences: {
          ...user.preferences,
          ninoColor: colorId,
        },
        polaris: {
          ...polaris,
          stardust: Math.max(0, polaris.stardust - cost),
          unlockedItems: updatedUnlocked,
          equippedColor: colorId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage(`Nova cor estelar desbloqueada e equipada com sucesso! 🎨✨`);
  };

  // 2. OUTFIT / SCARF ACTIONS
  const handleEquipStarOutfit = (outfitId: string) => {
    soundManager.playPop();
    if (onEquipOutfit) {
      onEquipOutfit(outfitId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          equippedOutfit: outfitId,
        },
      });
    }
    setPetExpression('proud');
    setPetMessage('Adorei o novo modelito! Ficou elegante e pronto para a produtividade! 🧣');
  };

  const handleBuyStarOutfit = (outfitId: string, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playError();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais ✨!`);
      return;
    }

    soundManager.playCelebration();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    if (onUnlockItem) {
      onUnlockItem(outfitId, cost, 'outfit');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...unlockedList, outfitId]));
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          stardust: Math.max(0, polaris.stardust - cost),
          unlockedItems: updatedUnlocked,
          equippedOutfit: outfitId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage('Nova roupinha cósmica desbloqueada e vestida com sucesso! 👗✨');
  };

  // 3. ACCESSORY ACTIONS
  const handleEquipStarAccessory = (accId: string) => {
    soundManager.playPop();
    if (onEquipAccessory) {
      onEquipAccessory(accId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          equippedAccessory: accId,
        },
      });
    }
    setPetExpression('proud');
    setPetMessage('Acessório cósmico posicionado! Visual estelar no topo! 😎');
  };

  const handleBuyStarAccessory = (accId: string, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playError();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais ✨!`);
      return;
    }

    soundManager.playCelebration();
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

    if (onUnlockItem) {
      onUnlockItem(accId, cost, 'accessory');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...unlockedList, accId]));
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          stardust: Math.max(0, polaris.stardust - cost),
          unlockedItems: updatedUnlocked,
          equippedAccessory: accId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage('Acessório estelar desbloqueado e equipado! 👑✨');
  };

  // 4. AURA ACTIONS
  const handleEquipStarAura = (auraId: string) => {
    soundManager.playPop();
    if (onEquipAura) {
      onEquipAura(auraId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          equippedAura: auraId,
        },
      });
    }
    setPetExpression('excited');
    setPetMessage('Sinta o campo de energia estelar vibrando ao nosso redor! 🌌💫');
  };

  const handleBuyStarAura = (auraId: string, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playError();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais ✨!`);
      return;
    }

    soundManager.playCelebration();
    confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });

    if (onUnlockItem) {
      onUnlockItem(auraId, cost, 'aura');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...unlockedList, auraId]));
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          stardust: Math.max(0, polaris.stardust - cost),
          unlockedItems: updatedUnlocked,
          equippedAura: auraId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage('Aura cósmica ativada com sucesso! 💫');
  };

  const getRarityBadge = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-amber-400 text-slate-900 border-amber-500';
      case 'epic':
        return 'bg-purple-500 text-white border-purple-600';
      case 'rare':
        return 'bg-sky-500 text-white border-sky-600';
      default:
        return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600';
    }
  };

  const getRarityLabel = (rarity: ItemRarity) => {
    switch (rarity) {
      case 'legendary':
        return 'Lendário';
      case 'epic':
        return 'Épico';
      case 'rare':
        return 'Raro';
      default:
        return 'Comum';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
      />

      {/* Main Sanctuary Window */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#151311] rounded-3xl shadow-2xl border border-amber-200/80 dark:border-amber-900/60 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Fechar Santuário"
          className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors z-20 backdrop-blur-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HERO BANNER WITH INTERACTIVE POLARIS */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden shrink-0">
          {/* Subtle Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5">
            {/* Mascot Visual Hub */}
            <div className="flex flex-col items-center shrink-0">
              <div className="p-2.5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 shadow-xl relative group">
                <NinoAvatar
                  expression={petExpression}
                  color={activeColor}
                  size="xl"
                  stage={progress.stage}
                  accessory={activeAccessory}
                  outfit={activeOutfit}
                  aura={activeAura}
                  completedTasksCount={completedToday}
                  totalTasksCount={totalToday}
                  completionPercent={completionPercent}
                  interactive={true}
                  onClick={() => handleCare('pet')}
                />
              </div>

              {/* Quick Care Action Buttons */}
              <div className="grid grid-cols-4 gap-1.5 mt-2.5 w-full">
                <button
                  type="button"
                  onClick={() => handleCare('pet')}
                  title="Fazer Carinho (+15 XP, +5 ✨)"
                  className="px-2 py-1 rounded-xl bg-white/20 hover:bg-white/35 text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-xs border border-white/20"
                >
                  <Heart className="w-3 h-3 fill-rose-300 text-rose-300" />
                  Carinho
                </button>
                <button
                  type="button"
                  onClick={() => handleCare('feed')}
                  title="Alimentar Energia Cósmica (+20 XP, +10 ✨)"
                  className="px-2 py-1 rounded-xl bg-white/20 hover:bg-white/35 text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-xs border border-white/20"
                >
                  <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                  Energia
                </button>
                <button
                  type="button"
                  onClick={() => handleCare('play')}
                  title="Brincar com Polaris (+25 XP, +8 ✨)"
                  className="px-2 py-1 rounded-xl bg-white/20 hover:bg-white/35 text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-xs border border-white/20"
                >
                  <Smile className="w-3 h-3 text-yellow-200" />
                  Brincar
                </button>
                <button
                  type="button"
                  onClick={() => handleCare('rest')}
                  title="Descanso Sereno (+15 XP, +5 ✨)"
                  className="px-2 py-1 rounded-xl bg-white/20 hover:bg-white/35 text-[10px] font-bold transition-all active:scale-95 flex items-center justify-center gap-1 shadow-xs border border-white/20"
                >
                  <Moon className="w-3 h-3 text-indigo-200" />
                  Descanso
                </button>
              </div>
            </div>

            {/* Mascot Metadata & Progress */}
            <div className="flex-1 text-center sm:text-left w-full">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/25 text-xs font-bold uppercase tracking-wider border border-white/20 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {currentStageConfig.badge}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold text-white border border-white/25">
                  <span>{starTheme.badgeText}</span>
                </div>
              </div>

              <h2 className="text-2xl font-black font-['Outfit',sans-serif] tracking-tight">
                Polaris • Nível {progress.level}
              </h2>

              <p className="text-xs text-white/95 font-medium max-w-sm mt-0.5 line-clamp-2">
                "{petMessage}"
              </p>

              {/* Status Badges: Age, Stardust, Affinity */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                <div className="px-3 py-1 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 text-xs font-bold shadow-xs">
                  <span>⏳ Idade: {polaris.ageDays}d</span>
                </div>

                <div className="px-3 py-1 rounded-2xl bg-amber-400 text-slate-950 shadow-md flex items-center gap-1.5 text-xs font-black ring-2 ring-amber-300/80 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{polaris.stardust} Cristais ✨</span>
                </div>

                <div className="px-3 py-1 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 text-xs font-bold shadow-xs">
                  <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                  <span>Harmonia: {polaris.affinity}%</span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-white/90 mb-1">
                  <span>Evolução do Nível {progress.level}</span>
                  <span>{progress.xpInCurrentLevel} / {progress.xpNeededForNext} XP ({progress.percent}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden p-0.5 border border-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white shadow-xs"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SANCTUARY TABS BAR */}
        <div className="flex border-b border-orange-100 dark:border-amber-950/70 bg-orange-50/60 dark:bg-[#12100E] px-3 pt-2 gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('colors')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'colors'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            Cores da Estrela
          </button>

          <button
            onClick={() => setActiveTab('outfits')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'outfits'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Shirt className="w-3.5 h-3.5 text-orange-500" />
            Cachecóis & Roupinhas
          </button>

          <button
            onClick={() => setActiveTab('accessories')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'accessories'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            Acessórios
          </button>

          <button
            onClick={() => setActiveTab('auras')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'auras'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            Auras
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'evolution'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            Evolução
          </button>

          <button
            onClick={() => setActiveTab('missions')}
            className={`px-3 py-2 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'missions'
                ? 'bg-white dark:bg-[#151311] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-900/60 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Gift className="w-3.5 h-3.5 text-rose-500" />
            Missões
            {claimableCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {claimableCount}
              </span>
            )}
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* ══════════════════════════════════════════════════════════
              TAB 1: STAR COLORS (Cores da Estrela)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'colors' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                    Espectro Cósmico de Cores
                  </h3>
                  <p className="text-xs text-slate-400">
                    Desbloqueie novas tonalidades astrais para a sua estrela e personalize todo o aplicativo.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Coins className="w-3.5 h-3.5" /> Saldo: {polaris.stardust} ✨
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_COLORS.map((colorItem) => {
                  const isUnlocked =
                    colorItem.stardustCost === 0 ||
                    unlockedList.includes(colorItem.id) ||
                    progress.level >= colorItem.minLevel && colorItem.stardustCost === 0;
                  const isEquipped = activeColor === colorItem.id;
                  const canAfford = polaris.stardust >= colorItem.stardustCost;
                  const meetsLevel = progress.level >= colorItem.minLevel;

                  return (
                    <div
                      key={colorItem.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-gradient-to-r from-amber-50/90 to-orange-50/90 dark:from-amber-950/40 dark:to-orange-950/40 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Live Color Swatch / Mascot Preview */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-11 h-11 rounded-2xl p-1 flex items-center justify-center shadow-xs border ${
                              isEquipped ? 'border-amber-400' : 'border-slate-200 dark:border-slate-700'
                            }`}
                            style={{ backgroundColor: `${colorItem.previewColor}15` }}
                          >
                            <NinoAvatar
                              expression="happy"
                              color={colorItem.id}
                              size="sm"
                              stage={progress.stage}
                              accessory="none"
                              outfit="none"
                              interactive={false}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-base leading-none">{colorItem.icon}</span>
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              {colorItem.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getRarityBadge(
                                colorItem.rarity
                              )}`}
                            >
                              {getRarityLabel(colorItem.rarity)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {colorItem.description}
                          </p>
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3 text-slate-400" /> Nível Mínimo: {colorItem.minLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Ativa
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipStarColor(colorItem.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-transform active:scale-95"
                          >
                            Equipar
                          </button>
                        ) : canAfford && meetsLevel ? (
                          <button
                            type="button"
                            onClick={() => handleBuyStarColor(colorItem.id, colorItem.stardustCost)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 fill-slate-950 text-slate-950" />
                            {colorItem.stardustCost} ✨
                          </button>
                        ) : (
                          <div className="text-right">
                            <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" /> {colorItem.stardustCost > 0 ? `${colorItem.stardustCost} ✨` : `Nv. ${colorItem.minLevel}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: SCARVES & OUTFITS (Cachecóis & Roupinhas)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'outfits' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                    Guarda-Roupa Cósmico: Cachecóis & Vestimentas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Aqueça e vista o Polaris com capas, quimonos e mantos mágicos.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Coins className="w-3.5 h-3.5" /> {polaris.stardust} ✨
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_OUTFITS.map((outfit) => {
                  const isUnlocked =
                    outfit.id === 'none' ||
                    unlockedList.includes(outfit.id) ||
                    progress.level >= outfit.minLevel && outfit.stardustCost === 0;
                  const isEquipped = activeOutfit === outfit.id;
                  const canAfford = polaris.stardust >= outfit.stardustCost;
                  const meetsLevel = progress.level >= outfit.minLevel;

                  return (
                    <div
                      key={outfit.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-gradient-to-r from-orange-50/90 to-amber-50/90 dark:from-orange-950/40 dark:to-amber-950/40 border-orange-400 dark:border-amber-600 shadow-sm ring-2 ring-orange-400/40'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-2xl bg-orange-100/70 dark:bg-slate-800 border border-orange-200 dark:border-slate-700">
                          {outfit.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              {outfit.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getRarityBadge(
                                outfit.rarity
                              )}`}
                            >
                              {getRarityLabel(outfit.rarity)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {outfit.description}
                          </p>
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3 text-slate-400" /> Nv. {outfit.minLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-black flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Vestido
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipStarOutfit(outfit.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-950 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-transform active:scale-95"
                          >
                            {outfit.id === 'none' ? 'Remover' : 'Vestir'}
                          </button>
                        ) : canAfford && meetsLevel ? (
                          <button
                            type="button"
                            onClick={() => handleBuyStarOutfit(outfit.id, outfit.stardustCost)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-slate-950 text-xs font-black shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 fill-slate-950 text-slate-950" />
                            {outfit.stardustCost} ✨
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {outfit.stardustCost > 0 ? `${outfit.stardustCost} ✨` : `Nv. ${outfit.minLevel}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: ACCESSORIES (Headwear & Face)
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'accessories' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                    Acessórios de Cabeça & Rosto
                  </h3>
                  <p className="text-xs text-slate-400">
                    Óculos, chapéus, headsets e coroas imperiais para o Polaris.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Coins className="w-3.5 h-3.5" /> {polaris.stardust} ✨
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_ACCESSORIES.map((acc) => {
                  const isUnlocked =
                    acc.id === 'none' ||
                    unlockedList.includes(acc.id) ||
                    progress.level >= acc.minLevel && acc.stardustCost === 0;
                  const isEquipped = activeAccessory === acc.id;
                  const canAfford = polaris.stardust >= acc.stardustCost;
                  const meetsLevel = progress.level >= acc.minLevel;

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90 dark:from-yellow-950/40 dark:to-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-2xl bg-amber-100/70 dark:bg-slate-800 border border-amber-200 dark:border-slate-700">
                          {acc.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              {acc.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getRarityBadge(
                                acc.rarity
                              )}`}
                            >
                              {getRarityLabel(acc.rarity)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {acc.description}
                          </p>
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3 text-slate-400" /> Nv. {acc.minLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Equipado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipStarAccessory(acc.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-transform active:scale-95"
                          >
                            {acc.id === 'none' ? 'Remover' : 'Equipar'}
                          </button>
                        ) : canAfford && meetsLevel ? (
                          <button
                            type="button"
                            onClick={() => handleBuyStarAccessory(acc.id, acc.stardustCost)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 fill-slate-950 text-slate-950" />
                            {acc.stardustCost} ✨
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {acc.stardustCost > 0 ? `${acc.stardustCost} ✨` : `Nv. ${acc.minLevel}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: AURAS & COSMIC EFFECTS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'auras' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                    Auras Cósmicas & Resplendores
                  </h3>
                  <p className="text-xs text-slate-400">
                    Crie campos de luz e energia vibracional ao redor do corpo estelar.
                  </p>
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  <Coins className="w-3.5 h-3.5" /> {polaris.stardust} ✨
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_AURAS.map((aura) => {
                  const isUnlocked =
                    aura.id === 'none' ||
                    unlockedList.includes(aura.id) ||
                    progress.level >= aura.minLevel && aura.stardustCost === 0;
                  const isEquipped = activeAura === aura.id;
                  const canAfford = polaris.stardust >= aura.stardustCost;
                  const meetsLevel = progress.level >= aura.minLevel;

                  return (
                    <div
                      key={aura.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-gradient-to-r from-purple-50/90 to-indigo-50/90 dark:from-purple-950/40 dark:to-indigo-950/40 border-purple-400 dark:border-purple-600 shadow-sm ring-2 ring-purple-400/40'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-2xl bg-purple-100/70 dark:bg-slate-800 border border-purple-200 dark:border-slate-700">
                          {aura.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                              {aura.name}
                            </h4>
                            <span
                              className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${getRarityBadge(
                                aura.rarity
                              )}`}
                            >
                              {getRarityLabel(aura.rarity)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {aura.description}
                          </p>
                          {!isUnlocked && (
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mt-0.5">
                              <Lock className="w-3 h-3 text-slate-400" /> Nv. {aura.minLevel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isEquipped ? (
                          <span className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-black flex items-center gap-1 shadow-xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" /> Ativa
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipStarAura(aura.id)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-300 dark:border-slate-700 transition-transform active:scale-95"
                          >
                            {aura.id === 'none' ? 'Desativar' : 'Ativar'}
                          </button>
                        ) : canAfford && meetsLevel ? (
                          <button
                            type="button"
                            onClick={() => handleBuyStarAura(aura.id, aura.stardustCost)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white text-xs font-black shadow-sm transition-transform active:scale-95 flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 fill-white text-white" />
                            {aura.stardustCost} ✨
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> {aura.stardustCost > 0 ? `${aura.stardustCost} ✨` : `Nv. ${aura.minLevel}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: EVOLUTION & STAGES
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'evolution' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Linha do Tempo de Evolução Cósmica
                </h3>
                <p className="text-xs text-slate-400">
                  Conforme você conclui tarefas e sobe de nível, o Polaris evolui para formas superiores com poderes únicos!
                </p>
              </div>

              <div className="space-y-3">
                {(['baby', 'young', 'guardian', 'master'] as PolarisStage[]).map((stageKey) => {
                  const cfg = STAGE_CONFIGS[stageKey];
                  const isCurrent = progress.stage === stageKey;
                  const isUnlocked = progress.level >= cfg.minLevel;

                  return (
                    <div
                      key={stageKey}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-400 dark:border-amber-700 shadow-md ring-2 ring-amber-400/40'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700 shrink-0">
                          <NinoAvatar
                            expression="happy"
                            color={activeColor}
                            size="md"
                            stage={stageKey}
                            interactive={false}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm text-slate-800 dark:text-slate-100">
                              {cfg.name}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              Nv. {cfg.minLevel}+ • {cfg.ageRange}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white">
                                Estágio Atual
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {cfg.description}
                          </p>
                          <div className="text-[11px] font-bold text-orange-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {cfg.perk}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 self-end sm:self-center">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold">
                            Ativo
                          </span>
                        ) : isUnlocked ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Conquistado
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            <Lock className="w-4 h-4" /> Desbloqueia no Nv. {cfg.minLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 6: DAILY MISSIONS
          ══════════════════════════════════════════════════════════ */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                    Missões de Produtividade Diária
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cumpra metas da rotina para resgatar XP e Cristais Estelares para a loja.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missions.map((mission) => {
                  const isReadyToClaim = mission.completed && !mission.claimed;
                  const isDone = mission.claimed;

                  return (
                    <div
                      key={mission.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isDone
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 opacity-75'
                          : isReadyToClaim
                          ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                          : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            {mission.id === 'mission_tasks_3' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                            {mission.id === 'mission_focus_25' && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                            {mission.id === 'mission_urgent_1' && <Flame className="w-3.5 h-3.5 text-rose-500" />}
                            {mission.id === 'mission_care_polaris' && <Heart className="w-3.5 h-3.5 text-pink-500" />}
                            {mission.title}
                          </h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center gap-1 shrink-0">
                            +{mission.rewardXp} XP • +{mission.rewardStardust} ✨
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                          {mission.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                            <span>Progresso</span>
                            <span>{mission.current} / {mission.target}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isDone
                                  ? 'bg-emerald-500'
                                  : isReadyToClaim
                                  ? 'bg-amber-500'
                                  : 'bg-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {isReadyToClaim ? (
                          <button
                            type="button"
                            onClick={() => onClaimMission && onClaimMission(mission.id, mission.rewardXp, mission.rewardStardust)}
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs shadow-sm transition-transform active:scale-95"
                          >
                            Resgatar
                          </button>
                        ) : isDone ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Resgatado
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Em andamento
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SANCTUARY FOOTER */}
        <div className="p-4 border-t border-orange-100 dark:border-amber-950/70 bg-orange-50/40 dark:bg-[#12100E] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5 font-medium text-[11px] sm:text-xs">
            <Award className="w-4 h-4 text-orange-500 shrink-0" />
            Cada tarefa concluída concede +XP, Cristais Estelares e eleva a harmonia do Polaris!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors shrink-0 ml-2"
          >
            Concluir
          </button>
        </div>
      </motion.div>
    </div>
  );
};
