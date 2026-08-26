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

  const tabs: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
    // Space in center for FAB
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
    { id: 'stats', label: 'Progresso', icon: BarChart3 },
    { id: 'profile', label: 'Perfil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#FFFDF9]/95 dark:bg-[#1D1A16]/95 backdrop-blur-lg border-t border-orange-100/80 dark:border-amber-950/60 pb-safe shadow-lg shadow-orange-950/5">
      <div className="max-w-xl mx-auto px-4 h-16 sm:h-18 flex items-center justify-between relative">
        {/* Left 2 tabs */}
        <div className="flex items-center gap-1 sm:gap-4">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
                <span className="text-[11px] mt-0.5">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Floating Action Button (+) */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={onOpenNewTaskModal}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/35 border-4 border-[#FFFDF9] dark:border-[#1D1A16] focus:outline-none focus:ring-4 focus:ring-orange-300/60 dark:focus:ring-orange-900/60 transition-transform"
            style={{ backgroundColor: themeConfig.primary }}
            aria-label="Adicionar nova tarefa"
            title="Criar nova tarefa rápida"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </motion.button>
        </div>

        {/* Right 3 tabs */}
        <div className="flex items-center gap-1 sm:gap-4">
          {tabs.slice(2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-orange-700 dark:hover:text-orange-300'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-orange-600 dark:text-orange-400' : ''}`} />
                <span className="text-[11px] mt-0.5">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
