import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Clock,
  Bell,
  Repeat,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Hourglass,
  Zap,
} from 'lucide-react';
import { Task } from '../types';
import { CATEGORIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { isTaskOverdue, formatDayMonth } from '../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onPostpone?: (task: Task, days: number) => void;
  onStartFocus?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onPostpone,
  onStartFocus,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryConfig = CATEGORIES[task.category] || CATEGORIES.other;
  const isOverdue = isTaskOverdue(task);

  const priorityLabels = {
    low: { text: 'Baixa', color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
    medium: { text: 'Média', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
    high: { text: 'Alta', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
    urgent: { text: 'Urgente', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50' },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className={`group relative rounded-2xl border transition-all duration-200 ${
        task.completed
          ? 'bg-orange-50/30 dark:bg-[#1A1714]/60 border-orange-100/60 dark:border-amber-950/40 opacity-80'
          : isOverdue
          ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 shadow-xs'
          : 'bg-white dark:bg-[#1D1A16] border-orange-100/80 dark:border-amber-950/60 shadow-xs hover:shadow-md hover:border-orange-300 dark:hover:border-amber-700/60'
      }`}
    >
      <div className="p-3.5 sm:p-4 flex items-start gap-3">
        {/* Animated Custom Checkbox */}
        <button
          type="button"
          onClick={() => onToggleComplete(task)}
          className={`mt-0.5 relative flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all duration-200 ${
            task.completed
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
              : 'border-slate-300 dark:border-amber-900/60 hover:border-orange-500 dark:hover:border-orange-400 bg-white dark:bg-[#251E18]'
          }`}
          aria-label={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {task.completed && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
            </motion.div>
          )}
        </button>

        {/* Content Body */}
        <div className="flex-1 min-w-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {/* Category Tag */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryConfig.bgLight} ${categoryConfig.bgDark} ${categoryConfig.textLight} ${categoryConfig.borderLight}`}
            >
              <CategoryIcon category={task.category} className="w-3 h-3" />
              {task.customCategoryName || categoryConfig.name}
            </span>

            {/* Priority Tag */}
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                priorityLabels[task.priority].color
              }`}
            >
              {priorityLabels[task.priority].text}
            </span>

            {/* Overdue Alert */}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                <AlertCircle className="w-3 h-3" />
                Atrasada
              </span>
            )}
          </div>

          {/* Title */}
          <h4
            className={`text-sm sm:text-base font-bold leading-snug break-words transition-all ${
              task.completed
                ? 'line-through text-slate-400 dark:text-slate-500 font-normal'
                : 'text-slate-800 dark:text-slate-100'
            }`}
          >
            {task.title}
          </h4>

          {/* Description if present */}
          {task.description && (
            <p
              className={`mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 ${
                isExpanded ? 'block' : 'line-clamp-1'
              }`}
            >
              {task.description}
            </p>
          )}

          {/* Metadata Row: Time, Date, Duration, Reminders, Quick Focus */}
          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            {task.time ? (
              <span className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400">
                <Clock className="w-3.5 h-3.5" />
                {task.time}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {formatDayMonth(task.date)}
              </span>
            )}

            {task.estimatedMinutes && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Hourglass className="w-3.5 h-3.5 text-amber-500" />
                {task.estimatedMinutes} min
              </span>
            )}

            {task.reminders && task.reminders.length > 0 && (
              <span
                className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400"
                title={`${task.reminders.length} lembrete(s) ativo(s)`}
              >
                <Bell className="w-3.5 h-3.5" />
                {task.reminders.length}
              </span>
            )}

            {task.recurrence && task.recurrence !== 'none' && (
              <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                <Repeat className="w-3.5 h-3.5" />
                {task.recurrence === 'daily'
                  ? 'Diária'
                  : task.recurrence === 'weekdays'
                  ? 'Dias úteis'
                  : task.recurrence === 'weekly'
                  ? 'Semanal'
                  : 'Mensal'}
              </span>
            )}

            {/* Quick Focus Button if not completed */}
            {!task.completed && onStartFocus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartFocus(task);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-100/70 hover:bg-orange-200 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-orange-700 dark:text-amber-300 font-bold transition-all text-[11px] border border-orange-200/60 dark:border-amber-900/40"
                title="Iniciar Modo Foco com Polaris"
              >
                <Zap className="w-3 h-3 fill-orange-500 text-orange-500" />
                Focar
              </button>
            )}
          </div>

          {/* Expanded Notes */}
          {isExpanded && task.notes && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2.5 p-2.5 rounded-xl bg-orange-50/60 dark:bg-amber-950/30 border border-orange-100 dark:border-amber-950/60 text-xs text-slate-700 dark:text-slate-300"
            >
              <span className="font-bold block mb-0.5 text-orange-800 dark:text-orange-300">
                Observações:
              </span>
              {task.notes}
            </motion.div>
          )}
        </div>

        {/* Action Menu Trigger */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-orange-50 dark:hover:bg-amber-950/40 transition-colors"
            aria-label="Opções da tarefa"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-7 w-48 bg-white dark:bg-[#1D1A16] rounded-2xl shadow-xl border border-orange-100/90 dark:border-amber-950/70 py-1.5 z-30 text-xs font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                {!task.completed && onStartFocus && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onStartFocus(task);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-50/70 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                    Modo Foco (Polaris)
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50/70 dark:hover:bg-amber-950/40 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-orange-500" />
                  Editar tarefa
                </button>

                {onPostpone && !task.completed && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onPostpone(task, 1);
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:bg-orange-50/70 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Adiar para amanhã
                  </button>
                )}

                <div className="my-1 border-t border-orange-100/70 dark:border-amber-950/60" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task.id);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

