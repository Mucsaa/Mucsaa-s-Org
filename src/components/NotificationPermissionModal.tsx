import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, Smartphone, ShieldCheck, X, Sparkles, AlertCircle } from 'lucide-react';
import { NinoAvatar } from './NinoAvatar';
import { getDeviceType, isIOSDevice, isPWAStandalone } from '../utils/pushNotifications';

interface NotificationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const deviceType = getDeviceType();
  const isIOS = isIOSDevice();
  const isPWA = isPWAStandalone();

  const formattedDevice =
    deviceType.includes('android')
      ? 'Android'
      : deviceType.includes('ios')
      ? 'iPhone / iPad'
      : deviceType.includes('windows')
      ? 'Computador Windows'
      : deviceType.includes('mac')
      ? 'Apple Mac'
      : 'Seu Dispositivo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md bg-white dark:bg-[#1D1A16] rounded-3xl border border-orange-100/90 dark:border-amber-950/70 shadow-2xl overflow-hidden"
      >
        {/* Header decoration */}
        <div className="relative p-6 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent dark:from-orange-950/40 dark:via-amber-950/20 border-b border-orange-100/70 dark:border-amber-950/60 flex items-start gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25">
              <BellRing className="w-7 h-7 animate-bounce" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <NinoAvatar expression="excited" size="sm" interactive={false} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Notificações Reais
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-['Outfit',sans-serif]">
              Ativar Notificações Push
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Receba lembretes pontuais de suas tarefas diretamente no {formattedDevice}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-orange-50 dark:hover:bg-[#251E18] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body features */}
        <div className="p-6 space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 dark:bg-[#251E18]/60 border border-orange-100/60 dark:border-amber-950/50">
            <div className="w-7 h-7 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Mesmo com o app fechado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Os lembretes chegam no horário programado da tarefa através de Web Push seguro.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-orange-50/60 dark:bg-[#251E18]/60 border border-orange-100/60 dark:border-amber-950/50">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100">Sincronizado e Sem Spam</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Se você concluir, reagendar ou excluir a tarefa, o lembrete é atualizado automaticamente.
              </p>
            </div>
          </div>

          {/* iOS Special Note */}
          {isIOS && !isPWA && (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-bold block">Aviso para iPhone/iOS:</span>
                No Safari do iOS, notificações push em segundo plano exigem adicionar o Polaris à{' '}
                <strong>Tela de Início</strong> (Toque em Compartilhar ➔ Adicionar à Tela de Início).
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-2 border-t border-orange-100/70 dark:border-amber-950/60 flex items-center justify-end gap-2.5 bg-orange-50/30 dark:bg-[#1D1A16]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-orange-200 dark:border-amber-900/50 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-[#251E18] text-xs font-bold transition-all cursor-pointer"
          >
            Agora não
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Ativando...</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Notificações</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
