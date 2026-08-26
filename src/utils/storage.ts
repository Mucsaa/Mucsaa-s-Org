import { Task, UserProfile } from '../types';
import { getTodayString, addDays } from './dateUtils';
import { DEFAULT_POLARIS } from './rewards';

const STORAGE_KEYS = {
  TASKS: 'nino_agenda_tasks_v1',
  USER: 'nino_agenda_user_v1',
  USERS_LIST: 'nino_agenda_registered_users_v1',
};

export const DEFAULT_USER: UserProfile = {
  id: 'user_demo_1',
  name: 'Samuel',
  email: 'samuel@exemplo.com',
  streakDays: 4,
  lastActiveDate: getTodayString(),
  createdAt: new Date().toISOString(),
  tasksCompleted: 3,
  focusMinutes: 45,
  polaris: DEFAULT_POLARIS,
  preferences: {
    theme: 'light',
    ninoPersonality: 'divertido',
    ninoColor: 'indigo',
    voiceEnabled: false,
    soundEffectsEnabled: true,
    browserNotificationsEnabled: true,
    dailyGoal: 5,
  },
};

export function getInitialDemoTasks(userId: string): Task[] {
  const today = getTodayString();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  return [
    {
      id: 'task-1',
      title: 'Reunião de Alinhamento Semanal',
      description: 'Apresentar resultados do projeto e alinhar metas do trimestre com a equipe.',
      date: today,
      time: '10:00',
      category: 'work',
      priority: 'high',
      recurrence: 'weekly',
      estimatedMinutes: 45,
      reminders: [{ id: 'r1', offset: '15m' }],
      notes: 'Trazer métricas e gráficos atualizados.',
      completed: true,
      completedAt: `${today}T10:45:00.000Z`,
      createdAt: `${yesterday}T14:00:00.000Z`,
      userId,
    },
    {
      id: 'task-2',
      title: 'Treino Funcional e Corrida',
      description: '30 minutos de corrida leve + treino de mobilidade no parque.',
      date: today,
      time: '16:00',
      category: 'exercise',
      priority: 'medium',
      recurrence: 'weekdays',
      estimatedMinutes: 50,
      reminders: [{ id: 'r2', offset: '30m' }],
      notes: 'Levar garrafa de água e fones de ouvido.',
      completed: true,
      completedAt: `${today}T16:50:00.000Z`,
      createdAt: `${yesterday}T18:00:00.000Z`,
      userId,
    },
    {
      id: 'task-3',
      title: 'Finalizar Protótipo da Agenda Interativa',
      description: 'Testar animações do Nino, responsividade e fluxo de lembretes inteligentes.',
      date: today,
      time: '18:30',
      category: 'study',
      priority: 'urgent',
      recurrence: 'none',
      estimatedMinutes: 60,
      reminders: [{ id: 'r3', offset: '15m' }, { id: 'r3b', offset: '5m' }],
      notes: 'Verificar suporte ao modo escuro e síntese de voz.',
      completed: false,
      createdAt: `${today}T08:00:00.000Z`,
      userId,
    },
    {
      id: 'task-4',
      title: 'Passar no Supermercado Orgânico',
      description: 'Comprar frutas frescas, castanhas, leite vegetal e café em grãos.',
      date: today,
      time: '20:00',
      category: 'shopping',
      priority: 'medium',
      recurrence: 'none',
      estimatedMinutes: 30,
      reminders: [{ id: 'r4', offset: '1h' }],
      notes: 'Aproveitar a promoção de itens saudáveis.',
      completed: false,
      createdAt: `${today}T09:00:00.000Z`,
      userId,
    },
    {
      id: 'task-5',
      title: 'Revisar Finanças e Planejamento Mensal',
      description: 'Conferir extratos, organizar categorias de gastos e separar reserva.',
      date: tomorrow,
      time: '09:00',
      category: 'personal',
      priority: 'high',
      recurrence: 'monthly',
      estimatedMinutes: 40,
      reminders: [{ id: 'r5', offset: '30m' }],
      notes: 'Atualizar planilha de investimentos.',
      completed: false,
      createdAt: `${today}T11:00:00.000Z`,
      userId,
    },
    {
      id: 'task-6',
      title: 'Consulta Médica de Rotina',
      description: 'Checkup anual com Dr. Marcelo no Centro Clínico.',
      date: tomorrow,
      time: '14:30',
      category: 'health',
      priority: 'high',
      recurrence: 'none',
      estimatedMinutes: 60,
      reminders: [{ id: 'r6', offset: '1d' }, { id: 'r6b', offset: '1h' }],
      notes: 'Levar exames anteriores.',
      completed: false,
      createdAt: `${today}T12:00:00.000Z`,
      userId,
    },
    {
      id: 'task-7',
      title: 'Organizar Estante e Mesa de Trabalho',
      description: 'Limpeza rápida e organização de cabos do setup.',
      date: yesterday,
      time: '19:00',
      category: 'home',
      priority: 'low',
      recurrence: 'none',
      estimatedMinutes: 25,
      reminders: [],
      notes: '',
      completed: true,
      completedAt: `${yesterday}T19:30:00.000Z`,
      createdAt: `${yesterday}T15:00:00.000Z`,
      userId,
    }
  ];
}

