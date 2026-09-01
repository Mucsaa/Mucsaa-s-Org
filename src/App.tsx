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
  Note,
  UserProfile,
  NinoDialogue,
  NinoExpression,
  NinoThemeColor,
  LevelUpEvent,
} from './types';
import {
  loadUserFromStorage,
  saveUserToStorage,
  loadTasksFromStorage,
  saveTasksToStorage,
  loadNotesFromStorage,
  saveNotesToStorage,
  getInitialDemoTasks,
  getInitialDemoNotes,
  exportAppData,
  importAppData,
  DEFAULT_USER,
} from './utils/storage';
import {
  getTodayString,
  getMinutesUntil,
  isNightTime,
  isTaskOverdue,
  getOverdueDelayInfo,
} from './utils/dateUtils';
import { generateNinoGreeting, getNinoInteractiveQuote } from './utils/ninoBrain';
import { soundManager } from './utils/sound';
import { speechService } from './utils/speech';
import {
  addPolarisXP,
  claimMissionReward,
  performCareAction,
} from './utils/rewards';
import { isSupabaseConfigured, isAuthUser, isValidUUID, supabase } from './lib/supabaseClient';
import {
  fetchUserTasks,
  createTask,
  updateTask,
  deleteTask,
} from './services/supabase/tasks';
import {
  fetchUserNotes,
  createNote,
  updateNote,
  deleteNote,
} from './services/supabase/notes';
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
import { NotesView } from './components/views/NotesView';
import { TaskModal } from './components/TaskModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { FocusModeModal } from './components/FocusModeModal';
import { NotificationToast, ActiveNotification } from './components/NotificationToast';
import { PolarisSanctuaryModal } from './components/PolarisSanctuaryModal';
import { PolarisLevelUpModal } from './components/PolarisLevelUpModal';
import { NotificationPermissionModal } from './components/NotificationPermissionModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import {
  registerPolarisServiceWorker,
  isPushNotificationSupported,
  getNotificationPermissionState,
  subscribeUserToPush,
  sendDeviceOverdueNotification,
  sendDeviceApproachingTaskNotification,
} from './utils/pushNotifications';

