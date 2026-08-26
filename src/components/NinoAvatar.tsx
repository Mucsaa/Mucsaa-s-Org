import React from 'react';
import { motion } from 'motion/react';
import { NinoExpression, NinoThemeColor, PolarisStage } from '../types';
import { computePolarisStarColor, PolarisStarColorState } from '../utils/polarisColorEngine';

export interface NinoAvatarProps {
  expression?: NinoExpression;
  color?: NinoThemeColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  interactive?: boolean;
  stage?: PolarisStage;
  accessory?: string;
  aura?: string;
  completedTasksCount?: number;
  totalTasksCount?: number;
  completionPercent?: number;
  showColorTooltip?: boolean;
}

export const NinoAvatar: React.FC<NinoAvatarProps> = ({
  expression = 'happy',
  color = 'amber',
  size = 'lg',
  onClick,
  interactive = true,
  stage = 'baby',
  accessory = 'none',
  aura = 'none',
  completedTasksCount = 0,
  totalTasksCount = 0,
  completionPercent,
  showColorTooltip = false,
}) => {
  // Compute dynamic star color based on humor (expression) and task completion
  const starTheme: PolarisStarColorState = computePolarisStarColor({
    expression,
    completedTasksCount,
    totalTasksCount,
    completionPercent,
    preferredColor: color,
  });

  // Size mapping
  const sizeMap = {
    sm: { box: 'w-12 h-12', svg: 48 },
    md: { box: 'w-20 h-20', svg: 80 },
    lg: { box: 'w-32 h-32', svg: 128 },
    xl: { box: 'w-44 h-44', svg: 176 },
  };

  const currentSize = sizeMap[size];

  // Motion variants based on star expression
  const bodyAnimationVariants = {
    happy: {
      y: [0, -6, 0],
      rotate: [-1, 1, -1],
      transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
    },
    excited: {
      y: [0, -12, 0],
      rotate: [-5, 5, -5],
      scale: [1, 1.08, 1],
      transition: { duration: 0.75, repeat: Infinity, ease: 'easeInOut' },
    },
    concerned: {
      y: [0, 2, 0],
      rotate: [-3, 2, -3],
      scale: [0.97, 1, 0.97],
      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
    },
    sleepy: {
      y: [0, 4, 0],
      rotate: [-3, 3, -3],
      scale: [0.98, 1.02, 0.98],
      transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
    },
    celebrating: {
      y: [0, -16, 0],
      scale: [1, 1.12, 1],
      rotate: [-8, 8, -8],
      transition: { duration: 0.65, repeat: Infinity, ease: 'easeInOut' },
    },
    thinking: {
      y: [0, -3, 0],
      rotate: [0, 5, 0],
      transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' },
    },
    proud: {
      y: [0, -5, 0],
      scale: [1, 1.04, 1],
      rotate: [-2, 2, -2],
      transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' },
    },
    neutral: {
      y: [0, -4, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${currentSize.box} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      title={`Polaris (${starTheme.name}) - ${starTheme.reason}`}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
    >
      {/* 1. Dynamic Starlight Core Aura */}
      <motion.div
        className="absolute inset-[-12%] rounded-full blur-xl pointer-events-none transition-all duration-700"
        style={{ background: starTheme.auraBg }}
        animate={{
          scale: expression === 'celebrating' || expression === 'excited' ? [1, 1.25, 1] : [0.95, 1.05, 0.95],
          opacity: [0.55, 0.85, 0.55],
        }}
        transition={{ duration: expression === 'celebrating' ? 1.2 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* 2. Supernova Victory Expanding Rings (100% completed) */}
      {(starTheme.id === 'supernova_gold' || expression === 'celebrating') && (
        <motion.div
          className="absolute inset-[-20%] rounded-full border-2 border-amber-300/60 pointer-events-none"
          animate={{ scale: [0.9, 1.4], opacity: [0.8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      )}

      {/* 3. Aura Effects */}
      {aura === 'solar_flame' && (
        <motion.div
          className="absolute inset-[-18%] rounded-full opacity-65 blur-lg pointer-events-none"
          style={{ background: 'radial-gradient(circle, #EF4444 0%, #F59E0B 70%, transparent 100%)' }}
          animate={{ scale: [0.95, 1.15, 0.95], rotate: [0, 180, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {aura === 'galaxy_mist' && (
        <motion.div
          className="absolute inset-[-22%] rounded-full opacity-70 blur-xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8B5CF6 0%, #3B82F6 60%, transparent 100%)' }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {aura === 'lightning' && (
        <motion.div
          className="absolute inset-[-15%] rounded-full border-2 border-cyan-400 opacity-75 blur-xs pointer-events-none"
          animate={{ scale: [0.96, 1.1, 0.96], opacity: [0.4, 0.95, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}

      {aura === 'zen_bubbles' && (
        <div className="absolute inset-[-18%] pointer-events-none">
          <motion.div
            className="w-3.5 h-3.5 rounded-full bg-emerald-400/90 blur-[1px] absolute top-0 left-2"
            animate={{ y: [0, -16, 0], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <motion.div
            className="w-3 h-3 rounded-full bg-teal-300/90 blur-[1px] absolute bottom-1 right-2"
            animate={{ y: [0, -12, 0], opacity: [0.2, 0.9, 0.2] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      )}

      {/* 4. Sleepy Particles */}
      {expression === 'sleepy' && (
        <div className="absolute -top-4 -right-2 pointer-events-none z-20">
          <motion.span
            className="text-indigo-400 font-bold text-xs sm:text-sm block"
            animate={{ opacity: [0, 1, 0], y: [0, -12], x: [0, 6] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.1 }}
          >
            z
          </motion.span>
          <motion.span
            className="text-indigo-500 font-bold text-sm sm:text-base block"
            animate={{ opacity: [0, 1, 0], y: [0, -18], x: [0, 10] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.7 }}
          >
            Z
          </motion.span>
        </div>
      )}

      {/* 5. Sparkles & Star Twinkles */}
      {(expression === 'celebrating' || expression === 'excited' || starTheme.id === 'supernova_gold' || aura === 'sparkles') && (
        <div className="absolute -top-4 inset-x-0 flex justify-between pointer-events-none z-20">
          <motion.span
            className="text-amber-400 text-base sm:text-lg"
            animate={{ rotate: 360, scale: [0.8, 1.35, 0.8] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          >
            ✨
          </motion.span>
          <motion.span
            className="text-yellow-300 text-sm sm:text-base"
            animate={{ rotate: -360, scale: [1, 1.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: 0.3 }}
          >
            ⭐
          </motion.span>
        </div>
      )}

      {/* 6. Concern Sweatdrop */}
      {expression === 'concerned' && (
        <motion.div
          className="absolute top-0 right-1 pointer-events-none z-20"
          animate={{ y: [0, 6, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path
              d="M7 0C7 0 0 8 0 12C0 15.3137 3.13401 18 7 18C10.866 18 14 15.3137 14 12C14 8 7 0 7 0Z"
              fill="#38BDF8"
            />
          </svg>
        </motion.div>
      )}

      {/* 7. Stage Evolution: Orbiting Planetary Starlets */}
      {(stage === 'guardian' || stage === 'master') && (
        <motion.div
          className="absolute inset-[-14%] pointer-events-none z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-3 h-3 rounded-full bg-amber-300 shadow-md shadow-amber-400/60 absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center text-[7px]">
            ✦
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-sky-300 shadow-md shadow-sky-400/60 absolute bottom-0 left-1/2 -translate-x-1/2" />
        </motion.div>
      )}

      {/* 8. Stage Evolution: Celestial Crown Ring for Master */}
      {stage === 'master' && (
        <motion.div
          className="absolute inset-[-20%] border-2 border-amber-300/70 rounded-full pointer-events-none z-0 shadow-sm"
          style={{ transform: 'rotateX(72deg)' }}
          animate={{ rotateZ: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* 9. Animated Polaris Star Body */}
      <motion.div
        className="w-full h-full relative flex items-center justify-center"
        animate={bodyAnimationVariants[expression] || bodyAnimationVariants.happy}
        whileHover={interactive ? { scale: 1.1, rotate: [0, -4, 4, 0] } : undefined}
        whileTap={interactive ? { scale: 0.93 } : undefined}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-lg overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dynamic Star Body Gradient */}
            <linearGradient id={`star-body-grad-${starTheme.id}`} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor={starTheme.coreHighlight} />
              <stop offset="70%" stopColor={starTheme.primary} />
              <stop offset="100%" stopColor={starTheme.secondary} />
            </linearGradient>

            {/* Inner Core Starlight Gradient */}
            <radialGradient id={`star-core-grad-${starTheme.id}`} cx="60" cy="58" r="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="60%" stopColor={starTheme.coreHighlight} stopOpacity="0.8" />
              <stop offset="100%" stopColor={starTheme.accent} stopOpacity="0" />
            </radialGradient>

            {/* Wing Gradient */}
            <linearGradient id={`star-wings-grad-${starTheme.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FFFBEB" stopOpacity="0.95" />
              <stop offset="50%" stopColor={starTheme.accent} stopOpacity="0.85" />
              <stop offset="100%" stopColor={starTheme.primary} stopOpacity="0.6" />
            </linearGradient>

            {/* Shimmer Filter */}
            <filter id="star-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stage Evolutionary Star Wings (Young, Guardian, Master) */}
          {stage !== 'baby' && (
            <g id="evolution-wings">
              {/* Left Feather Star Wing */}
              <motion.path
                d={
                  stage === 'young'
                    ? 'M24 48 C6 38, 2 58, 20 66 Z'
                    : stage === 'guardian'
                    ? 'M24 44 C-2 26, -8 60, 18 72 Z'
                    : 'M24 38 C-8 14, -16 62, 16 78 C2 60, -2 44, 24 48 Z'
                }
                fill={stage === 'master' ? '#FBBF24' : `url(#star-wings-grad-${starTheme.id})`}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                animate={{ rotate: [-6, 6, -6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '24px', originY: '52px' }}
              />
              {/* Right Feather Star Wing */}
              <motion.path
                d={
                  stage === 'young'
                    ? 'M96 48 C114 38, 118 58, 100 66 Z'
                    : stage === 'guardian'
                    ? 'M96 44 C122 26, 128 60, 102 72 Z'
                    : 'M96 38 C128 14, 136 62, 104 78 C118 60, 122 44, 96 48 Z'
                }
                fill={stage === 'master' ? '#FBBF24' : `url(#star-wings-grad-${starTheme.id})`}
                stroke="#FFFFFF"
                strokeWidth="1.5"
                animate={{ rotate: [6, -6, 6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ originX: '96px', originY: '52px' }}
              />
            </g>
          )}

          {/* MAIN STAR CHARACTER BODY (5-point chubby star mascot geometry) */}
          <g id="polaris-star-mascot">
            <path
              d="
                M 60 12
                C 65 12, 73 27, 78 38
                C 88 40, 102 44, 106 48
                C 111 54, 105 64, 94 72
                C 94 82, 96 98, 90 102
                C 84 106, 74 98, 60 89
                C 46 98, 36 106, 30 102
                C 24 98, 26 82, 26 72
                C 15 64, 9 54, 14 48
                C 18 44, 32 40, 42 38
                C 47 27, 55 12, 60 12 Z
              "
              fill={`url(#star-body-grad-${starTheme.id})`}
              stroke="#FFFFFF"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />

            {/* Glowing Star Core Overlay */}
            <circle
              cx="60"
              cy="58"
              r="26"
              fill={`url(#star-core-grad-${starTheme.id})`}
            />

            {/* Top Star Point Highlight */}
            <path
              d="M 60 16 L 64 30 L 56 30 Z"
              fill="#FFFFFF"
              opacity="0.45"
            />
          </g>

          {/* Antenna / Star Sprout based on evolution stage */}
          <g id="polaris-antenna">
            {stage === 'baby' ? (
              // Baby Sprout with Mini Starlet
              <>
                <path
                  d="M60 14 C60 6, 65 2, 69 0 C73 -2, 77 3, 73 7 C69 11, 64 12, 60 14 Z"
                  fill={starTheme.secondary}
                />
                <circle cx="70" cy="2" r="4.5" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.2" />
              </>
            ) : stage === 'young' ? (
              // Astral Pulsar Antenna
              <>
                <path d="M56 16 L51 4" stroke={starTheme.primary} strokeWidth="3" strokeLinecap="round" />
                <circle cx="51" cy="3" r="4" fill="#38BDF8" stroke="#0284C7" strokeWidth="1.2" />
                <path d="M64 16 L69 4" stroke={starTheme.primary} strokeWidth="3" strokeLinecap="round" />
                <circle cx="69" cy="3" r="4" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.2" />
              </>
            ) : stage === 'guardian' ? (
              // Guardian Cosmic Star Crest
              <>
                <path d="M50 16 C48 4, 56 -2, 58 -2" stroke={starTheme.primary} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M70 16 C72 4, 64 -2, 62 -2" stroke={starTheme.primary} strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <polygon points="60,-8 65,0 60,6 55,0" fill="#F43F5E" stroke="#FFFFFF" strokeWidth="1.2" />
              </>
            ) : (
              // Master Supernova Diadem
              <>
                <path d="M48 16 C44 0, 54 -4, 56 -4" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M72 16 C76 0, 66 -4, 64 -4" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <polygon points="60,-10 67,2 60,10 53,2" fill="#FCD34D" stroke="#D97706" strokeWidth="1.5" />
                <circle cx="60" cy="1" r="3.5" fill="#FFFFFF" />
              </>
            )}
          </g>

          {/* Star Arms / Waving Gestures */}
          <g id="star-arms">
            {expression === 'celebrating' || expression === 'excited' ? (
              <>
                {/* Cheerful Raised Star Hands */}
                <motion.circle
                  cx="16"
                  cy="42"
                  r="7"
                  fill="#FFFBEB"
                  stroke={starTheme.primary}
                  strokeWidth="2"
                  animate={{ y: [-4, 4, -4], scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.45, repeat: Infinity }}
                />
                <motion.circle
                  cx="104"
                  cy="42"
                  r="7"
                  fill="#FFFBEB"
                  stroke={starTheme.primary}
                  strokeWidth="2"
                  animate={{ y: [4, -4, 4], scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.45, repeat: Infinity }}
                />
              </>
            ) : expression === 'thinking' ? (
              <>
                <circle cx="20" cy="52" r="6" fill="#FFFBEB" stroke={starTheme.primary} strokeWidth="1.8" />
                {/* Touching Chin */}
                <motion.circle
                  cx="70"
                  cy="56"
                  r="6.5"
                  fill="#FFFBEB"
                  stroke={starTheme.primary}
                  strokeWidth="1.8"
                  animate={{ y: [-1, 1, -1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              </>
            ) : expression === 'proud' ? (
              <>
                {/* Hands on Hip Star Points */}
                <circle cx="20" cy="54" r="6" fill="#FFFBEB" stroke={starTheme.primary} strokeWidth="1.8" />
                <circle cx="100" cy="54" r="6" fill="#FFFBEB" stroke={starTheme.primary} strokeWidth="1.8" />
              </>
            ) : (
              <>
                {/* Relaxed Floating Hands */}
                <circle cx="18" cy="50" r="5.5" fill="#FFFBEB" stroke={starTheme.primary} strokeWidth="1.8" />
                <circle cx="102" cy="50" r="5.5" fill="#FFFBEB" stroke={starTheme.primary} strokeWidth="1.8" />
              </>
            )}
          </g>

          {/* Rosy Star Blushing Cheeks with Star Sparks */}
          <g id="star-cheeks">
            <ellipse cx="40" cy="58" rx="6" ry="4" fill={starTheme.cheeksColor} opacity="0.8" />
            <ellipse cx="80" cy="58" rx="6" ry="4" fill={starTheme.cheeksColor} opacity="0.8" />
            <text x="37" y="60" fontSize="5" fill="#FFFFFF" opacity="0.9">✦</text>
            <text x="77" y="60" fontSize="5" fill="#FFFFFF" opacity="0.9">✦</text>
          </g>

          {/* Adorable Expressive Eyes */}
          <g id="star-eyes">
            {expression === 'sleepy' ? (
              <>
                {/* Closed Peaceful Arcs */}
                <path d="M42 50 Q48 56 54 50" stroke={starTheme.eyeColor} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M66 50 Q72 56 78 50" stroke={starTheme.eyeColor} strokeWidth="3.2" strokeLinecap="round" fill="none" />
              </>
            ) : expression === 'celebrating' || expression === 'excited' ? (
              <>
                {/* Happy Joyful Eyes (Closed Happy Arcs with Twinkle) */}
                <path d="M41 52 Q48 44 55 52" stroke={starTheme.eyeColor} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <path d="M65 52 Q72 44 79 52" stroke={starTheme.eyeColor} strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <path d="M41 42 Q48 39 55 42" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M65 42 Q72 39 79 42" stroke="#475569" strokeWidth="2" strokeLinecap="round" fill="none" />
              </>
            ) : expression === 'concerned' ? (
              <>
                {/* Concerned Eyes with Highlights */}
                <circle cx="48" cy="48" r="5" fill={starTheme.eyeColor} />
                <circle cx="46" cy="46" r="1.8" fill="#FFFFFF" />
                <circle cx="72" cy="48" r="5" fill={starTheme.eyeColor} />
                <circle cx="70" cy="46" r="1.8" fill="#FFFFFF" />
                <path d="M41 42 L53 39" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M79 42 L67 39" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" />
              </>
            ) : expression === 'thinking' ? (
              <>
                {/* Inquisitive Starry Eyes */}
                <circle cx="48" cy="46" r="5.2" fill={starTheme.eyeColor} />
                <circle cx="46.5" cy="44" r="2" fill="#FFFFFF" />
                <circle cx="72" cy="46" r="5.2" fill={starTheme.eyeColor} />
                <circle cx="70.5" cy="44" r="2" fill="#FFFFFF" />
                <path d="M42 39 Q48 35 54 40" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                <path d="M66 41 Q72 41 78 41" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" fill="none" />
              </>
            ) : expression === 'proud' ? (
              <>
                {/* Wink & Star pupil */}
                <path d="M42 48 Q48 54 54 48" stroke={starTheme.eyeColor} strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <circle cx="72" cy="48" r="5.2" fill={starTheme.eyeColor} />
                <circle cx="70" cy="46" r="2" fill="#FFFFFF" />
                <circle cx="74" cy="50" r="1" fill="#FFFFFF" />
              </>
            ) : (
              <>
                {/* Radiant Open Anime Eyes with Double Highlights & Star Reflections */}
                <circle cx="48" cy="48" r="5.4" fill={starTheme.eyeColor} />
                <circle cx="46" cy="46" r="2.2" fill="#FFFFFF" />
                <circle cx="50" cy="50" r="1.1" fill="#FFFFFF" />
                
                <circle cx="72" cy="48" r="5.4" fill={starTheme.eyeColor} />
                <circle cx="70" cy="46" r="2.2" fill="#FFFFFF" />
                <circle cx="74" cy="50" r="1.1" fill="#FFFFFF" />

                {/* Soft Eyebrows */}
                <path d="M43 40 Q48 37 53 40" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                <path d="M67 40 Q72 37 77 40" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              </>
            )}
          </g>

          {/* Expressive Mouth */}
          <g id="star-mouth">
            {expression === 'sleepy' ? (
              <ellipse cx="60" cy="58" rx="3.5" ry="4" fill="#334155" />
            ) : expression === 'celebrating' || expression === 'excited' ? (
              <path
                d="M53 56 Q60 68 67 56 Z"
                fill="#EF4444"
                stroke={starTheme.eyeColor}
                strokeWidth="2"
                strokeLinejoin="round"
              />
            ) : expression === 'concerned' ? (
              <path
                d="M53 60 Q56 57 60 60 Q64 63 67 60"
                stroke={starTheme.eyeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : expression === 'thinking' ? (
              <path
                d="M55 58 Q61 59 66 56"
                stroke={starTheme.eyeColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <path
                d="M54 55 Q60 62 66 55"
                stroke={starTheme.eyeColor}
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>

          {/* 10. Equipped Accessories on Star Geometry */}
          {accessory === 'star_pin' && (
            <g id="acc-star-pin">
              <polygon points="60,66 62,71 67,71 63,74 65,79 60,76 55,79 57,74 53,71 58,71" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            </g>
          )}

          {accessory === 'cool_glasses' && (
            <g id="acc-cool-glasses">
              <rect x="38" y="42" width="18" height="11" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="41" y1="44" x2="49" y2="51" stroke="#64748B" strokeWidth="1.2" />
              <rect x="64" y="42" width="18" height="11" rx="3" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
              <line x1="67" y1="44" x2="75" y2="51" stroke="#64748B" strokeWidth="1.2" />
              <line x1="56" y1="47" x2="64" y2="47" stroke="#F59E0B" strokeWidth="2" />
            </g>
          )}

          {accessory === 'wizard_hat' && (
            <g id="acc-wizard-hat">
              <polygon points="60,-8 36,18 84,18" fill="#4338CA" stroke="#818CF8" strokeWidth="1.5" />
              <ellipse cx="60" cy="18" rx="26" ry="6" fill="#3730A3" stroke="#818CF8" strokeWidth="1.5" />
              <polygon points="56,4 58,7 62,7 59,9 60,12 56,10 53,12 54,9 51,7 54,7" fill="#FCD34D" />
            </g>
          )}

          {accessory === 'gamer_headset' && (
            <g id="acc-gamer-headset">
              <path d="M22 38 C22 12, 98 12, 98 38" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="18" y="34" width="8" height="20" rx="4" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" />
              <rect x="94" y="34" width="8" height="20" rx="4" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" />
              <path d="M22 48 Q20 62 36 60" stroke="#0891B2" strokeWidth="2" strokeLinecap="round" fill="none" />
              <circle cx="36" cy="60" r="2.5" fill="#EF4444" />
            </g>
          )}

          {accessory === 'angel_halo' && (
            <g id="acc-angel-halo">
              <ellipse cx="60" cy="6" rx="22" ry="5" stroke="#FCD34D" strokeWidth="3" fill="none" />
              <ellipse cx="60" cy="6" rx="22" ry="5" stroke="#FEF08A" strokeWidth="1.5" fill="none" opacity="0.8" />
            </g>
          )}

          {accessory === 'ninja_band' && (
            <g id="acc-ninja-band">
              <rect x="25" y="30" width="70" height="8" rx="2" fill="#DC2626" />
              <rect x="52" y="31" width="16" height="6" rx="1" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.8" />
              <circle cx="60" cy="34" r="1.5" fill="#1E293B" />
            </g>
          )}

          {accessory === 'cosmic_crown' && (
            <g id="acc-cosmic-crown">
              <polygon points="36,18 42,4 50,12 60,0 70,12 78,4 84,18" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
              <circle cx="60" cy="1" r="2" fill="#EF4444" />
              <circle cx="42" cy="5" r="1.5" fill="#3B82F6" />
              <circle cx="78" cy="5" r="1.5" fill="#10B981" />
              <rect x="36" y="16" width="48" height="4" rx="1" fill="#D97706" />
            </g>
          )}
        </svg>
      </motion.div>

      {/* Optional Color & Mood Indicator Tooltip / Tag */}
      {showColorTooltip && (
        <div className="absolute -bottom-6 inset-x-0 flex justify-center pointer-events-none z-30">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/90 text-white shadow-md backdrop-blur-xs whitespace-nowrap">
            {starTheme.badgeText}
          </span>
        </div>
      )}
    </div>
  );
};
