import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Pin,
  PinOff,
  Trash2,
  ChevronLeft,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ArrowUpDown,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Note, UserProfile } from '../../types';
import { soundManager } from '../../utils/sound';

interface NotesViewProps {
  notes: Note[];
  user: UserProfile;
  onCreateNote: (title: string, content: string) => Promise<Note | null>;
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  onBackToHome?: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  user,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onBackToHome,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active Note Editor Form State
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Active selected note reference
  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId) || null,
    [notes, selectedNoteId]
  );

  // When selected note changes, sync inputs
  useEffect(() => {
    if (selectedNote) {
      setTitleInput(selectedNote.title);
      setContentInput(selectedNote.content);
      setIsSaving(false);
      setLastSavedTime(
        new Date(selectedNote.updatedAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }
  }, [selectedNoteId]); // only re-run on note switch

  // Debounced auto-save effect
  const handleContentOrTitleChange = (newTitle: string, newContent: string) => {
    setTitleInput(newTitle);
    setContentInput(newContent);

    if (!selectedNoteId) return;

    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await onUpdateNote(selectedNoteId, {
        title: newTitle.trim() || 'Sem título',
        content: newContent,
      });
      setIsSaving(false);
      setLastSavedTime(
        new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    }, 600);
  };

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let result = notes.filter((n) => {
      if (!query) return true;
      return (
        n.title.toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query)
      );
    });

    result.sort((a, b) => {
      // Pinned notes always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'recent') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return result;
  }, [notes, searchQuery, sortBy]);

  const pinnedNotes = useMemo(() => filteredNotes.filter((n) => n.isPinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter((n) => !n.isPinned), [filteredNotes]);

  // Create new note action
  const handleCreateNew = async () => {
    soundManager.playPop();
    const created = await onCreateNote('Nova Nota', '');
    if (created) {
      setSelectedNoteId(created.id);
      setTitleInput(created.title);
      setContentInput(created.content);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (note: Note, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundManager.playPop();
    await onUpdateNote(note.id, { isPinned: !note.isPinned });
  };

  // Trigger Delete Modal
  const promptDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    soundManager.playPop();
    setDeleteConfirmId(id);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    soundManager.playPop();
    const idToDelete = deleteConfirmId;
    setDeleteConfirmId(null);
    if (selectedNoteId === idToDelete) {
      setSelectedNoteId(null);
    }
    await onDeleteNote(idToDelete);
  };

  // Format relative date for note card preview
  const formatNoteDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-24 min-h-[75vh]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs">
        <div className="flex items-center gap-3">
          {onBackToHome && (
            <button
              type="button"
              onClick={onBackToHome}
              className="p-2 rounded-2xl hover:bg-orange-50 dark:hover:bg-amber-950/50 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              title="Voltar para o Início"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              Minhas Notas
            </h1>
            <p className="text-xs text-slate-400">
              {notes.length} {notes.length === 1 ? 'anotação salva' : 'anotações salvas'} no Polaris
            </p>
          </div>
        </div>

        {/* Action Button: New Note */}
        <button
          type="button"
          onClick={handleCreateNew}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Nota</span>
        </button>
      </div>

      {/* Main Content: Split Grid / Responsive View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Notes List & Search */}
        <div
          className={`space-y-4 lg:col-span-5 ${
            selectedNoteId ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Search and Sort Controls */}
          <div className="p-4 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar em títulos e anotações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl bg-orange-50/40 dark:bg-[#251E18] text-slate-800 dark:text-slate-100 border border-orange-100/80 dark:border-amber-950/60 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Sort Filter Selector */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" /> Ordenar:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSortBy('recent')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    sortBy === 'recent'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Recentes
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('alphabetical')}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    sortBy === 'alphabetical'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  A-Z
                </button>
              </div>
            </div>
          </div>

          {/* Notes Cards Container */}
          <div className="space-y-3">
            {filteredNotes.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-amber-950/60 text-orange-500 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota criada ainda'}
                </p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? 'Tente buscar com outras palavras-chave ou crie uma nova anotação.'
                    : 'Crie ideias, anotações de estudo ou lembretes rápidos para sua rotina.'}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={handleCreateNew}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Primeira Nota
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Pinned Notes Section */}
                {pinnedNotes.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-orange-950/60 dark:text-amber-300/60 px-2 flex items-center gap-1">
                      <Pin className="w-3 h-3 text-orange-500 fill-orange-500" />
                      Fixadas
                    </div>
                    {pinnedNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                          selectedNoteId === note.id
                            ? 'border-orange-500 bg-orange-50/70 dark:bg-[#2A2119] shadow-xs ring-1 ring-orange-500'
                            : 'bg-white dark:bg-[#1D1A16] border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-[#251E18]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                            {note.title || 'Sem título'}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(note, e)}
                            className="p-1 text-orange-500 hover:text-orange-600 transition-colors"
                            title="Desafixar nota"
                          >
                            <Pin className="w-3.5 h-3.5 fill-orange-500" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                          {note.content || 'Nenhum conteúdo adicional...'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{formatNoteDate(note.updatedAt)}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 dark:text-orange-400 font-bold">
                            Abrir ➔
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Notes Section */}
                {otherNotes.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {pinnedNotes.length > 0 && (
                      <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 px-2">
                        Outras Notas
                      </div>
                    )}
                    {otherNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => setSelectedNoteId(note.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative group ${
                          selectedNoteId === note.id
                            ? 'border-orange-500 bg-orange-50/70 dark:bg-[#2A2119] shadow-xs ring-1 ring-orange-500'
                            : 'bg-white dark:bg-[#1D1A16] border-orange-100/90 dark:border-amber-950/70 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-[#251E18]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">
                            {note.title || 'Sem título'}
                          </h3>
                          <button
                            type="button"
                            onClick={(e) => handleTogglePin(note, e)}
                            className="p-1 text-slate-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="Fixar no topo"
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                          {note.content || 'Nenhum conteúdo adicional...'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{formatNoteDate(note.updatedAt)}</span>
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-orange-600 dark:text-orange-400 font-bold">
                            Abrir ➔
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Note Editor */}
        <div
          className={`lg:col-span-7 ${
            selectedNoteId ? 'block' : 'hidden lg:block'
          }`}
        >
          {selectedNote ? (
            <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs space-y-4 flex flex-col min-h-[520px]">
              {/* Editor Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-orange-100/70 dark:border-amber-950/60">
                {/* Back to list button (Mobile) */}
                <button
                  type="button"
                  onClick={() => setSelectedNoteId(null)}
                  className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-[#251E18] flex items-center gap-1 text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>

                {/* Auto-save Status Indicator */}
                <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                  {isSaving ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span>Salvando alterações...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Salvo {lastSavedTime ? `às ${lastSavedTime}` : ''}</span>
                    </>
                  )}
                </div>

                {/* Editor Action Buttons */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Pin Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin(selectedNote)}
                    className={`p-2 rounded-xl transition-all ${
                      selectedNote.isPinned
                        ? 'bg-orange-100 dark:bg-amber-950 text-orange-600 dark:text-amber-400'
                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-50 dark:hover:bg-[#251E18]'
                    }`}
                    title={selectedNote.isPinned ? 'Desafixar nota' : 'Fixar nota no topo'}
                  >
                    {selectedNote.isPinned ? (
                      <Pin className="w-4 h-4 fill-current" />
                    ) : (
                      <PinOff className="w-4 h-4" />
                    )}
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => promptDelete(selectedNote.id)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Excluir nota"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <input
                  type="text"
                  placeholder="Título da nota..."
                  value={titleInput}
                  onChange={(e) => handleContentOrTitleChange(e.target.value, contentInput)}
                  className="w-full text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent border-none focus:outline-none focus:ring-0 font-['Outfit',sans-serif]"
                />
              </div>

              {/* Content Textarea */}
              <div className="flex-1">
                <textarea
                  placeholder="Comece a digitar sua anotação aqui... O Polaris salva tudo automaticamente."
                  value={contentInput}
                  onChange={(e) => handleContentOrTitleChange(titleInput, e.target.value)}
                  rows={14}
                  className="w-full h-full min-h-[300px] text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent border-none focus:outline-none focus:ring-0 resize-none leading-relaxed"
                />
              </div>

              {/* Editor Footer / Metadata */}
              <div className="pt-3 border-t border-orange-100/70 dark:border-amber-950/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                <div className="flex items-center gap-3">
                  <span>{contentInput.length} caracteres</span>
                  <span>•</span>
                  <span>
                    {contentInput.trim() ? contentInput.trim().split(/\s+/).length : 0} palavras
                  </span>
                </div>
                <div>
                  Criada em{' '}
                  {new Date(selectedNote.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100/90 dark:border-amber-950/70 shadow-xs text-center flex flex-col items-center justify-center min-h-[520px] space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-amber-950/60 text-orange-500 dark:text-amber-400 flex items-center justify-center">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                Selecione uma nota ou crie uma nova
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Escreva ideias, planos rápidos ou lembretes livres com salvamento automático seguro.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-105 transition-all"
              >
                + Criar Nova Nota
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-6 rounded-3xl bg-white dark:bg-[#1D1A16] border border-orange-100 dark:border-amber-950 shadow-xl space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
                  Excluir esta nota?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta ação é irreversível e removerá o conteúdo permanentemente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