export default function App() {
  // 1. Core State
  const [user, setUser] = useState<UserProfile | null>(() => loadUserFromStorage());
  const [tasks, setTasks] = useState<Task[]>(() => (user ? loadTasksFromStorage(user.id) : []));
  const [notes, setNotes] = useState<Note[]>(() => (user ? loadNotesFromStorage(user.id) : []));
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('polaris_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return (
        document.documentElement.classList.contains('dark') ||
        (user?.preferences?.theme === 'dark')
      );
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
  const [showPushPromptModal, setShowPushPromptModal] = useState(false);
  const [pushPromptLoading, setPushPromptLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [targetNoteId, setTargetNoteId] = useState<string | null>(null);

  // Auto register Service Worker for PWA and Web Push
  useEffect(() => {
    registerPolarisServiceWorker();
  }, []);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to open Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle opening task from Notification click (via URL ?taskId=... or Service Worker postMessage)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetTaskId = params.get('taskId');
    if (targetTaskId && tasks.length > 0) {
      const foundTask = tasks.find((t) => t.id === targetTaskId);
      if (foundTask) {
        setSelectedDate(foundTask.date);
        setEditingTask(foundTask);
        setTaskModalOpen(true);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'POLARIS_NOTIFICATION_CLICK' && event.data?.taskId) {
        const taskId = event.data.taskId;
        const foundTask = tasks.find((t) => t.id === taskId);
        if (foundTask) {
          setSelectedDate(foundTask.date);
          setEditingTask(foundTask);
          setTaskModalOpen(true);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [tasks]);

  // 3. Nino Dialogue & Expression Engine
  const [ninoDialogue, setNinoDialogue] = useState<NinoDialogue>(() =>
    generateNinoGreeting({
      userName: user?.name || 'Viajante',
      personality: user?.preferences?.ninoPersonality || 'divertido',
      tasks,
      selectedDate,
    })
  );

  // Sync dark class to DOM and persist to localStorage
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('polaris_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('polaris_theme', 'light');
      } catch {}
    }
  }, [isDark]);

  // Supabase Initial Auth & Session Synchronization
  useEffect(() => {
    let isMounted = true;

    async function initSupabaseSession() {
      if (!isSupabaseConfigured()) {
        if (isMounted) {
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        const currentUser = await getFullCurrentUserData();
        if (currentUser && isMounted) {
          setUser(currentUser);
          const [remoteTasks, remoteNotes] = await Promise.all([
            fetchUserTasks(currentUser.id),
            fetchUserNotes(currentUser.id),
          ]);
          if (isMounted) {
            setTasks(remoteTasks || []);
            setNotes(remoteNotes || []);
          }
        } else if (isMounted) {
          setUser(null);
          setTasks([]);
          setNotes([]);
        }
      } catch (err) {
        console.warn('Initial Supabase session fetch error:', err);
        if (isMounted) {
          setUser(null);
          setTasks([]);
          setNotes([]);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    initSupabaseSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION')) {
        const fullUser = await getFullCurrentUserData();
        if (fullUser && isMounted) {
          setUser(fullUser);
          const [remoteTasks, remoteNotes] = await Promise.all([
            fetchUserTasks(fullUser.id),
            fetchUserNotes(fullUser.id),
          ]);
          if (isMounted) {
            setTasks(remoteTasks || []);
            setNotes(remoteNotes || []);
          }
        }
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
        setTasks([]);
        setNotes([]);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Persist user, tasks, and notes locally
  useEffect(() => {
    saveUserToStorage(user);
    if (user) {
      soundManager.setEnabled(user.preferences.soundEffectsEnabled);

      // Sync mascot evolution to Supabase if authenticated
      if (isAuthUser(user)) {
        if (user.polaris) {
          upsertCharacterSettings(user.id, user.polaris).catch((e) => console.warn('Supabase polaris sync warn:', e));
        }
      }
    }
  }, [user]);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Reload tasks & notes if active user ID changes
  const handleUserChange = async (newUser: UserProfile) => {
    setUser(newUser);
    if (isAuthUser(newUser)) {
      try {
        const [userTasks, userNotes] = await Promise.all([
          fetchUserTasks(newUser.id),
          fetchUserNotes(newUser.id),
        ]);
        setTasks(userTasks || []);
        setNotes(userNotes || []);
      } catch (e) {
        console.warn('Error fetching data from Supabase:', e);
        const userTasks = loadTasksFromStorage(newUser.id);
        const userNotes = loadNotesFromStorage(newUser.id);
        setTasks(userTasks);
        setNotes(userNotes);
      }
    } else {
      setTasks(loadTasksFromStorage(newUser.id));
      setNotes(loadNotesFromStorage(newUser.id));
    }
    soundManager.playPop();
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out warn:', e);
    }
    setUser(null);
    setTasks([]);
    soundManager.playPop();
  };

  // Re-calculate Nino's contextual dialogue
  const updateNinoState = useCallback(() => {
    if (!user) return;
    const dialogue = generateNinoGreeting({
      userName: user.name,
      personality: user.preferences.ninoPersonality,
      tasks,
      selectedDate,
    });
    setNinoDialogue(dialogue);
  }, [user?.name, user?.preferences?.ninoPersonality, tasks, selectedDate]);

  useEffect(() => {
    updateNinoState();
  }, [updateNinoState]);

  // Periodic Reminder & Overdue Alert Checker
  useEffect(() => {
    const checkRemindersAndOverdue = () => {
      // SILENCE ALL NOTIFICATIONS WHEN FOCUS MODE IS ACTIVE OR NO USER
      if (!user || focusModalOpen) {
        return;
      }

      const today = getTodayString();
      const prefs = user.preferences || {};
      const taskRemindersOn = prefs.taskRemindersEnabled ?? true;
      const overdueAlertsOn = prefs.overdueAlertsEnabled ?? true;
      const advanceRemindersOn = prefs.advanceRemindersEnabled ?? true;

      // 1. Approaching Task Reminders (Before scheduled time)
      if (taskRemindersOn && advanceRemindersOn) {
        const pendingToday = tasks.filter((t) => t.date === today && !t.completed && t.time);

        pendingToday.forEach((task) => {
          const mins = getMinutesUntil(task.date, task.time);
          if (mins !== null && mins > 0 && mins <= 15) {
            const notifId = `reminder-${task.id}-${task.time}`;
            if (!activeNotifications.some((n) => n.id === notifId)) {
              if (prefs.soundEffectsEnabled ?? true) {
                soundManager.playReminderAlert();
              }

              const message =
                prefs.ninoPersonality === 'divertido'
                  ? `Ei! Seu compromisso "${task.title}" começa daqui a ${mins} minutos! ⚡`
                  : prefs.ninoPersonality === 'profissional'
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

              // Dispatch real device Web Push notification
              if (prefs.browserNotificationsEnabled) {
                sendDeviceApproachingTaskNotification(task, mins).catch(() => {});
              }

              if (prefs.voiceEnabled) {
                speechService.speak(message);
              }
            }
          }
        });
      }

      // 2. Real Overdue Task Alerts
      if (overdueAlertsOn) {
        const overdueList = tasks.filter((t) => !t.completed && isTaskOverdue(t));

        overdueList.forEach((task) => {
          const delayInfo = getOverdueDelayInfo(task);
          if (!delayInfo.isOverdue) return;

          const overdueNotifId = `overdue-${task.id}-${task.date}-${task.time || 'all-day'}`;
          if (!activeNotifications.some((n) => n.id === overdueNotifId)) {
            const message = `⚠️ Atenção: A tarefa "${task.title}" está ${delayInfo.delayText.toLowerCase()}.`;

            setActiveNotifications((prev) => [
              ...prev,
              {
                id: overdueNotifId,
                task,
                message,
                timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              },
            ]);

            // Dispatch real device Web Push notification
            if (prefs.browserNotificationsEnabled) {
              sendDeviceOverdueNotification(task, delayInfo.delayText).catch(() => {});
            }
          }
        });
      }
    };

    checkRemindersAndOverdue();
    const interval = setInterval(checkRemindersAndOverdue, 30000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkRemindersAndOverdue();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [tasks, activeNotifications, user?.preferences, focusModalOpen]);

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
    if (isAuthUser(user) && isValidUUID(task.id)) {
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
      if (user?.preferences?.voiceEnabled) {
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
    if (!user) return;
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
    if (!user) return;
    const { updatedUser, levelUpEvent: lvlEvt } = performCareAction(user, actionType);
    setUser(updatedUser);
    soundManager.playPop();
    if (lvlEvt) {
      setLevelUpEvent(lvlEvt);
    }
  };

  const handleEquipAccessory = (id: string) => {
    soundManager.playPop();
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        polaris: {
          ...prev.polaris,
          equippedAccessory: id,
        },
      };
    });
  };

  const handleEquipOutfit = (id: string) => {
    soundManager.playPop();
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        polaris: {
          ...prev.polaris,
          equippedOutfit: id,
        },
      };
    });
  };

  const handleEquipAura = (id: string) => {
    soundManager.playPop();
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        polaris: {
          ...prev.polaris,
          equippedAura: id,
        },
      };
    });
  };

  const handleEquipColor = (color: NinoThemeColor) => {
    soundManager.playPop();
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          ninoColor: color,
        },
        polaris: {
          ...prev.polaris,
          equippedColor: color,
        },
      };
    });
  };

  const handleUnlockItem = (
    idOrType: string,
    costOrId: number | string,
    typeOrCost?: 'accessory' | 'outfit' | 'aura' | 'color' | number
  ) => {
    if (!user) return;
    let id: string;
    let cost: number;
    let type: 'accessory' | 'outfit' | 'aura' | 'color';

    if (typeof idOrType === 'string' && typeof costOrId === 'number') {
      id = idOrType;
      cost = costOrId;
      type = (typeOrCost as 'accessory' | 'outfit' | 'aura' | 'color') || 'accessory';
    } else {
      type = (idOrType as 'accessory' | 'outfit' | 'aura' | 'color') || 'accessory';
      id = String(costOrId);
      cost = Number(typeOrCost) || 0;
    }

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
      if (!prev) return null;
      const updatedUnlocked = Array.from(
        new Set([...(prev.polaris?.unlockedItems || []), id])
      );

      const isAcc = type === 'accessory';
      const isOutfit = type === 'outfit';
      const isAura = type === 'aura';
      const isColor = type === 'color';

      return {
        ...prev,
        preferences: isColor
          ? { ...prev.preferences, ninoColor: id as NinoThemeColor }
          : prev.preferences,
        polaris: {
          ...prev.polaris,
          stardust: Math.max(0, (prev.polaris?.stardust || 0) - cost),
          unlockedItems: updatedUnlocked,
          equippedAccessory: isAcc ? id : prev.polaris?.equippedAccessory,
          equippedOutfit: isOutfit ? id : prev.polaris?.equippedOutfit,
          equippedAura: isAura ? id : prev.polaris?.equippedAura,
          equippedColor: isColor ? (id as NinoThemeColor) : prev.polaris?.equippedColor,
        },
      };
    });
  };

  // Create or Update Task
  const handleSaveTask = async (taskData: Partial<Task>) => {
    const isSupabaseActive = isAuthUser(user);

    if (editingTask) {
      // Update existing
      setTasks(
        tasks.map((t) =>
          t.id === editingTask.id
            ? { ...t, ...taskData, id: editingTask.id, userId: user.id }
            : t
        )
      );

      if (isSupabaseActive && isValidUUID(editingTask.id)) {
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

      if (isSupabaseActive && isValidUUID(user.id)) {
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

    // Contextual Push Notification Prompt check
    const hasReminders = (taskData.reminders && taskData.reminders.length > 0) || !editingTask;
    if (
      hasReminders &&
      isPushNotificationSupported() &&
      getNotificationPermissionState() === 'default' &&
      localStorage.getItem('polaris_push_prompt_dismissed') !== 'true'
    ) {
      setTimeout(() => {
        setShowPushPromptModal(true);
      }, 500);
    }
  };

  const handleConfirmPushPrompt = async () => {
    setPushPromptLoading(true);
    try {
      const sub = await subscribeUserToPush(user?.id);
      if (sub && user) {
        handleUserChange({
          ...user,
          preferences: {
            ...user.preferences,
            browserNotificationsEnabled: true,
          },
        });
      }
    } catch (e) {
      console.warn('Push prompt subscribe error:', e);
    } finally {
      setPushPromptLoading(false);
      setShowPushPromptModal(false);
    }
  };

  const handleClosePushPrompt = () => {
    try {
      localStorage.setItem('polaris_push_prompt_dismissed', 'true');
    } catch {}
    setShowPushPromptModal(false);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter((t) => t.id !== taskId));
    soundManager.playPop();

    if (isAuthUser(user) && isValidUUID(taskId)) {
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

    if (isAuthUser(user) && isValidUUID(task.id)) {
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
    if (!user) return;
    soundManager.playPop();
    const randomQuote = getNinoInteractiveQuote(
      user.preferences?.ninoPersonality || 'divertido',
      user.name
    );
    setNinoDialogue(randomQuote);
    if (user.preferences?.voiceEnabled) {
      speechService.speak(randomQuote.text);
    }
  };

  // Test Notification Simulation
  const handleTestNotification = () => {
    if (!user) return;
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
        user.preferences?.ninoPersonality === 'divertido'
          ? 'Ei! Seu compromisso de teste começa daqui a 15 minutos! Melhor se preparar! ⚡'
          : 'Lembrete de compromisso agendado para as 15:00.',
      timestamp: 'Agora',
    };

    setActiveNotifications((prev) => [newNotif, ...prev]);

    if (user.preferences?.voiceEnabled) {
      speechService.speak(newNotif.message);
    }
  };

  // Note Handlers
  const handleCreateNote = async (title: string, content: string): Promise<Note | null> => {
    if (!user) return null;
    const isSupabaseActive = isAuthUser(user);
    const tempId = isSupabaseActive && isValidUUID(user.id) ? crypto.randomUUID() : `note-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const newNote: Note = {
      id: tempId,
      userId: user.id,
      title: title.trim(),
      content: content.trim(),
      isPinned: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setNotes((prev) => [newNote, ...prev]);
    soundManager.playPop();

    if (isSupabaseActive && isValidUUID(user.id)) {
      try {
        const createdRemote = await createNote(newNote);
        if (createdRemote && createdRemote.id) {
          setNotes((prev) =>
            prev.map((n) => (n.id === tempId ? createdRemote : n))
          );
          return createdRemote;
        }
      } catch (err) {
        console.warn('Supabase createNote error:', err);
      }
    }
    return newNote;
  };

  const handleUpdateNote = async (noteId: string, updates: Partial<Note>): Promise<void> => {
    const nowIso = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...updates, updatedAt: nowIso } : n))
    );

    if (isAuthUser(user) && isValidUUID(noteId)) {
      try {
        await updateNote(noteId, updates);
      } catch (err) {
        console.warn('Supabase updateNote error:', err);
      }
    }
  };

  const handleDeleteNote = async (noteId: string): Promise<void> => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    soundManager.playPop();

    if (isAuthUser(user) && isValidUUID(noteId)) {
      try {
        await deleteNote(noteId);
      } catch (err) {
        console.warn('Supabase deleteNote error:', err);
      }
    }
  };

  // Data Export & Import & Reset
  const handleExportData = () => {
    const json = exportAppData(user, tasks, notes);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `polaris_agenda_backup_${getTodayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  };

  const handleImportData = (jsonStr: string): boolean => {
    const data = importAppData(jsonStr);
    if (data) {
      if (data.user) setUser(data.user);
      if (data.tasks) setTasks(data.tasks);
      if (data.notes) setNotes(data.notes);
      soundManager.playSuccess();
      return true;
    }
    return false;
  };

  const handleResetDemoData = () => {
    if (!user) return;
    const demoTasks = getInitialDemoTasks(user.id);
    const demoNotes = getInitialDemoNotes(user.id);
    setTasks(demoTasks);
    setNotes(demoNotes);
    soundManager.playPop();
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (user) {
      setUser({
        ...user,
        preferences: {
          ...user.preferences,
          theme: nextDark ? 'dark' : 'light',
        },
      });
    }
  };

  const handleSelectTaskFromSearch = (task: Task) => {
    setSelectedDate(task.date);
    setEditingTask(task);
    setModalInitialDate(task.date);
    setModalInitialTime(task.time);
    setTaskModalOpen(true);
  };

  const handleSelectNoteFromSearch = (note: Note) => {
    setTargetNoteId(note.id);
    setActiveTab('notes');
  };

  const handleOpenNewNoteFromSearch = async (initialTitle?: string) => {
    if (!user) return;
    const newNote = await handleCreateNote(initialTitle?.trim() || 'Nova Nota', '');
    if (newNote) {
      setTargetNoteId(newNote.id);
      setActiveTab('notes');
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen w-full bg-[#FDFBF7] dark:bg-[#15120E] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
          P
        </div>
        <div className="text-xs font-bold font-['Outfit',sans-serif] text-slate-500 dark:text-slate-400">
          Carregando Polaris Agenda...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        onLogin={handleUserChange}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#FFFDF9] dark:bg-[#141210] text-slate-900 dark:text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-colors duration-300 antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Sticky Navbar */}
      <Navbar
        user={user}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
        notesCount={notes.length}
        onOpenNotifications={handleTestNotification}
        unreadNotificationsCount={activeNotifications.length}
        onTabSelect={(tab) => {
          soundManager.playPop();
          setActiveTab(tab);
        }}
        activeTab={activeTab}
        onStartFocus={() => handleStartFocusTask()}
        onOpenSanctuary={() => setSanctuaryModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
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
      <main id="main-content-viewport" className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4 sm:pt-5 pb-32 sm:pb-36 overflow-x-hidden min-w-0">
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
                notes={notes}
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

          {activeTab === 'notes' && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              <NotesView
                user={user}
                notes={notes}
                onCreateNote={handleCreateNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                initialSelectedNoteId={targetNoteId}
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

      {/* Global Search Modal (Ctrl+K or Lupa) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        tasks={tasks}
        notes={notes}
        user={user}
        onSelectTask={handleSelectTaskFromSearch}
        onSelectNote={handleSelectNoteFromSearch}
        onOpenNewTaskModal={(initialTitle) => {
          setEditingTask(null);
          setModalInitialDate(selectedDate);
          setModalInitialTime(undefined);
          setTaskModalOpen(true);
        }}
        onOpenNewNote={handleOpenNewNoteFromSearch}
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
        onUpdateUser={(updated) => setUser(updated)}
        onClaimMission={handleClaimMission}
        onCareAction={handleCareAction}
        onEquipAccessory={handleEquipAccessory}
        onEquipOutfit={handleEquipOutfit}
        onEquipAura={handleEquipAura}
        onEquipColor={handleEquipColor}
        onUnlockItem={handleUnlockItem}
      />

      {/* Polaris Cosmic Level Up / Evolution Celebration Modal */}
      <PolarisLevelUpModal
        event={levelUpEvent}
        user={user}
        onClose={() => setLevelUpEvent(null)}
        onOpenSanctuary={() => setSanctuaryModalOpen(true)}
      />

      {/* Push Notification Permission Modal */}
      <NotificationPermissionModal
        isOpen={showPushPromptModal}
        onClose={handleClosePushPrompt}
        onConfirm={handleConfirmPushPrompt}
        isLoading={pushPromptLoading}
      />
    </div>
  );
}
