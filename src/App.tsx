/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ActiveTab,
  Task,
  UserProfile,
  NinoDialogue,
  NinoExpression,
  LevelUpEvent,
} from './types';
import {
  loadUserFromStorage,
  saveUserToStorage,
  loadTasksFromStorage,
  saveTasksToStorage,
  getInitialDemoTasks,
  exportAppData,
  importAppData,
  DEFAULT_USER,
} from './utils/storage';
import {
  getTodayString,
  getMinutesUntil,
  isNightTime,
} from './utils/dateUtils';
import { generateNinoGreeting, getNinoInteractiveQuote } from './utils/ninoBrain';
import { soundManager } from './utils/sound';
import { speechService } from './utils/speech';
import {
  addPolarisXP,
  claimMissionReward,
  performCareAction,
} from './utils/rewards';
import { isSupabaseConfigured, supabase } from './lib/supabaseClient';
import {
  fetchUserTasks,
  createTask,
  updateTask,
  deleteTask,
} from './services/supabase/tasks';
import {
  upsertUserProfile,
  updateUserStats,
} from './services/supabase/profiles';
import { upsertCharacterSettings } from './services/supabase/character';
import { getFullCurrentUserData, signOutUser } from './services/supabase/auth';

// Components
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/views/HomeView';
import { CalendarView } from './components/views/CalendarView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';
import { ProfileView } from './components/views/ProfileView';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { FocusModeModal } from './components/FocusModeModal';
import { NotificationToast, ActiveNotification } from './components/NotificationToast';
import { PolarisSanctuaryModal } from './components/PolarisSanctuaryModal';
import { PolarisLevelUpModal } from './components/PolarisLevelUpModal';

