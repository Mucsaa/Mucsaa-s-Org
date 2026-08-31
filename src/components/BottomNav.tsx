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
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/95 dark:bg-[#1D1A16]/95 backdrop-blur-lg border-t border-orange-100/80 dark:border-amber-950/60 shadow-lg shadow-orange-950/5 pb-safe">
      <div className="max-w-lg mx-auto px-2 sm:px-4 h-16 sm:h-18 grid grid-cols-5 relative">
        {/* 1. Início */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
            activeTab === 'home'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">Início</span>
          {activeTab === 'home' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 2. Calendário */}
        <button
          type="button"
          onClick={() => onSelectTab('calendar')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
            activeTab === 'calendar'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
        >
          <CalendarIcon className={`w-5 h-5 transition-transform ${activeTab === 'calendar' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">Calendário</span>
          {activeTab === 'calendar' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 3. Central Slot: Floating '+' Action Button & 'Tarefas' Tab */}
        <div className="relative flex flex-col items-center justify-end pb-1.5 pt-1">
          {/* Floating Circular '+' Action Button */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onOpenNewTaskModal}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/35 border-4 border-[#FFFDF9] dark:border-[#1D1A16] focus:outline-none focus:ring-4 focus:ring-orange-300/60 dark:focus:ring-orange-900/60 transition-transform cursor-pointer"
              style={{ backgroundColor: themeConfig.primary }}
              aria-label="Adicionar nova tarefa"
              title="Criar nova tarefa rápida"
            >
              <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
            </motion.button>
          </div>

          {/* Independent Tarefas Tab Link (completely below the floating button with dedicated spacing) */}
          <button
            type="button"
            onClick={() => onSelectTab('tasks')}
            className={`w-full flex flex-col items-center justify-center pt-5 transition-all ${
              activeTab === 'tasks'
                ? 'text-orange-600 dark:text-orange-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
            }`}
            title="Ver todas as tarefas"
          >
            <span className="text-[11px] font-medium tracking-tight">Tarefas</span>
            {activeTab === 'tasks' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* 4. Progresso */}
        <button
          type="button"
          onClick={() => onSelectTab('stats')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
            activeTab === 'stats'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
        >
          <BarChart3 className={`w-5 h-5 transition-transform ${activeTab === 'stats' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">Progresso</span>
          {activeTab === 'stats' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>

        {/* 5. Perfil */}
        <button
          type="button"
          onClick={() => onSelectTab('profile')}
          className={`relative flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all ${
            activeTab === 'profile'
              ? 'text-orange-600 dark:text-orange-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${activeTab === 'profile' ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
          <span className="text-[11px] mt-1 font-medium tracking-tight">Perfil</span>
          {activeTab === 'profile' && (
            <motion.div
              layoutId="activeTabIndicator"
              className="absolute -top-0.5 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>
    </nav>
  );
};
