import React from 'react';
import { motion } from 'motion/react';
import {
  Home,
  Calendar as CalendarIcon,
  CheckSquare,
  BarChart3,
  User,
  Plus,
} from 'lucide-react';
import { ActiveTab, NinoThemeColor } from '../types';
import { THEME_COLORS } from '../utils/constants';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNewTaskModal: () => void;
  ninoColor: NinoThemeColor;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTaskModal,
  ninoColor,
}) => {
  const themeConfig = THEME_COLORS[ninoColor] || THEME_COLORS.indigo;

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 inset-x-0 z-40 w-full overflow-visible pointer-events-auto bg-[#FFFDF9]/95 dark:bg-[#1D1A16]/95 backdrop-blur-xl border-t border-orange-200/80 dark:border-amber-950/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-safe"
    >
      <div className="w-full max-w-lg mx-auto px-1 sm:px-3 h-[64px] sm:h-[68px] grid grid-cols-5 items-center relative overflow-visible select-none">
        {/* 1. Início */}
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onSelectTab('home')}
          className={`group relative flex flex-col items-center justify-center h-full w-full py-1 min-w-0 transition-colors ${
            activeTab === 'home'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
          aria-label="Ir para tela inicial"
        >
          <Home className={`w-5 h-5 transition-transform duration-200 group-active:scale-90 ${activeTab === 'home' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 font-semibold tracking-tight truncate max-w-full text-center leading-none">
            Início
          </span>
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 2. Calendário */}
        <button
          id="nav-tab-calendar"
          type="button"
          onClick={() => onSelectTab('calendar')}
          className={`group relative flex flex-col items-center justify-center h-full w-full py-1 min-w-0 transition-colors ${
            activeTab === 'calendar'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
          aria-label="Ir para calendário"
        >
          <CalendarIcon className={`w-5 h-5 transition-transform duration-200 group-active:scale-90 ${activeTab === 'calendar' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 font-semibold tracking-tight truncate max-w-full text-center leading-none">
            Calendário
          </span>
          {activeTab === 'calendar' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 3. Central Slot: Floating '+' Action Button & 'Tarefas' Tab */}
        <div className="relative flex flex-col items-center justify-end h-full w-full min-w-0 overflow-visible">
          {/* Floating Circular '+' Action Button */}
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 z-20">
            <motion.button
              id="nav-floating-add-button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onOpenNewTaskModal}
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/40 border-[3.5px] border-[#FFFDF9] dark:border-[#1D1A16] bg-gradient-to-tr from-orange-500 via-amber-500 to-amber-400 focus:outline-none focus:ring-4 focus:ring-orange-300/60 dark:focus:ring-orange-900/60 transition-transform cursor-pointer"
              style={{ backgroundColor: themeConfig.primary }}
              aria-label="Criar nova tarefa"
              title="Criar nova tarefa rápida (+)"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3] drop-shadow-sm" />
            </motion.button>
          </div>

          {/* Independent Tarefas Tab Link */}
          <button
            id="nav-tab-tasks"
            type="button"
            onClick={() => onSelectTab('tasks')}
            className={`group relative w-full h-full flex flex-col items-center justify-end pb-1 pt-6 sm:pt-7 min-w-0 transition-colors ${
              activeTab === 'tasks'
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
            }`}
            aria-label="Ir para todas as tarefas"
            title="Ver lista de tarefas"
          >
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight truncate max-w-full text-center leading-none">
              Tarefas
            </span>
            {activeTab === 'tasks' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* 4. Progresso */}
        <button
          id="nav-tab-stats"
          type="button"
          onClick={() => onSelectTab('stats')}
          className={`group relative flex flex-col items-center justify-center h-full w-full py-1 min-w-0 transition-colors ${
            activeTab === 'stats'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
          aria-label="Ir para progresso e estatísticas"
        >
          <BarChart3 className={`w-5 h-5 transition-transform duration-200 group-active:scale-90 ${activeTab === 'stats' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 font-semibold tracking-tight truncate max-w-full text-center leading-none">
            Progresso
          </span>
          {activeTab === 'stats' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 5. Perfil */}
        <button
          id="nav-tab-profile"
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`group relative flex flex-col items-center justify-center h-full w-full py-1 min-w-0 transition-colors ${
            activeTab === 'profile'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
          aria-label="Ir para perfil e configurações"
        >
          <User className={`w-5 h-5 transition-transform duration-200 group-active:scale-90 ${activeTab === 'profile' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 font-semibold tracking-tight truncate max-w-full text-center leading-none">
            Perfil
          </span>
          {activeTab === 'profile' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-sm shadow-orange-500/50"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>
    </nav>
  );
};