export default function App() {
  // 1. Core State
  const [user, setUser] = useState<UserProfile>(() => loadUserFromStorage());
  const [tasks, setTasks] = useState<Task[]>(() => loadTasksFromStorage(user.id));
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || user.preferences.theme === 'dark';
    }
    return false;
  });

  // 2. Modals & Notifications
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sanctuaryModalOpen, setSanctuaryModalOpen] = useState(false);
  const [levelUpEvent, setLevelUpEvent] = useState<LevelUpEvent | null>(null);

  // 3. Nino Dialogue & Expression Engine
  const [ninoDialogue, setNinoDialogue] = useState<NinoDialogue>(() =>
    generateNinoGreeting({
      userName: user.name,
      personality: user.preferences.ninoPersonality,
      tasks,
      selectedDate,
    })
  );

  // Sync dark class to DOM
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Supabase Initial Auth & Session Synchronization
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;

    async function initSupabaseSession() {
      try {
        const currentUser = await getFullCurrentUserData();
        if (currentUser && isMounted) {
          setUser(currentUser);
          const remoteTasks = await fetchUserTasks(currentUser.id);
          if (remoteTasks && remoteTasks.length > 0 && isMounted) {
            setTasks(remoteTasks);
          }
        }
      } catch (err) {
        console.warn('Initial Supabase session fetch error:', err);
      }
    }

    initSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        const fullUser = await getFullCurrentUserData();
        if (fullUser && isMounted) {
          setUser(fullUser);
          const remoteTasks = await fetchUserTasks(fullUser.id);
          if (remoteTasks && isMounted) {
            setTasks(remoteTasks);
          }
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(DEFAULT_USER);
        setTasks(getInitialDemoTasks(DEFAULT_USER.id));
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Persist user and tasks locally
  useEffect(() => {
    saveUserToStorage(user);
    soundManager.setEnabled(user.preferences.soundEffectsEnabled);

    // Sync to Supabase if authenticated
    if (isSupabaseConfigured() && user.id && !user.id.startsWith('demo-')) {
      upsertUserProfile(user).catch((e) => console.warn('Supabase profile sync warn:', e));
      if (user.polaris) {
        upsertCharacterSettings(user.id, user.polaris).catch((e) => console.warn('Supabase polaris sync warn:', e));
      }
    }
  }, [user]);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  // Reload tasks if active user ID changes
  const handleUserChange = async (newUser: UserProfile) => {
    setUser(newUser);
    if (isSupabaseConfigured() && newUser.id && !newUser.id.startsWith('demo-')) {
      try {
        const userTasks = await fetchUserTasks(newUser.id);
        if (userTasks && userTasks.length > 0) {
          setTasks(userTasks);
        } else {
          const localTasks = loadTasksFromStorage(newUser.id);
          setTasks(localTasks);
        }
      } catch (e) {
        console.warn('Error fetching tasks from Supabase:', e);
        const userTasks = loadTasksFromStorage(newUser.id);
        setTasks(userTasks);
      }
    } else {
      const userTasks = loadTasksFromStorage(newUser.id);
      setTasks(userTasks);
    }
    soundManager.playPop();
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(DEFAULT_USER);
    setTasks(getInitialDemoTasks(DEFAULT_USER.id));
    soundManager.playPop();
  };

  // Re-calculate Nino's contextual dialogue
  const updateNinoState = useCallback(() => {
    const dialogue = generateNinoGreeting({
      userName: user.name,
      personality: user.preferences.ninoPersonality,
      tasks,
      selectedDate,
    });
    setNinoDialogue(dialogue);
  }, [user.name, user.preferences.ninoPersonality, tasks, selectedDate]);

  useEffect(() => {
    updateNinoState();
  }, [updateNinoState]);

  // Periodic Reminder Checker (checks if task is approaching within reminder window)
  useEffect(() => {
    const checkApproachingReminders = () => {
      // SILENCE ALL NOTIFICATIONS WHEN FOCUS MODE IS ACTIVE
      if (focusModalOpen) {
        return;
      }

      const today = getTodayString();
      const pendingToday = tasks.filter((t) => t.date === today && !t.completed && t.time);

      pendingToday.forEach((task) => {
        const mins = getMinutesUntil(task.date, task.time);
        if (mins !== null && mins > 0 && mins <= 15) {
          // Check if already notified
          const notifId = `notif-${task.id}-${task.time}`;
          if (!activeNotifications.some((n) => n.id === notifId)) {
            soundManager.playReminderAlert();
            const message =
              user.preferences.ninoPersonality === 'divertido'
                ? `Ei! Seu compromisso "${task.title}" começa daqui a ${mins} minutos! ⚡`
                : user.preferences.ninoPersonality === 'profissional'
                ? `Lembrete pontual: "${task.title}" agendado para ${task.time}.`
                : `Atenção! Sua tarefa "${task.title}" está chegando. Foco total! 🔥`;

            setActiveNotifications((prev) => [
              ...prev,
              {
                id: notifId,
                task,
                message,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              },
            ]);

            if (user.preferences.voiceEnabled) {
              speechService.speak(message);
            }
          }
        }
      });
    };

    checkApproachingReminders();
    const interval = setInterval(checkApproachingReminders, 45000);
    return () => clearInterval(interval);
  }, [tasks, activeNotifications, user.preferences, focusModalOpen]);

  // Toggle Task Completion with Celebration Cues & Polaris XP Rewards
  const handleToggleTaskComplete = (task: Task) => {
    const nextCompleted = !task.completed;
    const completedAt = nextCompleted ? new Date().toISOString() : undefined;
    const updatedTasks = tasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            completed: nextCompleted,
            completedAt,
          }
        : t
    );

    setTasks(updatedTasks);

    // Sync to Supabase
    if (isSupabaseConfigured() && user.id && !user.id.startsWith('demo-')) {
      updateTask(task.id, { completed: nextCompleted, completedAt }).catch((e) =>
        console.warn('Supabase task completion sync error:', e)
      );
    }

    if (nextCompleted) {
      soundManager.playSuccess();

      // Determine XP and Stardust rewards according to priority
      const xpReward = task.priority === 'urgent' ? 35 : task.priority === 'high' ? 30 : task.priority === 'medium' ? 25 : 15;
      const stardustReward = task.priority === 'urgent' || task.priority === 'high' ? 10 : 5;

      // Add Polaris XP & Stardust
      const userWithTaskIncrement: UserProfile = {
        ...user,
        tasksCompleted: user.tasksCompleted + 1,
      };

      const { updatedUser, levelUpEvent: lvlEvt } = addPolarisXP(
        userWithTaskIncrement,
        xpReward,
        stardustReward
      );

      setUser(updatedUser);

      if (lvlEvt) {
        setLevelUpEvent(lvlEvt);
      }

      // Check if all today's tasks are now complete
      const today = getTodayString();
      const todayDayTasks = updatedTasks.filter((t) => t.date === today);
      const allDone = todayDayTasks.length > 0 && todayDayTasks.every((t) => t.completed);

      if (allDone) {
        soundManager.playCelebration();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      // Voice congratulation if voice enabled
      if (user.preferences.voiceEnabled) {
        speechService.speak(
          allDone
            ? 'Sensacional! Todas as tarefas de hoje foram concluídas!'
            : 'Boa! Mais uma tarefa concluída com sucesso!'
        );
      }
    }
  };

  // Polaris Sanctuary Action Handlers
  const handleClaimMission = (missionId: string) => {
    const { updatedUser, levelUpEvent: lvlEvt } = claimMissionReward(user, tasks, missionId);
    setUser(updatedUser);
    soundManager.playCelebration();
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.6 },
    });
    if (lvlEvt) {
      setLevelUpEvent(lvlEvt);
    }
  };

  const handleCareAction = (actionType: 'feed' | 'pet' | 'play' | 'rest') => {
    const { updatedUser, levelUpEvent: lvlEvt } = performCareAction(user, actionType);
    setUser(updatedUser);
    soundManager.playPop();
    if (lvlEvt) {
      setLevelUpEvent(lvlEvt);
    }
  };

  const handleEquipAccessory = (id: string) => {
    soundManager.playPop();
    setUser((prev) => ({
      ...prev,
      polaris: {
        ...prev.polaris,
        equippedAccessory: id,
      },
    }));
  };

  const handleEquipAura = (id: string) => {
    soundManager.playPop();
    setUser((prev) => ({
      ...prev,
      polaris: {
        ...prev.polaris,
        equippedAura: id,
      },
    }));
  };

  const handleUnlockItem = (type: 'accessory' | 'aura', id: string, cost: number) => {
    if ((user.polaris?.stardust || 0) < cost) {
      soundManager.playError();
      return;
    }

    soundManager.playCelebration();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });

    setUser((prev) => {
      const isAcc = type === 'accessory';
      const updatedUnlocked = Array.from(
        new Set([...(prev.polaris?.unlockedItems || []), id])
      );

      return {
        ...prev,
        polaris: {
          ...prev.polaris,
          stardust: Math.max(0, (prev.polaris?.stardust || 0) - cost),
          unlockedItems: updatedUnlocked,
          equippedAccessory: isAcc ? id : prev.polaris?.equippedAccessory,
          equippedAura: !isAcc ? id : prev.polaris?.equippedAura,
        },
      };
    });
  };

  // Create or Update Task
  const handleSaveTask = async (taskData: Partial<Task>) => {
    const isSupabaseActive = isSupabaseConfigured() && user.id && !user.id.startsWith('demo-');

    if (editingTask) {
      // Update existing
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? { ...t, ...taskData, id: editingTask.id, userId: user.id }
            : t
        )
      );

      if (isSupabaseActive) {
        try {
          await updateTask(editingTask.id, taskData);
        } catch (err) {
          console.warn('Supabase updateTask fallback:', err);
        }
      }
    } else {
      // Create new
      const tempId = `task-${Date.now()}`;
      const newTask: Task = {
        id: tempId,
        title: taskData.title || 'Nova Atividade',
        description: taskData.description,
        date: taskData.date || selectedDate,
        time: taskData.time,
        isAllDay: taskData.isAllDay,
        category: taskData.category || 'work',
        customCategoryName: taskData.customCategoryName,
        priority: taskData.priority || 'medium',
        recurrence: taskData.recurrence || 'none',
        estimatedMinutes: taskData.estimatedMinutes,
        reminders: taskData.reminders || [{ id: `rem-1`, offset: '15m' }],
        notes: taskData.notes,
        completed: false,
        createdAt: new Date().toISOString(),
        userId: user.id,
      };

      setTasks([newTask, ...tasks]);
      soundManager.playPop();

      if (isSupabaseActive) {
        try {
          const createdRemote = await createTask({
            ...newTask,
            userId: user.id,
          });
          if (createdRemote && createdRemote.id) {
            setTasks((prev) =>
              prev.map((t) => (t.id === tempId ? createdRemote : t))
            );
          }
        } catch (err) {
          console.warn('Supabase createTask error:', err);
        }
      }
    }
    setEditingTask(null);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    soundManager.playPop();

    if (isSupabaseConfigured() && user.id && !user.id.startsWith('demo-')) {
      try {
        await deleteTask(taskId, user.id);
      } catch (err) {
        console.warn('Supabase deleteTask error:', err);
      }
    }
  };

  // Postpone Task by N days
  const handlePostponeTask = async (task: Task, days: number) => {
    const [y, m, d] = task.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + days);
    const newYear = dateObj.getFullYear();
    const newMonth = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newDay = String(dateObj.getDate()).padStart(2, '0');
    const newDateStr = `${newYear}-${newMonth}-${newDay}`;

    setTasks(
      tasks.map((t) => (t.id === task.id ? { ...t, date: newDateStr } : t))
    );
    soundManager.playPop();

    if (isSupabaseConfigured() && user.id && !user.id.startsWith('demo-')) {
      try {
        await updateTask(task.id, { date: newDateStr });
      } catch (err) {
        console.warn('Supabase updateTask error:', err);
      }
    }
  };

  // Open Task Modal
  const handleOpenNewTask = (initialDate?: string, initialTime?: string) => {
    setEditingTask(null);
    setModalInitialDate(initialDate || selectedDate);
    setModalInitialTime(initialTime);
    setTaskModalOpen(true);
    soundManager.playPop();
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskModalOpen(true);
    soundManager.playPop();
  };

  // Start Focus Mode with Polaris
  const handleStartFocusTask = (task?: Task) => {
    if (task) {
      setFocusTask(task);
    } else {
      // Pick next pending task for today or first pending
      const today = getTodayString();
      const pendingToday = tasks.filter((t) => t.date === today && !t.completed);
      const chosen = pendingToday[0] || tasks.find((t) => !t.completed) || null;
      setFocusTask(chosen);
    }
    setFocusModalOpen(true);
    soundManager.playFocusStart();
  };

  // Complete or conclude a Focus Mode session
  const handleCompleteFocusSession = (taskId?: string, minutesFocused: number = 25) => {
    if (taskId) {
      // Mark task as completed
      const updatedTasks = tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: true,
              completedAt: new Date().toISOString(),
            }
          : t
      );
      setTasks(updatedTasks);
      soundManager.playCelebration();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    // Award +40 XP & +15 Stardust for deep focus completion!
    const { updatedUser, levelUpEvent: lvlEvt } = addPolarisXP(
      {
        ...user,
        tasksCompleted: taskId ? user.tasksCompleted + 1 : user.tasksCompleted,
      },
      40,
      15
    );
    setUser(updatedUser);
    if (lvlEvt) {
      setLevelUpEvent(lvlEvt);
    }
  };

  // Interactive Nino Dialogue Speak
  const handleSpeakDialogue = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speechService.speak(ninoDialogue.text);
      setTimeout(() => setIsSpeaking(false), 5000);
    }
  };

  // Interactive Nino Quote Refresh
  const handleRefreshNinoQuote = () => {
    soundManager.playPop();
    const randomQuote = getNinoInteractiveQuote(
      user.preferences.ninoPersonality,
      user.name
    );
    setNinoDialogue(randomQuote);
    if (user.preferences.voiceEnabled) {
      speechService.speak(randomQuote.text);
    }
  };

  // Test Notification Simulation
  const handleTestNotification = () => {
    soundManager.playReminderAlert();
    const testTask: Task = {
      id: `test-${Date.now()}`,
      title: 'Apresentação do Projeto Nino',
      date: getTodayString(),
      time: '15:00',
      category: 'work',
      priority: 'high',
      recurrence: 'none',
      reminders: [],
      completed: false,
      createdAt: new Date().toISOString(),
      userId: user.id,
    };

    const newNotif: ActiveNotification = {
      id: `notif-${Date.now()}`,
      task: testTask,
      message:
        user.preferences.ninoPersonality === 'divertido'
          ? 'Ei! Seu compromisso de teste começa daqui a 15 minutos! Melhor se preparar! ⚡'
          : 'Lembrete de compromisso agendado para as 15:00.',
      timestamp: 'Agora',
    };

    setActiveNotifications((prev) => [newNotif, ...prev]);

    if (user.preferences.voiceEnabled) {
      speechService.speak(newNotif.message);
    }
  };

  // Data Export & Import & Reset
  const handleExportData = () => {
    const json = exportAppData(user, tasks);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nino_agenda_backup_${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  };

  const handleImportData = (jsonStr: string): boolean => {
    const data = importAppData(jsonStr);
    if (data) {
      if (data.user) setUser(data.user);
      if (data.tasks) setTasks(data.tasks);
      soundManager.playSuccess();
      return true;
    }
    return false;
  };

  const handleResetDemoData = () => {
    const demo = getInitialDemoTasks(user.id);
    setTasks(demo);
    soundManager.playPop();
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    setUser({
      ...user,
      preferences: {
        ...user.preferences,
        theme: nextDark ? 'dark' : 'light',
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] dark:bg-[#141210] text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Sticky Navbar */}
      <Navbar
        user={user}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
        onOpenNotifications={handleTestNotification}
        unreadNotificationsCount={activeNotifications.length}
        onTabSelect={(tab) => {
          soundManager.playPop();
          setActiveTab(tab);
        }}
        activeTab={activeTab}
        onStartFocus={() => handleStartFocusTask()}
        onOpenSanctuary={() => setSanctuaryModalOpen(true)}
      />

      {/* Real-time Notification Popups - Silenced when Focus Mode is Active */}
      {!focusModalOpen && (
        <NotificationToast
          notifications={activeNotifications}
          onDismiss={(id) => setActiveNotifications((prev) => prev.filter((n) => n.id !== id))}
          onCompleteTask={handleToggleTaskComplete}
          personality={user.preferences.ninoPersonality}
        />
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-5">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <HomeView
                user={user}
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  soundManager.playPop();
                }}
                ninoDialogue={ninoDialogue}
                ninoExpression={ninoDialogue.expression}
                onToggleTaskComplete={handleToggleTaskComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onPostponeTask={handlePostponeTask}
                onOpenNewTaskModal={() => handleOpenNewTask(selectedDate)}
                onSpeakDialogue={handleSpeakDialogue}
                isSpeaking={isSpeaking}
                onRefreshNinoQuote={handleRefreshNinoQuote}
                onNavigateTab={(t) => setActiveTab(t)}
                onStartFocusTask={handleStartFocusTask}
                onOpenSanctuary={() => setSanctuaryModalOpen(true)}
              />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <CalendarView
                user={user}
                tasks={tasks}
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
                onToggleTaskComplete={handleToggleTaskComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onOpenNewTaskModal={(date, time) => handleOpenNewTask(date, time)}
              />
            </motion.div>
          )}

          {activeTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <TasksView
                user={user}
                tasks={tasks}
                onToggleTaskComplete={handleToggleTaskComplete}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onPostponeTask={handlePostponeTask}
                onOpenNewTaskModal={() => handleOpenNewTask(selectedDate)}
                onStartFocusTask={handleStartFocusTask}
              />
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <StatsView user={user} tasks={tasks} />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView
                user={user}
                onUpdateUser={handleUserChange}
                onResetDemoData={handleResetDemoData}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onTestNotification={handleTestNotification}
                onOpenAuthModal={() => setAuthModalOpen(true)}
                isDark={isDark}
                onToggleTheme={handleToggleTheme}
                onSignOut={handleSignOut}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Bottom Nav Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          soundManager.playPop();
          setActiveTab(tab);
        }}
        onOpenNewTaskModal={() => handleOpenNewTask(selectedDate)}
        ninoColor={user.preferences.ninoColor}
      />

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialTask={editingTask}
        initialDate={modalInitialDate}
        initialTime={modalInitialTime}
        personality={user.preferences.ninoPersonality}
      />

      {/* Auth / Account Switcher Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleUserChange}
        currentUser={user}
      />

      {/* Polaris Focus Mode Fullscreen Modal */}
      <FocusModeModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        task={focusTask}
        user={user}
        availableTasks={tasks.filter((t) => !t.completed)}
        onSelectTask={(selected) => setFocusTask(selected)}
        onCompleteTask={handleToggleTaskComplete}
        onCompleteSession={handleCompleteFocusSession}
        personality={user.preferences.ninoPersonality}
        userName={user.name}
      />

      {/* Polaris Sanctuary & Rewards Modal */}
      <PolarisSanctuaryModal
        isOpen={sanctuaryModalOpen}
        onClose={() => setSanctuaryModalOpen(false)}
        user={user}
        tasks={tasks}
        onClaimMission={handleClaimMission}
        onCareAction={handleCareAction}
        onEquipAccessory={handleEquipAccessory}
        onEquipAura={handleEquipAura}
        onUnlockItem={handleUnlockItem}
      />

      {/* Polaris Cosmic Level Up / Evolution Celebration Modal */}
      <PolarisLevelUpModal
        event={levelUpEvent}
        user={user}
        onClose={() => setLevelUpEvent(null)}
        onOpenSanctuary={() => setSanctuaryModalOpen(true)}
      />
    </div>
  );
}
