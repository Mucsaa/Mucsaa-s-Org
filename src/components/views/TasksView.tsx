import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority, UserProfile } from '../../types';
import { TaskCard } from '../TaskCard';
import { getTodayString, addDays, isTaskOverdue } from '../../utils/dateUtils';
import { CATEGORIES } from '../../utils/constants';
import { CategoryIcon } from '../CategoryIcon';
import { NinoAvatar } from '../NinoAvatar';

interface TasksViewProps {
  user: UserProfile;
  tasks: Task[];
  onToggleTaskComplete: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onPostponeTask: (task: Task, days: number) => void;
  onOpenNewTaskModal: () => void;
  onStartFocusTask?: (task: Task) => void;
}

type TabFilter = 'today' | 'tomorrow' | 'upcoming' | 'overdue' | 'completed' | 'all';

export const TasksView: React.FC<TasksViewProps> = ({
  user,
  tasks,
  onToggleTaskComplete,
  onEditTask,
  onDeleteTask,
  onPostponeTask,
  onOpenNewTaskModal,
  onStartFocusTask,
}) => {
  const [tabFilter, setTabFilter] = useState<TabFilter>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'title'>('time');

  const today = getTodayString();
  const tomorrow = addDays(today, 1);

  // Group counts
  const todayTasks = tasks.filter((t) => t.date === today && !t.completed);
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t));
  const completedTasks = tasks.filter((t) => t.completed);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab Filter
      if (tabFilter === 'today') {
        if (task.date !== today || task.completed) return false;
      } else if (tabFilter === 'tomorrow') {
        if (task.date !== tomorrow || task.completed) return false;
      } else if (tabFilter === 'upcoming') {
        if (task.date <= today || task.completed) return false;
      } else if (tabFilter === 'overdue') {
        if (!isTaskOverdue(task)) return false;
      } else if (tabFilter === 'completed') {
        if (!task.completed) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query) || false;
        const matchesCat = CATEGORIES[task.category]?.name.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesDesc && !matchesCat) return false;
      }

      // Category Filter
      if (selectedCategory !== 'all' && task.category !== selectedCategory) {
        return false;
      }

      // Priority Filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'time') {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return (a.time || '99:99').localeCompare(b.time || '99:99');
      } else if (sortBy === 'priority') {
        const pWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
        return pWeights[b.priority] - pWeights[a.priority];
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [tasks, tabFilter, searchQuery, selectedCategory, selectedPriority, sortBy, today, tomorrow]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 pb-24 overflow-x-hidden min-w-0">
      {/* Header & Search Bar */}
      <div className="bg-white dark:bg-[#1D1A16] p-4 sm:p-6 rounded-3xl border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              Gerenciador de Tarefas
            </h2>
            <p className="text-xs text-orange-950/60 dark:text-amber-300/60 font-medium">
              {tasks.length} atividades cadastradas no total
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenNewTaskModal}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-orange-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, categoria, descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-orange-100 dark:border-amber-900/50 bg-orange-50/40 dark:bg-[#251E18]/60 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-orange-500 hover:text-orange-700"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold no-scrollbar w-full min-w-0">
        <button
          type="button"
          onClick={() => setTabFilter('today')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            tabFilter === 'today'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Hoje ({todayTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTabFilter('tomorrow')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            tabFilter === 'tomorrow'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Amanhã
        </button>
        <button
          type="button"
          onClick={() => setTabFilter('upcoming')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            tabFilter === 'upcoming'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Futuras
        </button>
        <button
          type="button"
          onClick={() => setTabFilter('overdue')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            tabFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Atrasadas ({overdueTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTabFilter('completed')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            tabFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Concluídas ({completedTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setTabFilter('all')}
          className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
            tabFilter === 'all'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs'
              : 'bg-white dark:bg-[#1D1A16] text-slate-600 dark:text-slate-400 border border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200'
          }`}
        >
          Todas ({tasks.length})
        </button>
      </div>

      {/* Secondary Filter Chips: Category & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Category Picker */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-orange-900/70 dark:text-amber-300/70 font-bold flex items-center gap-1">
            <Filter className="w-3 h-3 text-orange-500" /> Categoria:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as TaskCategory | 'all')}
            className="px-2.5 py-1 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#1D1A16] text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="all">Todas as categorias</option>
            {(Object.keys(CATEGORIES) as TaskCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORIES[c].name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-orange-900/70 dark:text-amber-300/70 font-bold flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-orange-500" /> Ordenar:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'time' | 'priority' | 'title')}
            className="px-2.5 py-1 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#1D1A16] text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-orange-400"
          >
            <option value="time">Por data e horário</option>
            <option value="priority">Por prioridade</option>
            <option value="title">Alfabética</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          <AnimatePresence>
            {filteredTasks.map((task) => (
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
        ) : (
          <div className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-orange-200/80 dark:border-amber-900/40 bg-white/60 dark:bg-[#1D1A16]/50">
            <div className="w-16 h-16 mx-auto mb-2 opacity-80">
              <NinoAvatar expression="thinking" size="md" interactive={false} color={user.preferences.ninoColor} />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200">
              Nenhuma tarefa encontrada neste filtro
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Tente selecionar outra aba de filtro ou adicionar uma nova atividade.
            </p>
            <button
              type="button"
              onClick={onOpenNewTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
