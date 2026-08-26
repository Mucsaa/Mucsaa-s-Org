import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { NinoAvatar } from './NinoAvatar';
import { Task, NinoPersonality } from '../types';

export interface ActiveNotification {
  id: string;
  task: Task;
  message: string;
  timestamp: string;
}

interface NotificationToastProps {
  notifications: ActiveNotification[];
  onDismiss: (id: string) => void;
  onCompleteTask: (task: Task) => void;
  personality: NinoPersonality;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notifications,
  onDismiss,
  onCompleteTask,
  personality,
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-2 sm:px-0">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="pointer-events-auto bg-white/95 dark:bg-[#1D1A16]/95 backdrop-blur-md rounded-2xl border border-orange-200 dark:border-amber-900/60 shadow-xl shadow-orange-500/15 p-4 flex items-start gap-3.5"
          >
            {/* Mini Nino Face in Toast */}
            <div className="flex-shrink-0 mt-0.5">
              <NinoAvatar expression="excited" size="sm" interactive={false} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-amber-400">
                  <Bell className="w-3 h-3" />
                  Lembrete do Polaris
                </span>
                <span className="text-[10px] text-slate-400">{n.timestamp}</span>
              </div>

              <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {n.task.title}
              </h5>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {n.message}
              </p>

              {/* Action Buttons */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCompleteTask(n.task);
                    onDismiss(n.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-xs"
                >
                  <Check className="w-3 h-3" />
                  Concluir agora
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss(n.id)}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-[#251E18] hover:bg-orange-100 dark:hover:bg-[#2E251E] text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors border border-orange-100 dark:border-amber-950/60"
                >
                  Fechar
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDismiss(n.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
