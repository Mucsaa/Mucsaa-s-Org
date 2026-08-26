import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Crown, Zap, ArrowRight, Gift, Award } from 'lucide-react';
import { LevelUpEvent, UserProfile } from '../types';
import { STAGE_CONFIGS } from '../utils/rewards';
import { NinoAvatar } from './NinoAvatar';
import { soundManager } from '../utils/sound';

interface PolarisLevelUpModalProps {
  event: LevelUpEvent | null;
  user: UserProfile;
  onClose: () => void;
  onOpenSanctuary: () => void;
}

export const PolarisLevelUpModal: React.FC<PolarisLevelUpModalProps> = ({
  event,
  user,
  onClose,
  onOpenSanctuary,
}) => {
  useEffect(() => {
    if (event) {
      soundManager.playCelebration();
      // Multi-stage confetti burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    }
  }, [event]);

  if (!event) return null;

  const newStageConfig = STAGE_CONFIGS[event.newStage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
      />

      {/* Level Up Celebration Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="relative w-full max-w-md bg-white dark:bg-[#181614] rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-2xl overflow-hidden z-10 text-center p-6 sm:p-8"
      >
        {/* Glow Header */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-400/30 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider mb-4 shadow-md shadow-orange-500/25">
          <Sparkles className="w-4 h-4 fill-white" />
          {event.evolved ? '✨ Evolução Cósmica!' : '🚀 Subiu de Nível!'}
        </div>

        {/* Avatar Presentation */}
        <div className="my-3 flex justify-center">
          <div className="p-3 rounded-full bg-gradient-to-b from-amber-100 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/20 border border-amber-300 dark:border-amber-700 shadow-inner">
            <NinoAvatar
              expression="celebrating"
              color={user.preferences.ninoColor}
              size="xl"
              stage={event.newStage}
              accessory={user.polaris.equippedAccessory}
              aura={user.polaris.equippedAura}
              interactive={false}
            />
          </div>
        </div>

        {/* Level Title */}
        <h2 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-slate-800 dark:text-slate-100 tracking-tight">
          Polaris Nível {event.newLevel}!
        </h2>

        <p className="text-sm font-bold text-orange-600 dark:text-amber-400 mt-1">
          {newStageConfig.badge} • Idade Astral {user.polaris.ageDays} Dias
        </p>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          {event.evolved
            ? `Incrível! O Polaris evoluiu para ${newStageConfig.name}! Sua consistência e foco desbloquearam novos poderes e asas de luz!`
            : 'Cada tarefa que você realiza alimenta o poder e o companheirismo do Polaris. Continue assim!'}
        </p>

        {/* Rewards Box */}
        <div className="my-5 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 space-y-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
            Recompensas Desbloqueadas
          </span>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>+{event.rewardStardust} Cristais Estelares</span>
            </div>

            {event.evolved && (
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-300">
                <Crown className="w-4 h-4" />
                <span>Poder: {newStageConfig.perk}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSanctuary();
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white font-extrabold text-xs shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-yellow-600 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <Gift className="w-4 h-4" />
            Ver Loja & Santuário do Polaris
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Continuar Focado
          </button>
        </div>
      </motion.div>
    </div>
  );
};
