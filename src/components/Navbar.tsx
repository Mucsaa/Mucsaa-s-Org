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
  Search,
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
  onOpenSearch?: () => void;
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
  onOpenSearch,
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
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-[#FFFDF9]/90 dark:bg-[#1D1A16]/90 backdrop-blur-md border-b border-orange-100/70 dark:border-amber-950/40 transition-colors">
      <div className="w-full max-w-6xl mx-auto px-2.5 sm:px-6 h-15 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand Logo & Name */}
        <div
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none shrink-0"
          onClick={() => onTabSelect('home')}
        >
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-500/25 font-extrabold text-base sm:text-lg transition-transform hover:scale-105"
            style={{ backgroundColor: themeConfig.primary }}
          >
            P
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-base sm:text-lg tracking-tight font-['Outfit',sans-serif]">
                Polaris
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-800/40 hidden xs:inline-block">
                Agenda
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block">
              Seu companheiro inteligente
            </p>
          </div>
        </div>

        {/* Center Live Clock, Streak & Polaris Level Pill */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Live Clock (Desktop only) */}
          <div className="hidden lg:flex px-3 py-1 rounded-xl bg-orange-50/80 dark:bg-amber-950/40 border border-orange-200/50 dark:border-amber-900/40 text-xs font-bold text-slate-800 dark:text-slate-200 items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{timeStr || '12:00'}</span>
          </div>

          {/* Streak Counter */}
          <div
            onClick={() => onTabSelect('stats')}
            className="cursor-pointer px-2 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] sm:text-xs font-bold flex items-center gap-1 hover:scale-105 transition-transform shadow-xs"
            title="Sequência de dias organizados consecutivos!"
          >
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
            <span>{user.streakDays}d</span>
          </div>

          {/* Polaris Level & Crystals Sanctuary Trigger */}
          {onOpenSanctuary && (
            <button
              type="button"
              onClick={onOpenSanctuary}
              className="cursor-pointer px-2 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] sm:text-xs font-black flex items-center gap-1 sm:gap-1.5 shadow-sm shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
              title="Abrir Santuário, Loja e Missões do Polaris"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-white" />
              <span>Nv. {user.polaris?.level || 1}</span>
              <span className="opacity-75 hidden sm:inline">• {user.polaris?.stardust || 0} ✨</span>
            </button>
          )}
        </div>

        {/* Right Actions: Global Search, Focus Mode, Notes, Theme, Notifications, Profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Global Search Button (Lupa) */}
          {onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-orange-50/90 dark:bg-amber-950/50 hover:bg-orange-100 dark:hover:bg-amber-900/60 text-slate-700 dark:text-slate-200 border border-orange-200/70 dark:border-amber-900/50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer group"
              title="Pesquisar tarefas e notas (Ctrl+K)"
              aria-label="Pesquisar tarefas e notas"
            >
              <Search className="w-3.5 h-3.5 text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline">Buscar</span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </button>
          )}

          {/* Quick Focus Mode Button */}
          {onStartFocus && (
            <button
              type="button"
              onClick={onStartFocus}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-orange-100/90 dark:bg-amber-950/60 hover:bg-orange-200 dark:hover:bg-amber-900/60 text-orange-700 dark:text-amber-300 border border-orange-200/80 dark:border-amber-900/50 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Modo Foco com Polaris"
            >
              <Zap className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
              <span className="hidden md:inline">Modo Foco</span>
            </button>
          )}

          {/* Quick Notes Tab Button */}
          <button
            type="button"
            onClick={() => onTabSelect(activeTab === 'notes' ? 'home' : 'notes')}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-2xl border text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer ${
              activeTab === 'notes'
                ? 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20'
                : 'bg-orange-50/80 dark:bg-amber-950/40 hover:bg-orange-100 dark:hover:bg-amber-900/60 text-slate-700 dark:text-slate-200 border-orange-200/70 dark:border-amber-900/40'
            }`}
            title="Minhas Notas"
          >
            <FileText className={`w-3.5 h-3.5 ${activeTab === 'notes' ? 'text-white' : 'text-orange-500'}`} />
            <span className="hidden md:inline">Notas</span>
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
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-orange-50/80 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
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
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-orange-50/80 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
              title="Notificações e Avisos do Polaris"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          )}

          {/* User Profile Mini Tab Button */}
          <button
            type="button"
            onClick={() => onTabSelect('profile')}
            className={`flex items-center gap-1.5 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-semibold'
                : 'border-orange-100 dark:border-amber-950/60 hover:border-orange-200 text-slate-700 dark:text-slate-200 bg-white/70 dark:bg-[#1D1A16]/70'
            }`}
          >
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-xs">
              {user.name.charAt(0)}
            </div>
            <span className="text-xs font-medium hidden lg:inline">{user.name}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

