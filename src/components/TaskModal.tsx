import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  Flag,
  Repeat,
  Hourglass,
  Bell,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import {
  Task,
  TaskCategory,
  TaskPriority,
  RecurrenceType,
  ReminderOffset,
  TaskReminder,
  NinoPersonality,
} from '../types';
import { CATEGORIES } from '../utils/constants';
import { CategoryIcon } from './CategoryIcon';
import { getTodayString } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => void;
  initialTask?: Task | null;
  initialDate?: string;
  initialTime?: string;
  personality: NinoPersonality;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  initialDate,
  initialTime,
  personality,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayString());
  const [time, setTime] = useState('09:00');
  const [isAllDay, setIsAllDay] = useState(false);
  const [category, setCategory] = useState<TaskCategory>('work');
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(30);
  const [reminders, setReminders] = useState<TaskReminder[]>([
    { id: 'rem-1', offset: '15m' },
  ]);
  const [notes, setNotes] = useState('');

  // Reset or populate fields when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setDate(initialTask.date);
        setTime(initialTask.time || '09:00');
        setIsAllDay(initialTask.isAllDay || !initialTask.time);
        setCategory(initialTask.category);
        setCustomCategoryName(initialTask.customCategoryName || '');
        setPriority(initialTask.priority);
        setRecurrence(initialTask.recurrence || 'none');
        setEstimatedMinutes(initialTask.estimatedMinutes || 30);
        setReminders(
          initialTask.reminders && initialTask.reminders.length > 0
            ? initialTask.reminders
            : [{ id: 'rem-1', offset: '15m' }]
        );
        setNotes(initialTask.notes || '');
      } else {
        setTitle('');
        setDescription('');
        setDate(initialDate || getTodayString());
        setTime(initialTime || '10:00');
        setIsAllDay(false);
        setCategory('work');
        setCustomCategoryName('');
        setPriority('medium');
        setRecurrence('none');
        setEstimatedMinutes(30);
        setReminders([{ id: 'rem-1', offset: '15m' }]);
        setNotes('');
      }
    }
  }, [isOpen, initialTask, initialDate, initialTime]);

  if (!isOpen) return null;

  const handleAddReminder = (offset: ReminderOffset) => {
    if (reminders.some((r) => r.offset === offset)) return;
    setReminders([...reminders, { id: `rem-${Date.now()}`, offset }]);
  };

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      time: isAllDay ? undefined : time,
      isAllDay,
      category,
      customCategoryName: customCategoryName.trim() || undefined,
      priority,
      recurrence,
      estimatedMinutes: Number(estimatedMinutes) || undefined,
      reminders,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const reminderOptions: { offset: ReminderOffset; label: string }[] = [
    { offset: '5m', label: '5 min antes' },
    { offset: '15m', label: '15 min antes' },
    { offset: '30m', label: '30 min antes' },
    { offset: '1h', label: '1 hora antes' },
    { offset: '1d', label: '1 dia antes' },
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Baixa', color: 'border-slate-300 text-slate-700 dark:text-slate-300' },
    { value: 'medium', label: 'Média', color: 'border-blue-400 text-blue-600 dark:text-blue-400' },
    { value: 'high', label: 'Alta', color: 'border-amber-400 text-amber-600 dark:text-amber-400' },
    { value: 'urgent', label: 'Urgente', color: 'border-rose-400 text-rose-600 dark:text-rose-400' },
  ];

  const recurrenceOptions: { value: RecurrenceType; label: string }[] = [
    { value: 'none', label: 'Não repete' },
    { value: 'daily', label: 'Diariamente' },
    { value: 'weekdays', label: 'Dias úteis (Seg-Sex)' },
    { value: 'weekly', label: 'Semanalmente' },
    { value: 'monthly', label: 'Mensalmente' },
  ];

  // Nino's preview reminder quote
  const sampleReminderText =
    personality === 'divertido'
      ? `Ei! Seu compromisso "${title || 'da tarefa'}" começa logo mais. Melhor se preparar! ⚡`
      : personality === 'profissional'
      ? `Lembrete de compromisso agendado: "${title || 'sua tarefa'}" inicia em breve.`
      : personality === 'motivador'
      ? `Hora do show! "${title || 'Sua meta'}" chegando. Vamos com tudo! 🔥`
      : `Lembrando suavemente: sua atividade "${title || 'planejada'}" está se aproximando. 🌿`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl bg-white dark:bg-[#1D1A16] rounded-3xl shadow-2xl border border-orange-100/90 dark:border-amber-950/70 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-orange-100/80 dark:border-amber-950/60 flex items-center justify-between bg-orange-50/50 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                {initialTask ? 'Editar Tarefa' : 'Nova Atividade'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O Polaris irá te lembrar na hora certa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-orange-50 dark:hover:bg-amber-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nome da tarefa *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Reunião de Planejamento, Academia, Comprar frutas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Descrição
            </label>
            <textarea
              rows={2}
              placeholder="Adicione detalhes, pauta ou objetivos desta atividade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-500 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Categoria
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CATEGORIES) as TaskCategory[]).map((catKey) => {
                const cat = CATEGORIES[catKey];
                const isSelected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 text-left transition-all ${
                      isSelected
                        ? `border-orange-500 bg-orange-50/80 dark:bg-orange-950/50 shadow-xs font-bold text-orange-900 dark:text-orange-200`
                        : `border-orange-100/70 dark:border-amber-950/60 hover:border-orange-200 bg-white dark:bg-[#251E18] text-slate-600 dark:text-slate-300`
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon category={catKey} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Data
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>
            </div>

            {/* Time */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Horário
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  Dia inteiro
                </label>
              </div>

              {!isAllDay ? (
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              ) : (
                <div className="px-4 py-2.5 rounded-xl border border-dashed border-orange-200 dark:border-amber-900/60 bg-orange-50/50 dark:bg-amber-950/30 text-slate-400 text-xs">
                  Sem horário específico
                </div>
              )}
            </div>
          </div>

          {/* Priority & Estimated Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Prioridade
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((opt) => {
                  const isSelected = priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPriority(opt.value)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all ${
                        isSelected
                          ? `bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-xs`
                          : `bg-white dark:bg-[#251E18] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-950/60 hover:border-orange-200`
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Tempo Estimado
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {durationOptions.map((mins) => {
                  const isSelected = estimatedMinutes === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEstimatedMinutes(mins)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-400 font-bold'
                          : 'bg-white dark:bg-[#251E18] border-orange-100 dark:border-amber-950/60 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Repetição
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
              className="w-full px-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
            >
              {recurrenceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reminders System */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Lembretes e Notificações do Polaris
            </label>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {reminderOptions.map((opt) => {
                  const isAdded = reminders.some((r) => r.offset === opt.offset);
                  return (
                    <button
                      key={opt.offset}
                      type="button"
                      onClick={() =>
                        isAdded
                          ? handleRemoveReminder(
                              reminders.find((r) => r.offset === opt.offset)?.id || ''
                            )
                          : handleAddReminder(opt.offset)
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isAdded
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white dark:bg-[#251E18] text-slate-600 dark:text-slate-300 border-orange-100 dark:border-amber-950/60 hover:border-amber-300'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      {opt.label}
                      {isAdded && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Polaris's personalized speech reminder preview */}
              <div className="p-3 rounded-2xl bg-orange-50/70 dark:bg-amber-950/40 border border-orange-100 dark:border-amber-900/50 text-xs text-orange-950 dark:text-orange-200 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">💬</span>
                <div>
                  <span className="font-bold text-orange-800 dark:text-orange-300 block mb-0.5">
                    Como o Polaris vai te avisar:
                  </span>
                  <p className="italic">"{sampleReminderText}"</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes / Observações */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Observações Adicionais
            </label>
            <input
              type="text"
              placeholder="Links, materiais necessários, local ou recados extras..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-orange-100 dark:border-amber-900/50 bg-white dark:bg-[#251E18] text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/40"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-orange-100/80 dark:border-amber-950/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-amber-950/60 font-semibold text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {initialTask ? 'Salvar Alterações' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
