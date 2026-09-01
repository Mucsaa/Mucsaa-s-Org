import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertTriangle,
  ChevronRight,
  X,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import { Task } from '../types';
import { getOverdueDelayInfo, OverdueDelayInfo, getTodayString } from '../utils/dateUtils';
import { CategoryIcon } from './CategoryIcon';
import { CATEGORIES } from '../utils/constants';

interface OverdueAlertBannerProps {
  tasks: Task[];
  onToggleTaskComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onPostponeTask: (task: Task, days: number) => void;
  onMoveToToday?: (task: Task) => void;
  className?: string;
}

export const OverdueAlertBanner: React.FC<OverdueAlertBannerProps> = ({
  tasks,
  onToggleTaskComplete,
  onEditTask,
  onPostponeTask,
  onMoveToToday,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Compute overdue tasks with delay metadata
  const overdueItems = tasks
    .filter((task) => !task.completed)
    .map((task) => ({
      task,
      info: getOverdueDelayInfo(task),
    }))
    .filter((item) => item.info.isOverdue)
    .sort((a, b) => b.info.minutesOverdue - a.info.minutesOverdue);

  const count = overdueItems.length;

  if (count === 0) {
    return null;
  }

  const primaryItem = overdueItems[0];
  const today = getTodayString();

  return (
    <>
      {/* 1. In-page Alert Banner (when not dismissed) */}
      {!isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, height: 0 }}
          className={`w-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-orange-950/30 border border-rose-200/80 dark:border-rose-900/60 shadow-xs backdrop-blur-sm ${className}`}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-3">
            {/* Icon + Main Message */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-rose-500/30 animate-pulse">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-rose-950 dark:text-rose-200 leading-tight">
                    {count === 1 ? '1 tarefa atrasada' : `${count} tarefas atrasadas`}
                  </span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                    {primaryItem.info.delayText}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-900/75 dark:text-rose-300/70 truncate mt-0.5 font-medium">
                  <span className="font-semibold text-rose-950 dark:text-rose-100">"{primaryItem.task.title}"</span>
                  {count > 1 ? ` e mais ${count - 1} pendência(s)` : ''}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-rose-600/30 flex items-center gap-1 transition-all cursor-pointer"
              >
                <span>Ver tarefas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-xl text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors"
                title="Dispensar aviso por agora"
                aria-label="Dispensar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Minimized floating badge trigger (when dismissed but tasks still overdue) */}
      {isDismissed && count > 0 && (
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800 text-[11px] font-bold hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-rose-600 animate-pulse" />
            <span>{count} tarefa(s) atrasada(s)</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. Detailed Overdue Tasks Modal Sheet */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-white dark:bg-[#1D1A16] rounded-3xl shadow-2xl border border-rose-200/80 dark:border-rose-900/60 overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-500 to-amber-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight font-['Outfit',sans-serif]">
                      Tarefas Atrasadas ({count})
                    </h3>
                    <p className="text-xs text-white/80 font-medium">
                      Atualize prazos, adie ou conclua para manter sua jornada em dia
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Task List */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
                {overdueItems.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Tudo em dia!
                    </h4>
                    <p className="text-xs text-slate-500">
                      Você não tem nenhuma tarefa atrasada no momento.
                    </p>
                  </div>
                ) : (
                  overdueItems.map(({ task, info }) => {
                    const categoryConfig = CATEGORIES[task.category] || CATEGORIES.other;
                    return (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 space-y-2.5 transition-all hover:border-rose-300"
                      >
                        {/* Tags & Delay Label */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${categoryConfig.bgLight} ${categoryConfig.bgDark} ${categoryConfig.textLight} ${categoryConfig.borderLight}`}
                            >
                              <CategoryIcon category={task.category} className="w-2.5 h-2.5" />
                              {task.customCategoryName || categoryConfig.name}
                            </span>

                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200/80">
                              {info.delayText}
                            </span>
                          </div>

                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-rose-500" />
                            {task.date} {task.time ? `• ${task.time}` : ''}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-100/80 dark:border-rose-900/40 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setIsModalOpen(false);
                              onEditTask(task);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-rose-100/50 dark:hover:bg-rose-900/30 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Abrir
                          </button>

                          <div className="flex items-center gap-1.5">
                            {/* Move to today if not today */}
                            {task.date !== today && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (onMoveToToday) {
                                    onMoveToToday(task);
                                  } else {
                                    onPostponeTask(task, 0);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                title="Mover para hoje"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Mover p/ Hoje
                              </button>
                            )}

                            {/* Postpone +1 day */}
                            <button
                              type="button"
                              onClick={() => onPostponeTask(task, 1)}
                              className="px-2.5 py-1 rounded-xl bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 text-orange-800 dark:text-orange-300 text-xs font-bold border border-orange-200/80 dark:border-orange-800/60 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                              title="Adiar prazo em +1 dia"
                            >
                              <Calendar className="w-3 h-3" />
                              +1 Dia
                            </button>

                            {/* Mark Complete */}
                            <button
                              type="button"
                              onClick={() => onToggleTaskComplete(task)}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Marcar como concluída agora"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Concluir
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 bg-rose-50/50 dark:bg-[#161310] border-t border-rose-100 dark:border-rose-950/60 flex items-center justify-between text-xs text-slate-500">
                <span>Total: {count} {count === 1 ? 'pendência' : 'pendências'}</span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
