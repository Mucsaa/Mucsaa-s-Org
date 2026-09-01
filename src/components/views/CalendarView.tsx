import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  Calendar as CalendarIcon,
  Filter,
  Layers,
} from 'lucide-react';
import {
  Task,
  CalendarViewMode,
  TaskCategory,
  UserProfile,
} from '../../types';
import { CATEGORIES } from '../../utils/constants';
import { CategoryIcon } from '../CategoryIcon';
import {
  getMonthMatrix,
  getTodayString,
  addDays,
  getDaysOfWeek,
  formatDayMonth,
} from '../../utils/dateUtils';

interface CalendarViewProps {
  user: UserProfile;
  tasks: Task[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleTaskComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onOpenNewTaskModal: (initialDate?: string, initialTime?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  user,
  tasks,
  selectedDate,
  onSelectDate,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onOpenNewTaskModal,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentYear, setCurrentYear] = useState(() => new Date(selectedDate + 'T12:00:00').getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date(selectedDate + 'T12:00:00').getMonth());
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  const today = getTodayString();
  const monthMatrix = getMonthMatrix(currentYear, currentMonth);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Filter tasks by category if selected
  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    return true;
  });

  const getTasksForDate = (dateStr: string) => {
    return filteredTasks.filter((t) => t.date === dateStr);
  };

  const hoursList = Array.from({ length: 16 }, (_, i) => i + 7); // 7:00 to 22:00

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-5 pb-24 overflow-x-hidden min-w-0">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-[#1D1A16] p-3.5 sm:p-5 rounded-3xl border border-orange-100/90 dark:border-amber-950/70 shadow-xs w-full min-w-0">
        {/* Navigation & Current Month Display */}
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-orange-50/80 dark:bg-amber-950/40 p-1 rounded-2xl border border-orange-100/60 dark:border-amber-900/40 shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#251E18] text-slate-700 dark:text-slate-300 transition-colors"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                onSelectDate(today);
              }}
              className="px-2 sm:px-2.5 py-1 text-xs font-bold text-orange-700 dark:text-orange-300 hover:bg-white dark:hover:bg-[#251E18] rounded-xl transition-colors"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-[#251E18] text-slate-700 dark:text-slate-300 transition-colors"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif] truncate">
            {monthNames[currentMonth]} {currentYear}
          </h2>
        </div>

        {/* View Mode Switcher (Month, Week, Day) */}
        <div className="flex items-center gap-1 bg-orange-50/80 dark:bg-amber-950/40 p-1 rounded-2xl text-xs font-bold border border-orange-100/60 dark:border-amber-900/40 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'month'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Mês
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'week'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl transition-all ${
              viewMode === 'day'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            Dia
          </button>
        </div>
      </div>

      {/* Category Filter Horizontal Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar w-full min-w-0">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-3 sm:px-3.5 py-1.5 rounded-full font-bold border transition-all whitespace-nowrap shrink-0 ${
            categoryFilter === 'all'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Todas categorias
        </button>
        {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
          const cat = CATEGORIES[catKey];
          const isSelected = categoryFilter === catKey;
          return (
            <button
              key={catKey}
              type="button"
              onClick={() => setCategoryFilter(catKey)}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full font-bold border transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs'
                  : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-300 border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-[#1D1A16] rounded-3xl border border-orange-100/90 dark:border-amber-950/70 p-2 sm:p-5 shadow-xs overflow-hidden w-full min-w-0">
          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-[11px] font-bold text-orange-900/60 dark:text-amber-300/60 uppercase tracking-wider">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          {/* Month Matrix Grid */}
          <div className="space-y-1 sm:space-y-2 w-full">
            {monthMatrix.map((week, wIdx) => (
              <div key={wIdx} className="grid grid-cols-7 gap-1 sm:gap-2 w-full">
                {week.map((cell) => {
                  const isSelected = cell.dateStr === selectedDate;
                  const dayTaskList = getTasksForDate(cell.dateStr);

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => onSelectDate(cell.dateStr)}
                      onDoubleClick={() => onOpenNewTaskModal(cell.dateStr)}
                      className={`min-h-[55px] sm:min-h-[110px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group min-w-0 ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 dark:bg-amber-950/40 ring-2 ring-orange-500/30'
                          : cell.isCurrentMonth
                          ? 'bg-white dark:bg-[#251E18]/60 border-orange-100/80 dark:border-amber-950/70 hover:border-orange-300 dark:hover:border-amber-700/60'
                          : 'bg-orange-50/30 dark:bg-[#171412]/40 border-orange-100/40 dark:border-amber-950/40 opacity-40'
                      }`}
                    >
                      {/* Cell Header: Day Number & Add Button */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold ${
                            cell.isToday
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
                              : isSelected
                              ? 'text-orange-600 dark:text-orange-400 font-black'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {cell.day}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenNewTaskModal(cell.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-orange-100 dark:hover:bg-amber-950 text-slate-500 transition-opacity hidden sm:block"
                          title="Adicionar tarefa neste dia"
                        >
                          <Plus className="w-3 h-3 text-orange-500" />
                        </button>
                      </div>

                      {/* Task Badges inside Day Cell */}
                      <div className="space-y-1 my-1 overflow-hidden hidden sm:block">
                        {dayTaskList.slice(0, 3).map((t) => {
                          const cat = CATEGORIES[t.category] || CATEGORIES.other;
                          return (
                            <div
                              key={t.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(t);
                              }}
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate flex items-center gap-1 transition-transform hover:scale-[1.02] ${
                                t.completed
                                  ? 'line-through opacity-60 bg-orange-50 dark:bg-amber-950/40 text-slate-400'
                                  : 'text-white shadow-2xs'
                              }`}
                              style={{
                                backgroundColor: t.completed ? undefined : cat.color,
                              }}
                              title={`${t.time ? `[${t.time}] ` : ''}${t.title}`}
                            >
                              {t.time && <span className="text-[9px] opacity-90">{t.time}</span>}
                              <span className="truncate">{t.title}</span>
                            </div>
                          );
                        })}

                        {dayTaskList.length > 3 && (
                          <span className="text-[9px] font-bold text-orange-700 dark:text-orange-300 block px-1">
                            +{dayTaskList.length - 3} mais
                          </span>
                        )}
                      </div>

                      {/* Mini indicator dot if has tasks (mobile friendly) */}
                      <div className="flex items-center justify-center sm:justify-start gap-0.5 h-1 sm:h-1.5 mt-0.5">
                        {dayTaskList.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: CATEGORIES[t.category]?.color || '#F97316',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-[#1D1A16] rounded-3xl border border-orange-100/90 dark:border-amber-950/70 p-3 sm:p-5 shadow-xs overflow-x-auto w-full max-w-full no-scrollbar">
          <div className="min-w-[560px] sm:min-w-[650px] grid grid-cols-7 gap-2">
            {getDaysOfWeek(selectedDate).map((w) => {
              const isSelected = w.dateStr === selectedDate;
              const dayTaskList = getTasksForDate(w.dateStr);

              return (
                <div
                  key={w.dateStr}
                  onClick={() => onSelectDate(w.dateStr)}
                  className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[350px] transition-all cursor-pointer ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50/50 dark:bg-amber-950/30 shadow-xs'
                      : 'border-orange-100/70 dark:border-amber-950/60 bg-orange-50/20 dark:bg-[#251E18]/40'
                  }`}
                >
                  <div className="text-center pb-2 border-b border-orange-100/70 dark:border-amber-950/60">
                    <span className="text-[11px] font-bold uppercase text-orange-800/60 dark:text-amber-300/60 block">
                      {w.dayName}
                    </span>
                    <span
                      className={`text-lg font-black inline-block mt-0.5 px-2 py-0.5 rounded-full ${
                        w.isToday ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {w.dayNum}
                    </span>
                  </div>

                  <div className="flex-1 py-2 space-y-1.5 overflow-y-auto max-h-[300px]">
                    {dayTaskList.map((t) => {
                      return (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTask(t);
                          }}
                          className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                            t.completed
                              ? 'line-through bg-orange-50/40 dark:bg-amber-950/30 text-slate-400 border-orange-100/60'
                              : 'bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 border-orange-100 dark:border-amber-950/60 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[10px] text-orange-600 dark:text-orange-400 font-bold mb-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {t.time || 'Sem horário'}
                          </div>
                          <p className="truncate font-bold">{t.title}</p>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNewTaskModal(w.dateStr);
                    }}
                    className="w-full py-1.5 text-center text-xs font-bold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-amber-950/50 rounded-xl transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: DAY TIMELINE VIEW */}
      {viewMode === 'day' && (
        <div className="bg-white dark:bg-[#1D1A16] rounded-3xl border border-orange-100/90 dark:border-amber-950/70 p-4 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-orange-100/80 dark:border-amber-950/60">
            <div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Grade de Horários ({formatDayMonth(selectedDate)})
              </h3>
              <p className="text-xs text-slate-400">
                Toque em qualquer horário para agendar uma atividade instantaneamente
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNewTaskModal(selectedDate)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          <div className="divide-y divide-orange-100/60 dark:divide-amber-950/50">
            {hoursList.map((hour) => {
              const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
              const tasksInHour = getTasksForDate(selectedDate).filter((t) => {
                if (!t.time) return false;
                const [h] = t.time.split(':').map(Number);
                return h === hour;
              });

              return (
                <div
                  key={hour}
                  onClick={() => onOpenNewTaskModal(selectedDate, hourFormatted)}
                  className="py-3 px-2 flex items-start gap-4 hover:bg-orange-50/50 dark:hover:bg-amber-950/30 rounded-xl transition-colors cursor-pointer group"
                >
                  <span className="w-14 text-xs font-bold text-orange-900/60 dark:text-amber-300/60 flex-shrink-0 pt-1">
                    {hourFormatted}
                  </span>

                  <div className="flex-1 space-y-2">
                    {tasksInHour.length > 0 ? (
                      tasksInHour.map((t) => {
                        const cat = CATEGORIES[t.category] || CATEGORIES.other;
                        return (
                          <div
                            key={t.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(t);
                            }}
                            className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-xs transition-transform hover:scale-[1.01] ${
                              t.completed
                                ? 'bg-orange-50/40 dark:bg-amber-950/30 border-orange-100/70 text-slate-400'
                                : 'bg-white dark:bg-[#251E18] border-orange-100 dark:border-amber-950/60'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: cat.color }}
                              />
                              <div>
                                <h5
                                  className={`text-sm font-bold truncate ${
                                    t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                                  }`}
                                >
                                  {t.title}
                                </h5>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                  {t.time} • {t.estimatedMinutes ? `${t.estimatedMinutes} min • ` : ''}
                                  {cat.name}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleTaskComplete(t);
                              }}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                t.completed
                                  ? 'bg-emerald-500 text-white border-emerald-500'
                                  : 'hover:border-orange-500 text-slate-400 border-slate-200 dark:border-amber-900/60'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-6 flex items-center text-xs text-slate-400 dark:text-slate-500 group-hover:text-orange-500 transition-colors">
                        + Horário livre. Clique para agendar.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