export function loadUserFromStorage(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      saveUserToStorage(DEFAULT_USER);
      return DEFAULT_USER;
    }
    const parsed = JSON.parse(raw);
    const polaris = {
      ...DEFAULT_POLARIS,
      ...(parsed.polaris || {}),
      unlockedItems: Array.from(
        new Set([...(DEFAULT_POLARIS.unlockedItems || []), ...(parsed.polaris?.unlockedItems || [])])
      ),
    };
    return {
      ...DEFAULT_USER,
      ...parsed,
      polaris,
      tasksCompleted: parsed.tasksCompleted ?? DEFAULT_USER.tasksCompleted,
      focusMinutes: parsed.focusMinutes ?? DEFAULT_USER.focusMinutes,
      preferences: { ...DEFAULT_USER.preferences, ...parsed.preferences },
    };
  } catch {
    return DEFAULT_USER;
  }
}

export function saveUserToStorage(user: UserProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch {
    // Storage quota might be exceeded
  }
}

export function loadTasksFromStorage(userId: string): Task[] {
  if (typeof window === 'undefined') return getInitialDemoTasks(userId);
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      const demo = getInitialDemoTasks(userId);
      saveTasksToStorage(demo);
      return demo;
    }
    const parsed: Task[] = JSON.parse(raw);
    // Filter for current active user
    const userTasks = parsed.filter(t => t.userId === userId);
    if (userTasks.length === 0) {
      const demo = getInitialDemoTasks(userId);
      saveTasksToStorage([...parsed, ...demo]);
      return demo;
    }
    return userTasks;
  } catch {
    return getInitialDemoTasks(userId);
  }
}

export function saveTasksToStorage(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  try {
    // Preserve other users tasks if any
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    let allTasks: Task[] = [];
    if (raw) {
      try {
        allTasks = JSON.parse(raw);
      } catch {
        allTasks = [];
      }
    }
    // Update or merge
    const currentTaskIds = new Set(tasks.map(t => t.id));
    const otherTasks = allTasks.filter(t => !currentTaskIds.has(t.id));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([...otherTasks, ...tasks]));
  } catch {
    // Storage quota
  }
}

export function exportAppData(user: UserProfile, tasks: Task[]): string {
  return JSON.stringify({
    version: '1.0',
    exportDate: new Date().toISOString(),
    user,
    tasks,
  }, null, 2);
}

export function importAppData(jsonString: string): { user?: UserProfile; tasks?: Task[] } | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && (data.tasks || data.user)) {
      return { user: data.user, tasks: data.tasks };
    }
    return null;
  } catch {
    return null;
  }
}
