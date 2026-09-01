import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Flame,
  ArrowRight,
  Filter,
  Check,
  Zap,
  FileText,
  Pin,
  Gift,
  Crown,
} from 'lucide-react';
import {
  Task,
  Note,
  UserProfile,
  NinoDialogue,
  NinoExpression,
  ActiveTab,
} from '../../types';
import { NinoAvatar } from '../NinoAvatar';
import { computePolarisStarColor } from '../../utils/polarisColorEngine';
import { NinoSpeechBubble } from '../NinoSpeechBubble';
import { TaskCard } from '../TaskCard';
import {
  getTodayString,
  formatFullDatePortuguese,
  getDaysOfWeek,
  getMinutesUntil,
  isTaskOverdue,
  addDays,
} from '../../utils/dateUtils';
import { CATEGORIES, THEME_COLORS } from '../../utils/constants';
import { CategoryIcon } from '../CategoryIcon';
import { getLevelProgress, STAGE_CONFIGS } from '../../utils/rewards';

interface HomeViewProps {
  user: UserProfile;
  tasks: Task[];
  notes?: Note[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  ninoDialogue: NinoDialogue;
  ninoExpression: NinoExpression;
  onToggleTaskComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onPostponeTask: (task: Task, days: number) => void;
  onOpenNewTaskModal: () => void;
  onSpeakDialogue: () => void;
  isSpeaking: boolean;
  onRefreshNinoQuote: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onStartFocusTask?: (task: Task) => void;
  onOpenSanctuary?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  tasks,
  notes = [],
  selectedDate,
  onSelectDate,
  ninoDialogue,
  ninoExpression,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onPostponeTask,
  onOpenNewTaskModal,
  onSpeakDialogue,
  isSpeaking,
  onRefreshNinoQuote,
  onNavigateTab,
  onStartFocusTask,
  onOpenSanctuary,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed' | 'high'>('all');

  const today = getTodayString();
  const isSelectedDateToday = selectedDate === today;

  const polarisProg = getLevelProgress(user.polaris?.xp || 0);
  const stageConfig = STAGE_CONFIGS[polarisProg.stage];

  // Filter tasks for selected day
  const dayTasks = tasks.filter((t) => t.date === selectedDate);
  const completedTasks = dayTasks.filter((t) => t.completed);
  const pendingTasks = dayTasks.filter((t) => !t.completed);
  const overdueTasks = dayTasks.filter((t) => isTaskOverdue(t));

  const totalCount = dayTasks.length;
  const completedCount = completedTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Next upcoming task for today
  const nextTask = pendingTasks
    .filter((t) => t.time)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))[0];

  const nextTaskMinutes = nextTask ? getMinutesUntil(nextTask.date, nextTask.time) : null;

  // Filtered tasks display
  const displayedTasks = dayTasks.filter((t) => {
    if (filterMode === 'pending') return !t.completed;
    if (filterMode === 'completed') return t.completed;
    if (filterMode === 'high') return t.priority === 'high' || t.priority === 'urgent';
    return true;
  });

  const weekDays = getDaysOfWeek(selectedDate);
  const themeConfig = THEME_COLORS[user.preferences.ninoColor] || THEME_COLORS.indigo;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-24 overflow-x-hidden min-w-0">
      {/* Top Welcome & Nino Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100/50 via-amber-50/30 to-white dark:from-[#251E18] dark:via-[#1E1914] dark:to-[#171310] border border-orange-100/80 dark:border-amber-950/60 p-4 sm:p-7 shadow-xs w-full max-w-full min-w-0">
        {/* Soft Background Accents */}
        <div
          className="absolute -right-16 -top-16 w-56 h-56 rounded-full blur-3xl opacity-35 pointer-events-none"
          style={{ backgroundColor: themeConfig.primary }}
        />

        {/* Date Headline & Day Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>{isSelectedDateToday ? 'Hoje na sua agenda' : 'Data selecionada'}</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-['Outfit',sans-serif] tracking-tight">
              {formatFullDatePortuguese(new Date(selectedDate + 'T12:00:00'))}
            </h2>
          </div>

          {/* Quick Date Stepper (Prev, Today, Next) */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white/90 dark:bg-[#1D1A16]/90 p-1 rounded-2xl border border-orange-100/90 dark:border-amber-950/70 shadow-xs">
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, -1))}
              className="p-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 transition-colors"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(today)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                isSelectedDateToday
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-amber-950/60'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => onSelectDate(addDays(selectedDate, 1))}
              className="p-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 transition-colors"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Character & Contextual Dialogue Widget */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pt-1 w-full min-w-0">
          {/* Interactive Nino Avatar in Highlight */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <NinoAvatar
              expression={ninoExpression}
              color={user.preferences.ninoColor}
              size="lg"
              stage={user.polaris?.stage || 'baby'}
              accessory={user.polaris?.equippedAccessory || 'none'}
              aura={user.polaris?.equippedAura || 'none'}
              completedTasksCount={completedCount}
              totalTasksCount={totalCount}
              completionPercent={progressPercent}
              onClick={onOpenSanctuary || onRefreshNinoQuote}
            />
            <button
              type="button"
              onClick={onOpenSanctuary || onRefreshNinoQuote}
              className="mt-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              Polaris • Nv. {polarisProg.level} ✨
            </button>
            <span
              className="mt-0.5 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/50 text-center shadow-2xs"
              title={computePolarisStarColor({
                expression: ninoExpression,
                completedTasksCount: completedCount,
                totalTasksCount: totalCount,
                completionPercent: progressPercent,
                preferredColor: user.preferences.ninoColor,
              }).reason}
            >
              {
                computePolarisStarColor({
                  expression: ninoExpression,
                  completedTasksCount: completedCount,
                  totalTasksCount: totalCount,
                  completionPercent: progressPercent,
                  preferredColor: user.preferences.ninoColor,
                }).badgeText
              }
            </span>
          </div>

          {/* Nino Speech Bubble */}
          <div className="flex-1 w-full min-w-0 flex flex-col justify-center">
            <NinoSpeechBubble
              dialogue={ninoDialogue}
              personality={user.preferences.ninoPersonality}
              onSpeak={onSpeakDialogue}
              isSpeaking={isSpeaking}
              onRefreshQuote={onRefreshNinoQuote}
              onQuickAction={onOpenNewTaskModal}
            />
          </div>
        </div>

        {/* Polaris Level & XP Evolution Strip */}
        <div className="mt-4 pt-3.5 border-t border-orange-100/80 dark:border-amber-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white/70 dark:bg-[#1D1A16]/70 p-3 sm:p-3.5 rounded-2xl w-full min-w-0">
          <div className="flex items-center gap-2.5 flex-1 w-full min-w-0 sm:w-auto">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold mb-1">
                <span className="text-slate-800 dark:text-slate-200 truncate">
                  {stageConfig.badge} • Nível {polarisProg.level}
                </span>
                <span className="text-orange-600 dark:text-amber-400 shrink-0">
                  {polarisProg.xpInCurrentLevel}/{polarisProg.xpNeededForNext} XP ({polarisProg.percent}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${polarisProg.percent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto shrink-0">
            <div className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 text-[11px] font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-amber-500 text-amber-500" />
              <span>{user.polaris?.stardust || 0} Cristais</span>
            </div>

            {onOpenSanctuary && (
              <button
                type="button"
                onClick={onOpenSanctuary}
                className="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-bold shadow-xs hover:from-orange-600 hover:to-amber-600 active:scale-95 transition-all flex items-center gap-1"
              >
                <Gift className="w-3 h-3" />
                Santuário
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Mini Week Strip */}
        <div className="mt-4 pt-3 border-t border-orange-100/80 dark:border-amber-950/60 grid grid-cols-7 gap-1 sm:gap-1.5 w-full min-w-0">
          {weekDays.map((w) => {
            const isSelected = w.dateStr === selectedDate;
            const hasTasks = tasks.some((t) => t.date === w.dateStr);
            const allDone = hasTasks && tasks.filter((t) => t.date === w.dateStr).every((t) => t.completed);

            return (
              <button
                key={w.dateStr}
                type="button"
                onClick={() => onSelectDate(w.dateStr)}
                className={`w-full py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center transition-all min-w-0 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold shadow-md shadow-orange-500/25 scale-[1.02]'
                    : 'bg-white/80 dark:bg-[#1D1A16]/80 hover:bg-white dark:hover:bg-[#251E18] text-slate-700 dark:text-slate-300 border border-orange-100/70 dark:border-amber-950/50'
                }`}
              >
                <span className={`text-[9px] sm:text-[10px] font-semibold uppercase truncate ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                  {w.dayName.slice(0, 3)}
                </span>
                <span className="text-xs sm:text-base font-extrabold mt-0.5">{w.dayNum}</span>
                {/* Dot for tasks indicator */}
                <div className="h-1.5 mt-0.5 sm:mt-1 flex items-center justify-center">
                  {allDone ? (
                    <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-emerald-400" />
                  ) : hasTasks ? (
                    <span className={`w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full ${isSelected ? 'bg-yellow-200' : 'bg-orange-500'}`} />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-transparent" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Progress & Next Appointment Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily Progress Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1D1A16]/90 border border-orange-100/80 dark:border-amber-950/60 shadow-xs flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Progresso do dia</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {completedCount} de {totalCount} concluídas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalCount === 0
                ? 'Nenhuma tarefa programada'
                : progressPercent === 100
                ? 'Todas as tarefas concluídas! 🎉'
                : `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa pendente' : 'tarefas pendentes'}`}
            </p>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-orange-50 dark:text-amber-950/40"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-800 dark:text-slate-100">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Next Upcoming Task Card */}
        <div className="p-5 rounded-3xl bg-white/90 dark:bg-[#1D1A16]/90 border border-orange-100/80 dark:border-amber-950/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">
              <Clock className="w-3.5 h-3.5" />
              Próximo Compromisso
            </span>
            {nextTask && nextTaskMinutes !== null && nextTaskMinutes > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 animate-pulse border border-amber-200/50">
                Em {nextTaskMinutes} min
              </span>
            )}
          </div>

          {nextTask ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                  {nextTask.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {nextTask.time}
                  </span>
                  <span>•</span>
                  <span>{CATEGORIES[nextTask.category]?.name || 'Geral'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {onStartFocusTask && (
                  <button
                    type="button"
                    onClick={() => onStartFocusTask(nextTask)}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-orange-100/80 hover:bg-orange-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/70 text-orange-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all"
                    title="Iniciar foco com Polaris nesta tarefa"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Focar
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onToggleTaskComplete(nextTask)}
                  className="flex-shrink-0 p-2 rounded-xl bg-orange-50 dark:bg-amber-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 hover:text-emerald-600 transition-colors"
                  title="Concluir este compromisso"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic py-2">
              Nenhum compromisso pendente com horário fixo para hoje.
            </div>
          )}
        </div>
      </section>

      {/* Quick Focus Mode Launcher Banner */}
      {pendingTasks.length > 0 && onStartFocusTask && (
        <section className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-orange-100 bg-white/15 px-2 py-0.5 rounded-full">
                  Produtividade Polaris
                </span>
                <span className="text-xs text-orange-100 font-medium">🔕 Sem Notificações</span>
              </div>
              <h4 className="text-base font-black font-['Outfit',sans-serif] mt-0.5">
                Precisa de Concentração Total?
              </h4>
              <p className="text-xs text-orange-100 font-medium">
                Ative o cronômetro visual do Polaris com mensagens motivacionais e silêncio absoluto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onStartFocusTask(nextTask || pendingTasks[0])}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 active:scale-95 text-xs sm:text-sm font-black shadow-md shadow-black/10 transition-all flex items-center justify-center gap-2 flex-shrink-0"
          >
            <Zap className="w-4 h-4 fill-orange-600" />
            Ativar Modo Foco
          </button>
        </section>
      )}

      {/* Today's Tasks Section Header & Filter Tabs */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              Tarefas do Dia ({displayedTasks.length})
            </h3>
            {overdueTasks.length > 0 && isSelectedDateToday && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 flex items-center gap-1 border border-rose-200/60">
                <AlertCircle className="w-3 h-3" />
                {overdueTasks.length} atrasada(s)
              </span>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-orange-50/80 dark:bg-[#1D1A16] border border-orange-100/80 dark:border-amber-950/60 p-1 rounded-2xl text-xs font-semibold overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl transition-all ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-[#2A241E] text-orange-700 dark:text-orange-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
              }`}
            >
              Todas ({dayTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-xl transition-all ${
                filterMode === 'pending'
                  ? 'bg-white dark:bg-[#2A241E] text-orange-700 dark:text-orange-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
              }`}
            >
              Pendentes ({pendingTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1 rounded-xl transition-all ${
                filterMode === 'completed'
                  ? 'bg-white dark:bg-[#2A241E] text-orange-700 dark:text-orange-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
              }`}
            >
              Feitas ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('high')}
              className={`px-3 py-1 rounded-xl transition-all ${
                filterMode === 'high'
                  ? 'bg-white dark:bg-[#2A241E] text-orange-700 dark:text-orange-300 font-bold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
              }`}
            >
              Prioridades
            </button>
          </div>
        </div>

        {/* Task Cards List */}
        {displayedTasks.length > 0 ? (
          <div className="space-y-2.5">
            <AnimatePresence>
              {displayedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleComplete={onToggleTaskComplete}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onPostpone={onPostponeTask}
                  onStartFocus={onStartFocusTask}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-10 px-4 rounded-3xl border-2 border-dashed border-orange-200/80 dark:border-amber-950/60 bg-white/60 dark:bg-[#1D1A16]/50">
            <div className="w-16 h-16 mx-auto mb-3 opacity-90">
              <NinoAvatar expression="happy" size="md" interactive={false} color={user.preferences.ninoColor} />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              {filterMode === 'completed'
                ? 'Nenhuma tarefa concluída ainda'
                : 'Nenhuma tarefa para este dia'}
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              {filterMode === 'completed'
                ? 'Marque uma tarefa como feita para vê-la aqui e ganhar parabéns do Polaris!'
                : 'Que tal planejar algo novo? Toque no botão abaixo para adicionar.'}
            </p>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Adicionar Tarefa
            </button>
          </div>
        )}
      </section>

      {/* Quick Notes Section */}
      <section className="p-5 sm:p-6 rounded-3xl bg-white/90 dark:bg-[#1D1A16]/90 border border-orange-100/80 dark:border-amber-950/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-amber-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Minhas Notas Rápidas
              </h3>
              <p className="text-xs text-slate-400">
                {notes.length} {notes.length === 1 ? 'anotação disponível' : 'anotações disponíveis'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('notes')}
            className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-amber-950/50 hover:bg-orange-100 dark:hover:bg-amber-900/60 text-orange-600 dark:text-amber-400 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {notes.slice(0, 2).map((note) => (
              <div
                key={note.id}
                onClick={() => onNavigateTab('notes')}
                className="p-4 rounded-2xl bg-orange-50/40 dark:bg-[#251E18] border border-orange-100/80 dark:border-amber-950/70 hover:border-orange-300 dark:hover:border-amber-800 transition-all cursor-pointer text-left group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                    {note.title || 'Sem título'}
                  </h4>
                  {note.isPinned && (
                    <Pin className="w-3 h-3 text-orange-500 fill-orange-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {note.content || 'Sem texto adicional...'}
                </p>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold group-hover:translate-x-0.5 transition-transform">
                    Editar ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <button
              type="button"
              onClick={() => onNavigateTab('notes')}
              className="inline-flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar minha primeira anotação no Polaris
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
