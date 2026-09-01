import React from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  CheckCircle2,
  Trophy,
  Target,
  BarChart3,
  Calendar,
  Sparkles,
  Award,
  Zap,
  TrendingUp,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, UserProfile } from '../../types';
import { CATEGORIES, THEME_COLORS } from '../../utils/constants';
import { CategoryIcon } from '../CategoryIcon';
import { getTodayString, getDaysOfWeek } from '../../utils/dateUtils';
import { NinoAvatar } from '../NinoAvatar';
import { soundManager } from '../../utils/sound';

interface StatsViewProps {
  user: UserProfile;
  tasks: Task[];
  onTriggerCelebration?: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  user,
  tasks,
}) => {
  const today = getTodayString();
  const themeConfig = THEME_COLORS[user.preferences.ninoColor] || THEME_COLORS.indigo;

  // Stats Calculations
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayTotal = todayTasks.length;
  const todayPending = todayTotal - todayCompleted;
  const todayPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  const allCompletedTasks = tasks.filter((t) => t.completed);
  const totalCompletedCount = allCompletedTasks.length;
  const totalTasksCount = tasks.length;

  // Weekly breakdown
  const currentWeekDays = getDaysOfWeek(today);
  const weeklyData = currentWeekDays.map((w) => {
    const dayTasks = tasks.filter((t) => t.date === w.dateStr);
    const completed = dayTasks.filter((t) => t.completed).length;
    const total = dayTasks.length;
    return {
      ...w,
      completed,
      total,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const weeklyCompletedTotal = weeklyData.reduce((acc, d) => acc + d.completed, 0);
  const weeklyGoal = user.preferences.dailyGoal * 7; // e.g. 35 tasks per week
  const weeklyGoalPercent = Math.min(100, Math.round((weeklyCompletedTotal / (weeklyGoal || 1)) * 100));

  // Category Distribution
  const categoryStats = (Object.keys(CATEGORIES) as (keyof typeof CATEGORIES)[]).map((catKey) => {
    const count = tasks.filter((t) => t.category === catKey && t.completed).length;
    return {
      catKey,
      config: CATEGORIES[catKey],
      count,
    };
  }).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);

  // Trigger Fun Confetti Celebration
  const handleCelebrate = () => {
    soundManager.playCelebration();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F97316', '#FBBF24', '#10B981', '#F43F5E'],
    });
  };

  // Badges Earned
  const badges = [
    {
      id: 'streak',
      title: 'Chama Viva',
      desc: '4+ dias consecutivos organizados',
      icon: Flame,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
      earned: user.streakDays >= 3,
    },
    {
      id: 'focus',
      title: 'Foco Total',
      desc: 'Concluiu 5+ tarefas em um dia',
      icon: Zap,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800',
      earned: todayCompleted >= 2 || totalCompletedCount >= 5,
    },
    {
      id: 'goal',
      title: 'Meta Batida',
      desc: '100% das tarefas do dia feitas',
      icon: Trophy,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
      earned: todayTotal > 0 && todayCompleted === todayTotal,
    },
    {
      id: 'master',
      title: 'Mestre da Agenda',
      desc: '10+ tarefas concluídas no total',
      icon: Award,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800',
      earned: totalCompletedCount >= 5,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 sm:space-y-6 pb-24 overflow-x-hidden min-w-0">
      {/* Top Banner with Nino & Performance Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-amber-600 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6 w-full min-w-0">
        <div className="space-y-2 text-center sm:text-left z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-100" />
            Central de Desempenho & Conquistas
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] tracking-tight">
            Você está no caminho certo, {user.name}!
          </h2>
          <p className="text-xs sm:text-sm text-orange-50/95 max-w-md font-medium">
            O Polaris acompanha sua disciplina e comemora cada passo conquistado na sua rotina.
          </p>

          <button
            type="button"
            onClick={handleCelebrate}
            className="mt-2 px-4 py-2 rounded-2xl bg-white text-orange-700 font-bold text-xs shadow-md hover:bg-orange-50 active:scale-95 transition-all inline-flex items-center gap-1.5"
          >
            🎉 Comemorar com o Polaris!
          </button>
        </div>

        <div className="flex-shrink-0 z-10">
          <NinoAvatar
            expression={todayPercent >= 75 ? 'celebrating' : 'proud'}
            color={user.preferences.ninoColor}
            size="lg"
            stage={user.polaris?.stage || 'baby'}
            accessory={user.polaris?.equippedAccessory || 'none'}
            aura={user.polaris?.equippedAura || 'none'}
            completedTasksCount={todayCompleted}
            totalTasksCount={todayTotal}
            completionPercent={todayPercent}
            onClick={handleCelebrate}
          />
        </div>

        {/* Glow circles */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-amber-300/25 blur-2xl pointer-events-none" />
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Metric 1: Streak */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sequência</span>
            <Flame className="w-5 h-5 fill-amber-500" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {user.streakDays}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1">dias</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Dias seguidos de organização</p>
        </div>

        {/* Metric 2: Today Completed */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Hoje</span>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {todayCompleted}/{todayTotal}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{todayPercent}% do dia realizado</p>
        </div>

        {/* Metric 3: Today Pending */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-500 mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pendentes</span>
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {todayPending}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1">tarefas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Ainda para finalizar hoje</p>
        </div>

        {/* Metric 4: Lifetime Total */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Geral</span>
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {totalCompletedCount}
            </span>
            <span className="text-xs font-bold text-slate-400 ml-1">feitas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Histórico acumulado</p>
        </div>
      </div>

      {/* Weekly Goal & Bar Chart Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Weekly Chart */}
        <div className="sm:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Produtividade da Semana
              </h3>
              <p className="text-xs text-slate-400">Tarefas concluídas por dia</p>
            </div>
            <span className="text-xs font-bold text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-orange-100 dark:border-amber-900/40">
              {weeklyCompletedTotal} concluídas
            </span>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="h-44 pt-6 flex items-end justify-between gap-2 border-b border-orange-100/70 dark:border-amber-950/60 pb-2">
            {weeklyData.map((d) => {
              const maxScale = Math.max(...weeklyData.map((w) => w.total), 4);
              const heightPercent = d.total > 0 ? Math.round((d.completed / maxScale) * 100) : 6;

              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="relative w-full flex justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded shadow">
                      {d.completed}/{d.total}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-xl bg-orange-100/70 dark:bg-[#251E18] h-28 flex items-end overflow-hidden"
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPercent}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`w-full rounded-t-xl transition-colors ${
                          d.isToday ? 'bg-gradient-to-t from-orange-500 to-amber-500' : 'bg-orange-400/80 group-hover:bg-orange-500'
                        }`}
                      />
                    </div>
                  </div>

                  <span
                    className={`text-[11px] font-bold uppercase ${
                      d.isToday ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
                    }`}
                  >
                    {d.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Goal Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase mb-1">
              <Target className="w-4 h-4" />
              Meta Semanal
            </div>
            <h4 className="text-xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              {weeklyCompletedTotal} de {weeklyGoal} tarefas
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Meta baseada no seu objetivo diário de {user.preferences.dailyGoal} tarefas/dia.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-500">Progresso da meta</span>
              <span className="text-orange-600 dark:text-orange-400">{weeklyGoalPercent}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-orange-100/70 dark:bg-[#251E18] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weeklyGoalPercent}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown & Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
            Distribuição por Categoria
          </h3>
          <p className="text-xs text-slate-400 mb-3">Onde seu tempo tem sido mais investido</p>

          <div className="space-y-2.5">
            {categoryStats.length > 0 ? (
              categoryStats.map((c) => (
                <div key={c.catKey} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: c.config.color }}
                    >
                      <CategoryIcon category={c.catKey} className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {c.config.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-500">
                    {c.count} {c.count === 1 ? 'concluída' : 'concluídas'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">
                Conclua mais tarefas para gerar o relatório por categorias.
              </p>
            )}
          </div>
        </div>

        {/* Badges / Conquistas */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
            Medalhas do Polaris
          </h3>
          <p className="text-xs text-slate-400 mb-3">Conquistas desbloqueadas pela sua constância</p>

          <div className="grid grid-cols-2 gap-2.5">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className={`p-3 rounded-2xl border flex flex-col gap-1.5 transition-all ${
                    b.earned
                      ? b.color
                      : 'border-orange-100/60 dark:border-amber-950/60 bg-orange-50/20 dark:bg-[#251E18]/30 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className="w-4 h-4" />
                    {b.earned && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wide">
                        Obtido!
                      </span>
                    )}
                  </div>
                  <h5 className="text-xs font-bold leading-tight">{b.title}</h5>
                  <p className="text-[10px] opacity-80 leading-tight">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
