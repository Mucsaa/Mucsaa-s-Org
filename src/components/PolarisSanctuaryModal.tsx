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
  ChevronRight,
  TrendingUp,
  Award,
  Palette,
} from 'lucide-react';
import {
  UserProfile,
  Task,
  PolarisStage,
  NinoExpression,
} from '../types';
import {
  getLevelProgress,
  STAGE_CONFIGS,
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
  onEquipAura?: (id: string) => void;
  onUnlockItem?: (id: string, cost: number, type: 'accessory' | 'aura') => void;
}

export const PolarisSanctuaryModal: React.FC<PolarisSanctuaryModalProps> = ({
  isOpen,
  onClose,
  user,
  tasks,
  onUpdateUser,
  onClaimMission,
  onCareAction,
  onEquipAccessory,
  onEquipAura,
  onUnlockItem,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'wardrobe' | 'auras' | 'colors' | 'tree'>('missions');
  const [petExpression, setPetExpression] = useState<NinoExpression>('happy');
  const [petMessage, setPetMessage] = useState<string>('Estou tão feliz em ver você cuidando da sua rotina!');

  if (!isOpen) return null;

  const polaris = user.polaris;
  const progress = getLevelProgress(polaris.xp);
  const currentStageConfig = STAGE_CONFIGS[progress.stage];
  const missions = getDailyMissions(tasks, user);
  const claimableCount = missions.filter((m) => m.completed && !m.claimed).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const completionPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const starTheme = computePolarisStarColor({
    expression: petExpression,
    completedTasksCount: completedToday,
    totalTasksCount: totalToday,
    completionPercent,
    preferredColor: user.preferences.ninoColor,
  });

  const handlePetInteraction = () => {
    soundManager.playPop();
    setPetExpression('excited');
    setPetMessage('Adorei o carinho! Minha luz estelar está brilhando com força total! ✨💖');

    if (onCareAction) {
      onCareAction('pet');
    }

    setTimeout(() => {
      setPetExpression('happy');
    }, 3000);
  };

  const handleFeedInteraction = () => {
    soundManager.playCelebration();
    confetti({
      particleCount: 25,
      spread: 45,
      origin: { y: 0.6 },
    });

    setPetExpression('celebrating');
    setPetMessage('Nham! Energia cósmica renovada! Supernova de foco ativada! 🌟⚡');

    if (onCareAction) {
      onCareAction('feed');
    }

    if (user.preferences.voiceEnabled) {
      speechService.speak('Obrigado pela energia! Minha estrela está pronta para te guiar nas metas do dia!');
    }

    setTimeout(() => {
      setPetExpression('happy');
    }, 3500);
  };

  const handleEquipAccessory = (accId: string) => {
    soundManager.playPop();
    if (onEquipAccessory) {
      onEquipAccessory(accId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        polaris: { ...polaris, equippedAccessory: accId },
      });
    }
    setPetExpression('proud');
    setPetMessage('Fiquei super estiloso com esse novo visual! O que achou? 😎');
  };

  const handleBuyAccessory = (accId: string, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playPop();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais Estelares! Conclua tarefas para ganhar.`);
      return;
    }

    soundManager.playCelebration();
    confetti({
      particleCount: 30,
      spread: 50,
      origin: { y: 0.6 },
    });

    if (onUnlockItem) {
      onUnlockItem(accId, cost, 'accessory');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...polaris.unlockedItems, accId]));
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          stardust: polaris.stardust - cost,
          unlockedItems: updatedUnlocked,
          equippedAccessory: accId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage('Novo item estelar desbloqueado e equipado com sucesso! 👑✨');
  };

  const handleEquipAura = (auraId: string) => {
    soundManager.playPop();
    if (onEquipAura) {
      onEquipAura(auraId);
    } else if (onUpdateUser) {
      onUpdateUser({
        ...user,
        polaris: { ...polaris, equippedAura: auraId },
      });
    }
    setPetExpression('excited');
    setPetMessage('Sinta o poder dessa nova aura brilhando ao meu redor! 🌌');
  };

  const handleBuyAura = (auraId: string, cost: number) => {
    if (polaris.stardust < cost) {
      soundManager.playPop();
      setPetMessage(`Você precisa de mais ${cost - polaris.stardust} Cristais Estelares! Conclua tarefas e foque.`);
      return;
    }

    soundManager.playCelebration();
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.6 },
    });

    if (onUnlockItem) {
      onUnlockItem(auraId, cost, 'aura');
    } else if (onUpdateUser) {
      const updatedUnlocked = Array.from(new Set([...polaris.unlockedItems, auraId]));
      onUpdateUser({
        ...user,
        polaris: {
          ...polaris,
          stardust: polaris.stardust - cost,
          unlockedItems: updatedUnlocked,
          equippedAura: auraId,
        },
      });
    }
    setPetExpression('celebrating');
    setPetMessage('Aura cósmica ativada com sucesso! 💫');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Main Sanctuary Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#181614] rounded-3xl shadow-2xl border border-orange-200 dark:border-amber-950/80 overflow-hidden z-10 my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 text-slate-700 dark:text-slate-200 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Banner with Dynamic Star Polaris */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 text-white overflow-hidden">
          {/* Glowing Star Shimmers */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
            {/* Big Interactive Polaris Star */}
            <div className="flex flex-col items-center">
              <div className="p-2 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 shadow-xl">
                <NinoAvatar
                  expression={petExpression}
                  color={user.preferences.ninoColor}
                  size="xl"
                  stage={progress.stage}
                  accessory={polaris.equippedAccessory}
                  aura={polaris.equippedAura}
                  completedTasksCount={completedToday}
                  totalTasksCount={totalToday}
                  completionPercent={completionPercent}
                  interactive={true}
                  onClick={handlePetInteraction}
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handlePetInteraction}
                  className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold tracking-wide transition-transform active:scale-95 flex items-center gap-1 shadow-xs"
                >
                  <Heart className="w-3 h-3 fill-rose-300 text-rose-300" />
                  Carinho
                </button>
                <button
                  type="button"
                  onClick={handleFeedInteraction}
                  className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-[11px] font-bold tracking-wide transition-transform active:scale-95 flex items-center gap-1 shadow-xs"
                >
                  <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                  Energia
                </button>
              </div>
            </div>

            {/* Stats & Evolution Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 text-xs font-bold uppercase tracking-wider border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  {currentStageConfig.badge}
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold text-white border border-white/25">
                  <span>{starTheme.badgeText}</span>
                </div>
              </div>

              <h2 className="text-2xl font-black font-['Outfit',sans-serif] tracking-tight">
                Polaris • Nível {progress.level}
              </h2>

              <p className="text-xs text-white/95 font-medium max-w-sm mt-0.5">
                "{petMessage}"
              </p>

              {/* Age & Stardust Balance Badges */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
                <div className="px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 text-xs font-bold">
                  <span className="text-base leading-none">⏳</span>
                  <span>Idade: {polaris.ageDays} dias</span>
                </div>

                <div className="px-3 py-1.5 rounded-2xl bg-amber-400 text-slate-900 shadow-md flex items-center gap-1.5 text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                  <span>{polaris.stardust} Cristais</span>
                </div>

                <div className="px-3 py-1.5 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 flex items-center gap-1.5 text-xs font-bold">
                  <Heart className="w-3.5 h-3.5 fill-rose-300 text-rose-300" />
                  <span>Harmonia: {polaris.affinity}%</span>
                </div>
              </div>

              {/* XP Progress Bar */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-white/90 mb-1">
                  <span>Progresso do Nível {progress.level}</span>
                  <span>{progress.xpInCurrentLevel} / {progress.xpNeededForNext} XP ({progress.percent}%)</span>
                </div>
                <div className="w-full h-3 rounded-full bg-black/25 overflow-hidden p-0.5 border border-white/20">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-white shadow-sm"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-orange-100 dark:border-amber-950/70 bg-orange-50/50 dark:bg-[#13110F] px-4 pt-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('missions')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'missions'
                ? 'bg-white dark:bg-[#181614] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-950/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            Missões Diárias
            {claimableCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {claimableCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'colors'
                ? 'bg-white dark:bg-[#181614] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-950/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            Cores & Humor Estelar
          </button>

          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'wardrobe'
                ? 'bg-white dark:bg-[#181614] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-950/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            Acessórios
          </button>

          <button
            onClick={() => setActiveTab('auras')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'auras'
                ? 'bg-white dark:bg-[#181614] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-950/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auras
          </button>

          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-2.5 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tree'
                ? 'bg-white dark:bg-[#181614] text-orange-600 dark:text-amber-400 border-t border-x border-orange-200 dark:border-amber-950/80 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Evolução
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 max-h-[50vh] overflow-y-auto space-y-4">
          {/* TAB 1: DAILY MISSIONS */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Missões de Produtividade do Dia
                </h3>
                <p className="text-xs text-slate-400">
                  Cumpra suas tarefas diárias para ganhar XP e Cristais Estelares para o Polaris.
                </p>
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
                          ? 'bg-orange-50/80 dark:bg-amber-950/30 border-orange-300 dark:border-amber-700 shadow-sm shadow-orange-500/10'
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
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 flex items-center gap-1 shrink-0">
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
                                  ? 'bg-orange-500'
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
                            className="px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs shadow-sm hover:from-orange-600 hover:to-amber-600 transition-transform active:scale-95"
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

          {/* TAB 2: STAR COLORS & MOOD GUIDE */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Cromática Estelar: Como o Polaris Muda de Cor
                </h3>
                <p className="text-xs text-slate-400">
                  O Polaris é uma estrela viva que expressa seus sentimentos e a conclusão das suas tarefas através de luz e cores dinâmicas!
                </p>
              </div>

              {/* Current Star Mood Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-xs border border-amber-200 dark:border-amber-800">
                    <NinoAvatar
                      expression={petExpression}
                      size="sm"
                      stage={progress.stage}
                      completedTasksCount={completedToday}
                      totalTasksCount={totalToday}
                      completionPercent={completionPercent}
                      interactive={false}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-orange-600 dark:text-amber-400 uppercase tracking-wider">
                      Estado Estelar Atual
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                      {starTheme.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {starTheme.reason} ({completedToday}/{totalToday} tarefas concluídas hoje)
                    </p>
                  </div>
                </div>
              </div>

              {/* Color States Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Ouro Supernova (100% Concluído)',
                    desc: 'Quando todas as tarefas do dia são finalizadas ou em momentos de pura comemoração!',
                    exp: 'celebrating' as NinoExpression,
                    tasks: 5,
                    total: 5,
                    color: 'amber' as const,
                    tag: '✨ Vitória Cósmica',
                  },
                  {
                    title: 'Âmbar Solar Radiante',
                    desc: 'Quando você atinge 60% ou mais das tarefas ou o Polaris fica empolgado.',
                    exp: 'excited' as NinoExpression,
                    tasks: 4,
                    total: 5,
                    color: 'amber' as const,
                    tag: '🔥 Alta Energia',
                  },
                  {
                    title: 'Menta & Esmeralda Produtiva',
                    desc: 'Ritmo ativo com as primeiras vitórias e tarefas em andamento fluindo.',
                    exp: 'happy' as NinoExpression,
                    tasks: 2,
                    total: 5,
                    color: 'emerald' as const,
                    tag: '🌱 Crescimento',
                  },
                  {
                    title: 'Ametista & Violeta Focado',
                    desc: 'Momento de foco profundo, hiperfoco ou planejamento de metas.',
                    exp: 'thinking' as NinoExpression,
                    tasks: 1,
                    total: 5,
                    color: 'violet' as const,
                    tag: '🧠 Concentração',
                  },
                  {
                    title: 'Aurora Rosa & Coral',
                    desc: 'Alerta gentil quando há tarefas atrasadas ou de prioridade urgente.',
                    exp: 'concerned' as NinoExpression,
                    tasks: 0,
                    total: 4,
                    color: 'rose' as const,
                    tag: '⚠️ Atenção Gentil',
                  },
                  {
                    title: 'Periwinkle Noturno Lunar',
                    desc: 'Horário de descanso noturno ou quando é hora de recarregar as energias.',
                    exp: 'sleepy' as NinoExpression,
                    tasks: 3,
                    total: 3,
                    color: 'indigo' as const,
                    tag: '🌙 Descanso Sereno',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-start gap-3"
                  >
                    <div className="shrink-0 p-1 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <NinoAvatar
                        expression={item.exp}
                        color={item.color}
                        size="sm"
                        stage="young"
                        completedTasksCount={item.tasks}
                        totalTasksCount={item.total}
                        interactive={false}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                          {item.title}
                        </h5>
                      </div>
                      <span className="inline-block my-0.5 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.tag}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ACCESSORIES */}
          {activeTab === 'wardrobe' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Guarda-Roupa Estelar
                </h3>
                <p className="text-xs text-slate-400">
                  Personalize a ponta estelar e o rosto do seu Polaris com acessórios cósmicos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_ACCESSORIES.map((acc) => {
                  const isUnlocked =
                    acc.id === 'none' ||
                    polaris.unlockedItems.includes(acc.id) ||
                    progress.level >= acc.minLevel;
                  const isEquipped = polaris.equippedAccessory === acc.id;

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-orange-50/90 dark:bg-amber-950/40 border-orange-400 dark:border-amber-700 shadow-xs'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-65'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {acc.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              {acc.name}
                            </h4>
                            {acc.rarity === 'legendary' && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-900">
                                Lendário
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {acc.description}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span className="px-3 py-1 rounded-xl bg-orange-500 text-white text-xs font-bold">
                            Equipado
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipAccessory(acc.id)}
                            className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            Equipar
                          </button>
                        ) : polaris.stardust >= acc.stardustCost ? (
                          <button
                            type="button"
                            onClick={() => handleBuyAccessory(acc.id, acc.stardustCost)}
                            className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold flex items-center gap-1 shadow-xs"
                          >
                            {acc.stardustCost} ✨
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Nv. {acc.minLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: AURAS */}
          {activeTab === 'auras' && (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Auras Cósmicas de Energia
                </h3>
                <p className="text-xs text-slate-400">
                  Crie campos de luz e energia radiante ao redor do corpo estelar do Polaris.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {POLARIS_AURAS.map((aura) => {
                  const isUnlocked =
                    aura.id === 'none' ||
                    polaris.unlockedItems.includes(aura.id) ||
                    progress.level >= aura.minLevel;
                  const isEquipped = polaris.equippedAura === aura.id;

                  return (
                    <div
                      key={aura.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isEquipped
                          ? 'bg-orange-50/90 dark:bg-amber-950/40 border-orange-400 dark:border-amber-700 shadow-xs'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-65'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl p-2 rounded-2xl bg-slate-100 dark:bg-slate-800">
                          {aura.icon}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                            {aura.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {aura.description}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isEquipped ? (
                          <span className="px-3 py-1 rounded-xl bg-orange-500 text-white text-xs font-bold">
                            Ativa
                          </span>
                        ) : isUnlocked ? (
                          <button
                            type="button"
                            onClick={() => handleEquipAura(aura.id)}
                            className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            Ativar
                          </button>
                        ) : polaris.stardust >= aura.stardustCost ? (
                          <button
                            type="button"
                            onClick={() => handleBuyAura(aura.id, aura.stardustCost)}
                            className="px-3 py-1 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-extrabold flex items-center gap-1 shadow-xs"
                          >
                            {aura.stardustCost} ✨
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 text-[10px] font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Nv. {aura.minLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: EVOLUTION TREE */}
          {activeTab === 'tree' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Linha do Tempo de Evolução & Idade Cósmica
                </h3>
                <p className="text-xs text-slate-400">
                  O Polaris cresce e ganha novas formas conforme você mantém seu streak e conclui tarefas.
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
                          ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-amber-950/30 dark:to-orange-950/30 border-orange-300 dark:border-amber-800 shadow-md'
                          : isUnlocked
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                          : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 rounded-2xl bg-white dark:bg-slate-800 shadow-xs border border-slate-200 dark:border-slate-700">
                          <NinoAvatar
                            expression="happy"
                            color={user.preferences.ninoColor}
                            size="md"
                            stage={stageKey}
                            interactive={false}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
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
                            Poder: {cfg.perk}
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
        </div>

        {/* Footer / Tip */}
        <div className="p-4 border-t border-orange-100 dark:border-amber-950/70 bg-orange-50/40 dark:bg-[#13110F] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-orange-500" />
            Dica: Cada tarefa concluída rende +30 a +60 XP e muda a cor da sua estrela!
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 transition-colors"
          >
            Continuar Tarefas
          </button>
        </div>
      </motion.div>
    </div>
  );
};
