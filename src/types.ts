export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory = 
  | 'work'
  | 'study'
  | 'health'
  | 'home'
  | 'shopping'
  | 'exercise'
  | 'personal'
  | 'other';

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export type ReminderOffset = '5m' | '15m' | '30m' | '1h' | '1d' | 'custom';

export interface TaskReminder {
  id: string;
  offset: ReminderOffset;
  customMinutes?: number;
  triggered?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  isAllDay?: boolean;
  category: TaskCategory;
  customCategoryName?: string;
  customColor?: string;
  priority: TaskPriority;
  recurrence: RecurrenceType;
  estimatedMinutes?: number;
  reminders: TaskReminder[];
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  userId: string;
}

export type NinoPersonality = 'divertido' | 'profissional' | 'motivador' | 'tranquilo';

export type NinoExpression = 
  | 'happy' 
  | 'excited' 
  | 'concerned' 
  | 'sleepy' 
  | 'celebrating' 
  | 'thinking' 
  | 'proud'
  | 'neutral';

export type NinoThemeColor = 
  | 'indigo' 
  | 'emerald' 
  | 'amber' 
  | 'rose' 
  | 'violet' 
  | 'cyan'
  | 'orange'
  | 'red'
  | 'silver'
  | 'rainbow';

export type PolarisStage = 'baby' | 'young' | 'guardian' | 'master';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface PolarisColorItem {
  id: NinoThemeColor;
  name: string;
  description: string;
  icon: string;
  previewColor: string;
  gradientBg: string;
  minLevel: number;
  stardustCost: number;
  rarity: ItemRarity;
}

export interface PolarisOutfit {
  id: string;
  name: string;
  description: string;
  icon: string;
  minLevel: number;
  stardustCost: number;
  rarity: ItemRarity;
}

export interface PolarisAccessory {
  id: string;
  name: string;
  description: string;
  icon: string;
  minLevel: number;
  stardustCost: number;
  rarity: ItemRarity;
}

export interface PolarisAura {
  id: string;
  name: string;
  description: string;
  icon?: string;
  minLevel: number;
  stardustCost: number;
  rarity: ItemRarity;
  glowColor: string;
}

export interface PolarisEvolution {
  xp: number;
  level: number;
  stardust: number; // Cristais Estelares para a loja cósmica
  ageDays: number; // Idade cósmica em dias
  stage: PolarisStage;
  affinity: number; // 0 to 100 afeto
  equippedAccessory: string; // 'none' | accessory id
  equippedAura: string; // 'none' | aura id
  equippedOutfit?: string; // 'none' | outfit id
  equippedColor?: NinoThemeColor; // preferred theme color
  unlockedItems: string[];
  claimedMissions: string[]; // IDs of missions claimed today
  lastFedDate?: string;
  totalCareCount: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardStardust: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  iconName: string;
}

export interface LevelUpEvent {
  oldLevel: number;
  newLevel: number;
  oldStage: PolarisStage;
  newStage: PolarisStage;
  rewardStardust: number;
  unlockedItems: string[];
  evolved: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  ninoPersonality: NinoPersonality;
  ninoColor: NinoThemeColor;
  voiceEnabled: boolean;
  soundEffectsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  dailyGoal: number; // e.g. 5 tasks per day
  taskRemindersEnabled?: boolean; // Lembretes de tarefas
  overdueAlertsEnabled?: boolean; // Tarefas atrasadas
  advanceRemindersEnabled?: boolean; // Lembretes antes do horário
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  preferences: UserPreferences;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  createdAt: string;
  tasksCompleted: number;
  focusMinutes: number;
  polaris: PolarisEvolution;
}

export interface CategoryConfig {
  id: TaskCategory;
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
  textLight: string;
  borderLight: string;
}

export type ActiveTab = 'home' | 'calendar' | 'tasks' | 'stats' | 'profile' | 'notes';

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  category?: string;
  color?: string;
  isArchived?: boolean;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface NinoDialogue {
  text: string;
  expression: NinoExpression;
  actionText?: string;
  onAction?: () => void;
  urgent?: boolean;
}
