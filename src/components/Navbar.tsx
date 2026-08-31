import React, { useEffect, useState } from 'react';
import {
  Flame,
  Sun,
  Moon,
  Sparkles,
  Bell,
  CheckCircle2,
  Zap,
  FileText,
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';
import { THEME_COLORS } from '../utils/constants';

interface NavbarProps {
  user: UserProfile;
  onToggleTheme: () => void;
  isDark: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  onTabSelect: (tab: ActiveTab) => void;
  activeTab: ActiveTab;
  onStartFocus?: () => void;
  onOpenSanctuary?: () => void;
  notesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onToggleTheme,
  isDark,
  onOpenNotifications,
  unreadNotificationsCount = 0,
  onTabSelect,
  activeTab,
  onStartFocus,
  onOpenSanctuary,
  notesCount = 0,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const themeConfig = THEME_COLORS[user.preferences.ninoColor] || THEME_COLORS.indigo;

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDF9]/85 dark:bg-[#1D1A16]/85 backdrop-blur-md border-b border-orange-100/70 dark:border-amber-950/40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none"
          onClick={() => onTabSelect('home')}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/25 font-extrabold text-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeConfig.primary }}
          >
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-lg tracking-tight font-['Outfit',sans-serif]">
                Polaris
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40">
                Agenda
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Seu companheiro inteligente
            </p>
          </div>
        </div>

        {/* Center Live Clock, Streak & Polaris Level Pill */}
        <div className="flex items-center gap-2">
          {/* Live Clock (Desktop only) */}
          <div className="hidden md:flex px-3 py-1 rounded-xl bg-orange-50/80 dark:bg-amber-950/40 border border-orange-200/50 dark:border-amber-900/40 text-xs font-bold text-slate-800 dark:text-slate-200 items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{timeStr || '12:00'}</span>
          </div>

          {/* Streak Counter */}
          <div
            onClick={() => onTabSelect('stats')}
            className="cursor-pointer px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform shadow-xs"
            title="Sequência de dias organizados consecutivos!"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{user.streakDays}d</span>
          </div>

          {/* Polaris Level & Crystals Sanctuary Trigger */}
          {onOpenSanctuary && (
            <button
              type="button"
              onClick={onOpenSanctuary}
              className="cursor-pointer px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
              title="Abrir Santuário, Loja e Missões do Polaris"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
              <span>Nv. {user.polaris?.level || 1}</span>
              <span className="opacity-75 hidden sm:inline">• {user.polaris?.stardust || 0} ✨</span>
            </button>
          )}
        </div>

        {/* Right Actions: Focus Mode, Theme Toggle, Notifications, Profile Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Focus Mode Button */}
          {onStartFocus && (
            <button
              type="button"
              onClick={onStartFocus}
              className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-orange-100/90 dark:bg-amber-950/60 hover:bg-orange-200 dark:hover:bg-amber-900/60 text-orange-700 dark:text-amber-300 border border-orange-200/80 dark:border-amber-900/50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Modo Foco com Polaris"
            >
              <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span className="hidden sm:inline">Modo Foco</span>
            </button>
          )}

          {/* Quick Notes Tab Button */}
          <button
            type="button"
            onClick={() => onTabSelect(activeTab === 'notes' ? 'home' : 'notes')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-2xl border text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20'
                : 'bg-orange-50/80 dark:bg-amber-950/40 hover:bg-orange-100 dark:hover:bg-amber-900/60 text-slate-700 dark:text-slate-200 border-orange-200/70 dark:border-amber-900/40'
            }`}
            title="Minhas Notas"
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'notes' ? 'text-white' : 'text-orange-500'}`} />
            <span className="hidden sm:inline">Notas</span>
            {notesCount !== undefined && notesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-orange-500 text-white'
              }`}>
                {notesCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-orange-50/80 dark:hover:bg-amber-950/40 transition-colors"
            title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Trigger */}
          {onOpenNotifications && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-orange-50/80 dark:hover:bg-amber-950/40 transition-colors"
              title="Notificações e Avisos do Polaris"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          )}

          {/* User Profile Mini Tab Button */}
          <button
            type="button"
            onClick={() => onTabSelect('profile')}
            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border transition-all ${
              activeTab === 'profile'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold'
                : 'border-orange-100 dark:border-amber-950/60 hover:border-orange-200 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-[#1D1A16]/70'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {user.name.charAt(0)}
            </div>
            <span className="text-xs font-medium hidden sm:inline">{user.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
