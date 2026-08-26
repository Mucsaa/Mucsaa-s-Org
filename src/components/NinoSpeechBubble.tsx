import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, RefreshCw } from 'lucide-react';
import { NinoDialogue, NinoPersonality } from '../types';
import { PERSONALITY_CONFIGS } from '../utils/constants';

interface NinoSpeechBubbleProps {
  dialogue: NinoDialogue;
  personality: NinoPersonality;
  onSpeak?: () => void;
  isSpeaking?: boolean;
  onRefreshQuote?: () => void;
  onQuickAction?: () => void;
}

export const NinoSpeechBubble: React.FC<NinoSpeechBubbleProps> = ({
  dialogue,
  personality,
  onSpeak,
  isSpeaking,
  onRefreshQuote,
  onQuickAction,
}) => {
  const personalityInfo = PERSONALITY_CONFIGS[personality];

  return (
    <div className="relative w-full max-w-xl">
      {/* Speech Bubble Arrow */}
      <div className="hidden sm:block absolute -left-3 top-6 w-0 h-0 border-t-[10px] border-t-transparent border-r-[14px] border-r-white dark:border-r-[#1D1A16] border-b-[10px] border-b-transparent drop-shadow-xs z-10" />

      {/* Main Bubble Card */}
      <motion.div
        key={dialogue.text}
        initial={{ opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm transition-all duration-300 ${
          dialogue.urgent
            ? 'bg-amber-50/95 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/60 shadow-amber-500/10'
            : 'bg-white/95 dark:bg-[#1D1A16]/90 border-orange-100/90 dark:border-amber-950/60 shadow-orange-950/5'
        } backdrop-blur-md`}
      >
        {/* Header Row: Personality Tag & Controls */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/60 dark:to-amber-950/60 text-orange-800 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800/50">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Polaris • {personalityInfo.badge}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {onSpeak && (
              <button
                type="button"
                onClick={onSpeak}
                className={`p-1.5 rounded-lg transition-colors text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-amber-950/40 ${
                  isSpeaking ? 'text-orange-600 bg-orange-50 dark:bg-amber-950/40 animate-pulse' : ''
                }`}
                title={isSpeaking ? 'Falando...' : 'Ouvir voz do Polaris'}
              >
                {isSpeaking ? <Volume2 className="w-4 h-4" /> : <Volume2 className="w-4 h-4 opacity-70" />}
              </button>
            )}

            {onRefreshQuote && (
              <button
                type="button"
                onClick={onRefreshQuote}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-50/70 dark:hover:bg-amber-950/40 transition-colors"
                title="Pedir outra dica ou reflexão"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bubble Text */}
        <p className="text-slate-800 dark:text-slate-100 text-sm sm:text-base font-medium leading-relaxed">
          {dialogue.text}
        </p>

        {/* Optional Action Button */}
        {dialogue.actionText && onQuickAction && (
          <div className="mt-3 pt-2.5 border-t border-orange-100/70 dark:border-amber-950/60 flex items-center justify-end">
            <button
              type="button"
              onClick={onQuickAction}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-orange-500/20"
            >
              {dialogue.actionText}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
