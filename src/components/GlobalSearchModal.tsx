import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  CheckCircle2,
  Circle,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  Pin,
  Sparkles,
  ArrowRight,
  Plus,
  Tag,
  Folder,
} from 'lucide-react';
import { Task, Note, UserProfile } from '../types';
import { CATEGORIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { soundManager } from '../utils/sound';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  notes: Note[];
  onSelectTask: (task: Task) => void;
  onSelectNote: (note: Note) => void;
  onOpenNewTaskModal?: (title?: string) => void;
  onOpenNewNote?: (title?: string) => void;
  user?: UserProfile;
}

type FilterType = 'all' | 'tasks' | 'notes';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  tasks = [],
  notes = [],
  onSelectTask,
  onSelectNote,
  onOpenNewTaskModal,
  onOpenNewNote,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input when opened and reset state
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setActiveFilter('all');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Global ESC shortcut inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Highlight matched terms in text
  const renderHighlighted = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark
          key={i}
          className="bg-orange-200 dark:bg-amber-900/80 text-orange-950 dark:text-amber-100 rounded-xs px-0.5 font-bold"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Generate a snippet with surrounding context for note content
  const getNoteSnippet = (content: string, searchTerm: string) => {
    if (!content) return '';
    if (!searchTerm) return content.slice(0, 110) + (content.length > 110 ? '...' : '');

    const lower = content.toLowerCase();
    const index = lower.indexOf(searchTerm);
    if (index === -1) {
      return content.slice(0, 110) + (content.length > 110 ? '...' : '');
    }

    const start = Math.max(0, index - 35);
    const end = Math.min(content.length, index + searchTerm.length + 65);
    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    return snippet;
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    if (!debouncedQuery) {
      // If empty query, show up to 4 upcoming or recent tasks
      return tasks.slice(0, 4);
    }

    return tasks.filter((task) => {
      const titleMatch = task.title.toLowerCase().includes(debouncedQuery);
      const descMatch = task.description?.toLowerCase().includes(debouncedQuery) || false;
      const notesMatch = task.notes?.toLowerCase().includes(debouncedQuery) || false;
      const catMatch = task.category.toLowerCase().includes(debouncedQuery);
      const customCatMatch = task.customCategoryName?.toLowerCase().includes(debouncedQuery) || false;
      return titleMatch || descMatch || notesMatch || catMatch || customCatMatch;
    });
  }, [tasks, debouncedQuery]);

  // Filter Notes
  const filteredNotes = useMemo(() => {
    if (!debouncedQuery) {
      // If empty query, show pinned notes or recently updated
      return [...notes]
        .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        .slice(0, 4);
    }

    return notes.filter((note) => {
      const titleMatch = note.title.toLowerCase().includes(debouncedQuery);
      const contentMatch = note.content.toLowerCase().includes(debouncedQuery);
      const tagsMatch = note.tags?.some((tag) => tag.toLowerCase().includes(debouncedQuery)) || false;
      return titleMatch || contentMatch || tagsMatch;
    });
  }, [notes, debouncedQuery]);

  const totalResults =
    (activeFilter === 'all' || activeFilter === 'tasks' ? filteredTasks.length : 0) +
    (activeFilter === 'all' || activeFilter === 'notes' ? filteredNotes.length : 0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-all"
        />

        {/* Search Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-2xl bg-[#FFFDF9] dark:bg-[#1A1612] rounded-3xl shadow-2xl border border-orange-200/90 dark:border-amber-950/80 overflow-hidden z-10 flex flex-col max-h-[85vh]"
        >
          {/* Search Header Bar */}
          <div className="p-3.5 sm:p-4 border-b border-orange-100 dark:border-amber-950/60 flex items-center gap-3 bg-white dark:bg-[#201A15]">
            <Search className="w-5 h-5 text-orange-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar tarefas, notas, categorias..."
              className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none min-w-0"
            />

            {/* Clear Button */}
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg hover:bg-orange-100 dark:hover:bg-amber-950/70 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                title="Limpar texto"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* ESC Badge */}
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-orange-100/80 dark:hover:bg-amber-950/60 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Fechar pesquisa"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills Row */}
          <div className="px-4 py-2 bg-orange-50/50 dark:bg-[#17130F] border-b border-orange-100/60 dark:border-amber-950/40 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#201A15] text-slate-600 dark:text-slate-400 hover:bg-orange-100/60 border border-orange-100 dark:border-amber-950/60'
                }`}
              >
                Todos ({filteredTasks.length + filteredNotes.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('tasks')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'tasks'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#201A15] text-slate-600 dark:text-slate-400 hover:bg-orange-100/60 border border-orange-100 dark:border-amber-950/60'
                }`}
              >
                Tarefas ({filteredTasks.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('notes')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'notes'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white dark:bg-[#201A15] text-slate-600 dark:text-slate-400 hover:bg-orange-100/60 border border-orange-100 dark:border-amber-950/60'
                }`}
              >
                Notas ({filteredNotes.length})
              </button>
            </div>

            {debouncedQuery && (
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Search Results List */}
          <div className="p-4 overflow-y-auto space-y-5 flex-1 divide-y divide-orange-100/60 dark:divide-amber-950/40">
            {/* Empty State */}
            {debouncedQuery && totalResults === 0 && (
              <div className="text-center py-10 px-4 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-amber-950/60 text-orange-500 flex items-center justify-center mx-auto">
                  <Search className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Nenhum resultado encontrado
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Não encontramos tarefas ou notas correspondentes a "
                    <span className="font-bold text-orange-600 dark:text-orange-400">{query}</span>".
                  </p>
                </div>

                {/* Quick Add Buttons from Search Query */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {onOpenNewTaskModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewTaskModal(query);
                      }}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Criar Tarefa "{query}"
                    </button>
                  )}

                  {onOpenNewNote && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenNewNote(query);
                      }}
                      className="px-4 py-2 rounded-xl border border-orange-200 dark:border-amber-900 bg-white dark:bg-[#201A15] hover:bg-orange-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-orange-500" />
                      Criar Nota "{query}"
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* TASKS SECTION */}
            {(activeFilter === 'all' || activeFilter === 'tasks') && filteredTasks.length > 0 && (
              <div className="space-y-2.5 pt-2 first:pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500" />
                    Tarefas ({filteredTasks.length})
                  </span>
                  {!debouncedQuery && (
                    <span className="text-[10px] text-slate-400 font-medium">Próximas tarefas</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {filteredTasks.map((t) => {
                    const catConfig = CATEGORIES[t.category] || CATEGORIES.work;
                    return (
                      <div
                        key={t.id}
                        onClick={() => {
                          soundManager.playPop();
                          onClose();
                          onSelectTask(t);
                        }}
                        className="group p-3 rounded-2xl bg-white dark:bg-[#201A15] hover:bg-orange-50/80 dark:hover:bg-amber-950/50 border border-orange-100/80 dark:border-amber-950/60 hover:border-orange-300 dark:hover:border-amber-800/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {t.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 group-hover:text-orange-400 shrink-0" />
                          )}

                          <div className="min-w-0">
                            <h5
                              className={`text-xs sm:text-sm font-bold truncate ${
                                t.completed
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                              }`}
                            >
                              {renderHighlighted(t.title, debouncedQuery)}
                            </h5>
                            {t.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                {renderHighlighted(t.description, debouncedQuery)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catConfig.bgLight} ${catConfig.bgDark} ${catConfig.textLight} ${catConfig.borderLight}`}
                          >
                            <CategoryIcon category={t.category} className="w-2.5 h-2.5" />
                            <span className="hidden xs:inline">
                              {t.customCategoryName || catConfig.name}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <CalendarIcon className="w-2.5 h-2.5" />
                            {t.date} {t.time ? `• ${t.time}` : ''}
                          </span>

                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NOTES SECTION */}
            {(activeFilter === 'all' || activeFilter === 'notes') && filteredNotes.length > 0 && (
              <div className="space-y-2.5 pt-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-500" />
                    Notas ({filteredNotes.length})
                  </span>
                  {!debouncedQuery && (
                    <span className="text-[10px] text-slate-400 font-medium">Notas recentes</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {filteredNotes.map((n) => {
                    const snippet = getNoteSnippet(n.content, debouncedQuery);
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          soundManager.playPop();
                          onClose();
                          onSelectNote(n);
                        }}
                        className="group p-3 rounded-2xl bg-white dark:bg-[#201A15] hover:bg-orange-50/80 dark:hover:bg-amber-950/50 border border-orange-100/80 dark:border-amber-950/60 hover:border-orange-300 dark:hover:border-amber-800/80 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-1.5 rounded-xl bg-orange-100/80 dark:bg-amber-950/60 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 truncate">
                                {renderHighlighted(n.title || 'Sem título', debouncedQuery)}
                              </h5>
                              {n.isPinned && (
                                <span className="p-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 shrink-0" title="Nota Fixada">
                                  <Pin className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>

                            {snippet && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                {renderHighlighted(snippet, debouncedQuery)}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Note Date & Category */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {n.category && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100/60 dark:bg-amber-950/40 text-orange-700 dark:text-orange-300">
                              <Tag className="w-2.5 h-2.5" />
                              {n.category}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                            {new Date(n.updatedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>

                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Quick Shortcuts */}
          <div className="p-3 bg-orange-50/40 dark:bg-[#17130F] border-t border-orange-100/60 dark:border-amber-950/40 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="hidden sm:inline">
              Dica: clique em um item para abrir ou editar instantaneamente
            </span>
            <span className="sm:hidden">
              Toque no item para abrir
            </span>
            <div className="flex items-center gap-2">
              <span>Navegar rápido</span>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[10px]">
                ↵ Enter
              </kbd>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
