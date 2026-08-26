import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  BellOff,
  Sparkles,
  Flame,
  Clock,
  Target,
  Trophy,
  ArrowRight,
  Plus,
  RefreshCw,
  Award,
  Zap,
} from 'lucide-react';
import { Task, UserProfile, NinoExpression, NinoPersonality } from '../types';
import { NinoAvatar } from './NinoAvatar';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORIES } from '../utils/constants';
import { soundManager } from '../utils/sound';
import { speechService } from '../utils/speech';
import { getPolarisFocusMessage } from '../utils/ninoBrain';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  user?: UserProfile;
  userName?: string;
  personality?: NinoPersonality;
  onCompleteTask?: (task: Task) => void;
  onCompleteSession?: (taskId?: string, minutesFocused?: number) => void;
  allTasks?: Task[];
  availableTasks?: Task[];
  onSelectTask?: (task: Task) => void;
}

const DURATION_PRESETS = [
  { label: '15 min', value: 15, desc: 'Foco Rápido' },
  { label: '25 min', value: 25, desc: 'Pomodoro' },
  { label: '45 min', value: 45, desc: 'Foco Profundo' },
  { label: '60 min', value: 60, desc: 'Maratona' },
];

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  task,
  user,
  userName: propUserName,
  onCompleteTask,
  onCompleteSession,
  allTasks = [],
  availableTasks,
  onSelectTask,
}) => {
  const effectiveUserName = user?.name || propUserName || 'Amigo';
  const effectiveStreak = user?.streakDays ?? 1;
  const effectiveNinoColor = user?.preferences?.ninoColor || 'orange';
  const effectiveVoiceEnabled = user?.preferences?.voiceEnabled ?? true;
  const effectiveTaskList = availableTasks || allTasks || [];

  // Mode step: 'setup' | 'running' | 'summary'
  const [step, setStep] = useState<'setup' | 'running' | 'summary'>('setup');
  const [selectedDuration, setSelectedDuration] = useState<number>(() => {
    return task?.estimatedMinutes ? Math.min(Math.max(task.estimatedMinutes, 5), 120) : 25;
  });
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // Active Timer state
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [ambientSound, setAmbientSound] = useState<'none' | 'whitenoise' | 'waves'>('none');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Stats gathered for summary
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  const [taskMarkedDone, setTaskMarkedDone] = useState<boolean>(false);

  // Motivational dialogue from Polaris
  const [polarisQuote, setPolarisQuote] = useState<{ text: string; expression: NinoExpression }>(() => ({
    text: `Olá, ${effectiveUserName}! Eu sou o Polaris, seu guardião do foco. Vamos mergulhar nessa tarefa! ✨`,
    expression: 'excited',
  }));

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Active task object
  const activeTask = task || (effectiveTaskList.find((t) => !t.completed) || null);
  const categoryConfig = activeTask ? CATEGORIES[activeTask.category] || CATEGORIES.other : CATEGORIES.work;

  // Reset when opening modal with a new task
  useEffect(() => {
    if (isOpen) {
      const initialMinutes = activeTask?.estimatedMinutes ? Math.min(Math.max(activeTask.estimatedMinutes, 5), 120) : 25;
      setSelectedDuration(initialMinutes);
      setTotalSeconds(initialMinutes * 60);
      setSecondsRemaining(initialMinutes * 60);
      setStep('setup');
      setIsActive(false);
      setIsPaused(false);
      setTimeSpentSeconds(0);
      setTaskMarkedDone(activeTask ? activeTask.completed : false);
      setAmbientSound('none');
      
      const initialMessage = getPolarisFocusMessage({
        taskTitle: activeTask?.title || 'Foco Personalizado',
        userName: effectiveUserName,
        progressPercent: 0,
        secondsRemaining: initialMinutes * 60,
        isPaused: false,
        isCompleted: false,
      });
      setPolarisQuote(initialMessage);
    } else {
      soundManager.stopAmbient();
      speechService.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, activeTask, effectiveUserName]);

  // Update Polaris quote when progress passes significant thresholds
  const updatePolarisMessage = useCallback(
    (currentSecs: number, totalSecs: number, paused: boolean, completed: boolean) => {
      const percent = totalSecs > 0 ? Math.round(((totalSecs - currentSecs) / totalSecs) * 100) : 0;
      const msg = getPolarisFocusMessage({
        taskTitle: activeTask?.title || 'sua meta',
        userName: effectiveUserName,
        progressPercent: percent,
        secondsRemaining: currentSecs,
        isPaused: paused,
        isCompleted: completed,
      });
      setPolarisQuote(msg);
      if (effectiveVoiceEnabled && !isMuted) {
        speechService.speak(msg.text);
      }
    },
    [activeTask, effectiveUserName, effectiveVoiceEnabled, isMuted]
  );

  // Timer Tick Engine
  useEffect(() => {
    if (isActive && !isPaused && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            // Timer completed!
            clearInterval(timerRef.current as NodeJS.Timeout);
            handleSessionComplete();
            return 0;
          }
          const nextVal = prev - 1;
          setTimeSpentSeconds((t) => t + 1);

          // Change quote on landmark percentages (75% remaining, 50% remaining, 15% remaining)
          const elapsed = totalSeconds - nextVal;
          if (elapsed === Math.floor(totalSeconds * 0.25) || elapsed === Math.floor(totalSeconds * 0.5) || elapsed === Math.floor(totalSeconds * 0.85)) {
            updatePolarisMessage(nextVal, totalSeconds, false, false);
          }

          return nextVal;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, secondsRemaining, totalSeconds, updatePolarisMessage]);

  // Start Focus Session
  const handleStartFocus = () => {
    const duration = customMinutes ? Math.max(Number(customMinutes), 1) : selectedDuration;
    const secs = duration * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
    setTimeSpentSeconds(0);
    setIsActive(true);
    setIsPaused(false);
    setStep('running');

    soundManager.playFocusStart();
    updatePolarisMessage(secs, secs, false, false);

    if (ambientSound !== 'none') {
      soundManager.startAmbient(ambientSound);
    }
  };

  // Pause / Resume Toggle
  const handleTogglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    soundManager.playPop();

    if (nextPaused) {
      soundManager.stopAmbient();
    } else if (ambientSound !== 'none') {
      soundManager.startAmbient(ambientSound);
    }

    updatePolarisMessage(secondsRemaining, totalSeconds, nextPaused, false);
  };

  // Add +5 Minutes
  const handleAddFiveMinutes = () => {
    soundManager.playPop();
    setTotalSeconds((prev) => prev + 300);
    setSecondsRemaining((prev) => prev + 300);
    setPolarisQuote({
      text: `+5 minutos adicionados! Foco e perseverança valem ouro, ${effectiveUserName}! ⏳✨`,
      expression: 'proud',
    });
  };

  // Switch Ambient Sound
  const handleToggleAmbient = (sound: 'none' | 'whitenoise' | 'waves') => {
    setAmbientSound(sound);
    if (isActive && !isPaused) {
      if (sound === 'none') {
        soundManager.stopAmbient();
      } else {
        soundManager.startAmbient(sound);
      }
    }
    soundManager.playPop();
  };

  // Session Completed naturally (timer hit 0)
  const handleSessionComplete = () => {
    setIsActive(false);
    setIsPaused(false);
    soundManager.stopAmbient();
    soundManager.playFocusComplete();
    setStep('summary');

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#F97316', '#FBBF24', '#38BDF8', '#10B981', '#A855F7'],
    });

    const finishMessage = getPolarisFocusMessage({
      taskTitle: activeTask?.title || 'sua meta',
      userName: effectiveUserName,
      progressPercent: 100,
      secondsRemaining: 0,
      isPaused: false,
      isCompleted: true,
    });
    setPolarisQuote(finishMessage);

    if (effectiveVoiceEnabled && !isMuted) {
      speechService.speak(finishMessage.text);
    }
  };

  // Manually finish session and mark complete
  const handleFinishEarlyAndComplete = () => {
    soundManager.stopAmbient();
    if (activeTask && !activeTask.completed) {
      if (onCompleteTask) onCompleteTask(activeTask);
      if (onCompleteSession) onCompleteSession(activeTask.id, Math.max(Math.round(timeSpentSeconds / 60), 1));
      setTaskMarkedDone(true);
    } else if (onCompleteSession) {
      onCompleteSession(undefined, Math.max(Math.round(timeSpentSeconds / 60), 1));
    }
    handleSessionComplete();
  };

  // Mark task done inside summary
  const handleMarkTaskDoneInSummary = () => {
    if (activeTask && !taskMarkedDone) {
      if (onCompleteTask) onCompleteTask(activeTask);
      if (onCompleteSession) onCompleteSession(activeTask.id, Math.max(Math.round(timeSpentSeconds / 60), 1));
      setTaskMarkedDone(true);
      soundManager.playSuccess();
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  };

  // Refresh Quote on Click
  const handleRefreshQuote = () => {
    soundManager.playPop();
    const percent = totalSeconds > 0 ? Math.round(((totalSeconds - secondsRemaining) / totalSeconds) * 100) : 0;
    const msg = getPolarisFocusMessage({
      taskTitle: activeTask?.title || 'sua meta',
      userName: effectiveUserName,
      progressPercent: percent,
      secondsRemaining,
      isPaused,
      isCompleted: step === 'summary',
    });
    setPolarisQuote(msg);
    if (effectiveVoiceEnabled && !isMuted) {
      speechService.speak(msg.text);
    }
  };

  // Format Time Helper MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress percentage (0 to 1) for circular SVG
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsRemaining) / totalSeconds : 0;
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop with Soft Dark Warm Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (step === 'setup' || step === 'summary') onClose();
          }}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl transition-all"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-2xl bg-[#FFFDF9] dark:bg-[#1A1612] rounded-3xl shadow-2xl border border-orange-200/90 dark:border-amber-950/80 overflow-hidden z-10 my-auto text-slate-800 dark:text-slate-100"
        >
          {/* Header Banner - Shows "Modo Foco & Silêncio Ativo" */}
          <div className="px-5 sm:px-6 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-200 fill-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-100">
                  <span>Modo Foco Polaris</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                    <BellOff className="w-2.5 h-2.5" />
                    Silencioso Ativo
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold truncate max-w-xs sm:max-w-md">
                  {activeTask ? activeTask.title : 'Foco Livre'}
                </h3>
              </div>
            </div>

            {/* Close / Exit button */}
            <button
              type="button"
              onClick={() => {
                soundManager.stopAmbient();
                onClose();
              }}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 hover:text-white transition-colors"
              title="Fechar Modo Foco"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Section based on current step */}
          <div className="p-5 sm:p-7">
            {/* STEP 1: SETUP & CONFIGURATION */}
            {step === 'setup' && (
              <div className="space-y-6">
                {/* Task Selection or Display */}
                <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-[#251E18]/60 border border-orange-100 dark:border-amber-950/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" />
                      Tarefa para Foco
                    </span>
                    {activeTask && (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryConfig.bgLight} ${categoryConfig.bgDark} ${categoryConfig.textLight} ${categoryConfig.borderLight}`}
                      >
                        <CategoryIcon category={activeTask.category} className="w-3 h-3" />
                        {activeTask.customCategoryName || categoryConfig.name}
                      </span>
                    )}
                  </div>

                  {activeTask ? (
                    <div>
                      <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100">
                        {activeTask.title}
                      </h4>
                      {activeTask.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                          {activeTask.description}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                      Nenhuma tarefa específica selecionada. Você estará em uma sessão de foco livre!
                    </p>
                  )}

                  {/* Task Switcher dropdown if multiple tasks exist */}
                  {allTasks.length > 1 && onSelectTask && (
                    <div className="pt-2 border-t border-orange-100/80 dark:border-amber-950/60 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Trocar tarefa:</span>
                      <select
                        value={activeTask?.id || ''}
                        onChange={(e) => {
                          const found = allTasks.find((t) => t.id === e.target.value);
                          if (found) onSelectTask(found);
                        }}
                        className="text-xs font-bold px-2.5 py-1 rounded-xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-[#1D1A16] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400 max-w-[200px] truncate"
                      >
                        {allTasks
                          .filter((t) => !t.completed)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Duration Picker */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Definir Duração do Foco
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {DURATION_PRESETS.map((preset) => {
                      const isSelected = selectedDuration === preset.value && !customMinutes;
                      return (
                        <button
                          key={preset.value}
                          type="button"
                          onClick={() => {
                            setSelectedDuration(preset.value);
                            setCustomMinutes('');
                            soundManager.playPop();
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            isSelected
                              ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-[#2E241C] dark:to-[#241C15] shadow-xs ring-2 ring-orange-500/20'
                              : 'border-orange-100 dark:border-amber-950/70 bg-white dark:bg-[#1D1A16] hover:border-orange-200'
                          }`}
                        >
                          <span
                            className={`block text-base font-black ${
                              isSelected ? 'text-orange-600 dark:text-orange-400' : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {preset.label}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-medium">{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Minutes Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-slate-500 font-medium">Ou tempo customizado:</span>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      placeholder="Ex: 35"
                      value={customMinutes}
                      onChange={(e) => {
                        setCustomMinutes(e.target.value);
                        if (e.target.value) {
                          setSelectedDuration(Number(e.target.value));
                        }
                      }}
                      className="w-20 px-3 py-1 rounded-xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-[#1D1A16] text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                    />
                    <span className="text-xs text-slate-500">minutos</span>
                  </div>
                </div>

                {/* Ambient Sound Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Som Ambiente de Concentração
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'Silêncio' },
                      { id: 'whitenoise', label: 'Ruído Branco' },
                      { id: 'waves', label: 'Ondas Relax' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleAmbient(s.id as 'none' | 'whitenoise' | 'waves')}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                          ambientSound === s.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-amber-950/50 text-orange-700 dark:text-orange-300 shadow-xs'
                            : 'border-orange-100 dark:border-amber-950/70 bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Polaris Welcome Dialogue */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-[#251E18] dark:to-[#1E1813] border border-amber-200/60 dark:border-amber-900/40">
                  <div className="w-14 h-14 flex-shrink-0">
                    <NinoAvatar
                      expression={polarisQuote.expression}
                      size="sm"
                      interactive={false}
                      color={effectiveNinoColor}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-black text-orange-600 dark:text-amber-400 uppercase tracking-wider block">
                      Polaris (Guardião do Foco)
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {polarisQuote.text}
                    </p>
                  </div>
                </div>

                {/* Start Focus Button */}
                <button
                  type="button"
                  onClick={handleStartFocus}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-sm sm:text-base shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-white" />
                  Iniciar Modo Foco ({customMinutes || selectedDuration} min)
                </button>
              </div>
            )}

            {/* STEP 2: RUNNING ACTIVE FOCUS SESSION */}
            {step === 'running' && (
              <div className="flex flex-col items-center space-y-6">
                {/* Circular Timer Visualizer */}
                <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
                    {/* Background Track Circle */}
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      className="stroke-orange-100 dark:stroke-amber-950/60"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Glowing Animated Progress Circle */}
                    <motion.circle
                      cx="120"
                      cy="120"
                      r={radius}
                      stroke="url(#focus-gradient)"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transition={{ duration: 0.5, ease: 'linear' }}
                    />
                    <defs>
                      <linearGradient id="focus-gradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#FBBF24" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Inner Timer Display */}
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                      {formatTime(secondsRemaining)}
                    </span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400 mt-1 uppercase tracking-wider flex items-center gap-1">
                      {isPaused ? 'Pausado' : 'Foco Ativo'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {Math.round(progressRatio * 100)}% concluído
                    </span>
                  </div>
                </div>

                {/* Polaris Motivational Speech Bubble Card */}
                <div className="w-full p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-orange-50/80 via-amber-50/50 to-white dark:from-[#251E18] dark:via-[#1E1914] dark:to-[#171310] border border-orange-200/80 dark:border-amber-900/50 shadow-xs flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <NinoAvatar
                      expression={polarisQuote.expression}
                      size="md"
                      interactive={true}
                      onClick={handleRefreshQuote}
                      color={effectiveNinoColor}
                      completionPercent={Math.round(progressRatio * 100)}
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-orange-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Polaris diz:
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshQuote}
                        className="text-[11px] text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1"
                        title="Nova frase motivacional"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Outra frase
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-semibold leading-relaxed">
                      "{polarisQuote.text}"
                    </p>
                  </div>
                </div>

                {/* Timer Controls Row */}
                <div className="w-full flex items-center justify-center gap-3 flex-wrap">
                  {/* Pause / Resume */}
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-xs ${
                      isPaused
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                        : 'bg-white dark:bg-[#1D1A16] border border-orange-200 dark:border-amber-900 text-slate-700 dark:text-slate-200 hover:border-orange-400'
                    }`}
                  >
                    {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
                    {isPaused ? 'Retomar Foco' : 'Pausar'}
                  </button>

                  {/* Add 5 min */}
                  <button
                    type="button"
                    onClick={handleAddFiveMinutes}
                    className="px-4 py-2.5 rounded-2xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-[#1D1A16] hover:border-orange-400 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-orange-500" />
                    +5 min
                  </button>

                  {/* Complete Task & Finish Session */}
                  <button
                    type="button"
                    onClick={handleFinishEarlyAndComplete}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Concluir Tarefa & Finalizar
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: SUMMARY & PROGRESS REPORT */}
            {step === 'summary' && (
              <div className="space-y-6">
                {/* Header Victory Card */}
                <div className="text-center p-6 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 text-white shadow-xl shadow-orange-500/20 space-y-3 relative overflow-hidden">
                  <div className="w-20 h-20 mx-auto">
                    <NinoAvatar
                      expression="celebrating"
                      size="md"
                      interactive={false}
                      color={effectiveNinoColor}
                    />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md mb-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-200" />
                      Sessão de Foco Finalizada!
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif]">
                      Parabéns pela Dedicação, {effectiveUserName}!
                    </h3>
                    <p className="text-xs sm:text-sm text-orange-50 font-medium max-w-md mx-auto mt-1">
                      {polarisQuote.text}
                    </p>
                  </div>
                </div>

                {/* Progress Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Metric 1: Time Focused */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-orange-500 mb-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Tempo Focado</span>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {Math.max(Math.round(timeSpentSeconds / 60), 1)} min
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">100% livre de distrações</span>
                  </div>

                  {/* Metric 2: XP / Focus Stars */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-amber-500 mb-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Estrelas Polaris</span>
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                      +{Math.max(Math.round(timeSpentSeconds / 60) * 10, 50)} XP
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Foco acumulado</span>
                  </div>

                  {/* Metric 3: Streak */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between text-rose-500 mb-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sequência</span>
                      <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                    </div>
                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                      {effectiveStreak} dias
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Rotina protegida</span>
                  </div>
                </div>

                {/* Task Status Card & Action */}
                {activeTask && (
                  <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-[#251E18]/60 border border-orange-100 dark:border-amber-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Tarefa Trabalhada:
                      </span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        {activeTask.title}
                      </h4>
                    </div>

                    {!taskMarkedDone ? (
                      <button
                        type="button"
                        onClick={handleMarkTaskDoneInSummary}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Marcar como Concluída
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900">
                        <CheckCircle2 className="w-4 h-4" />
                        Tarefa Concluída com Sucesso!
                      </span>
                    )}
                  </div>
                )}

                {/* Final Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('setup');
                    }}
                    className="flex-1 py-3 rounded-2xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-[#1D1A16] hover:bg-orange-50/60 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition-all"
                  >
                    Fazer Nova Sessão de Foco
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.stopAmbient();
                      onClose();
                    }}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    Voltar para a Agenda
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
