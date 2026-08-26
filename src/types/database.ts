export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          streak_days: number;
          last_active_date: string;
          tasks_completed: number;
          focus_minutes: number;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          streak_days?: number;
          last_active_date?: string;
          tasks_completed?: number;
          focus_minutes?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          streak_days?: number;
          last_active_date?: string;
          tasks_completed?: number;
          focus_minutes?: number;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          bg_light: string | null;
          bg_dark: string | null;
          text_light: string | null;
          border_light: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          bg_light?: string | null;
          bg_dark?: string | null;
          text_light?: string | null;
          border_light?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          icon?: string;
          color?: string;
          bg_light?: string | null;
          bg_dark?: string | null;
          text_light?: string | null;
          border_light?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          date: string;
          time: string | null;
          is_all_day: boolean;
          category: string;
          custom_category_name: string | null;
          custom_color: string | null;
          priority: string;
          recurrence: string;
          estimated_minutes: number | null;
          reminders: Json;
          notes: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          date: string;
          time?: string | null;
          is_all_day?: boolean;
          category?: string;
          custom_category_name?: string | null;
          custom_color?: string | null;
          priority?: string;
          recurrence?: string;
          estimated_minutes?: number | null;
          reminders?: Json;
          notes?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          date?: string;
          time?: string | null;
          is_all_day?: boolean;
          category?: string;
          custom_category_name?: string | null;
          custom_color?: string | null;
          priority?: string;
          recurrence?: string;
          estimated_minutes?: number | null;
          reminders?: Json;
          notes?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      character_settings: {
        Row: {
          id: string;
          user_id: string;
          xp: number;
          level: number;
          stardust: number;
          age_days: number;
          stage: string;
          affinity: number;
          equipped_accessory: string;
          equipped_aura: string;
          unlocked_items: string[];
          claimed_missions: string[];
          last_fed_date: string | null;
          total_care_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          xp?: number;
          level?: number;
          stardust?: number;
          age_days?: number;
          stage?: string;
          affinity?: number;
          equipped_accessory?: string;
          equipped_aura?: string;
          unlocked_items?: string[];
          claimed_missions?: string[];
          last_fed_date?: string | null;
          total_care_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          xp?: number;
          level?: number;
          stardust?: number;
          age_days?: number;
          stage?: string;
          affinity?: number;
          equipped_accessory?: string;
          equipped_aura?: string;
          unlocked_items?: string[];
          claimed_missions?: string[];
          last_fed_date?: string | null;
          total_care_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      task_history: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          action?: string;
          details?: Json | null;
          created_at?: string;
        };
      };
    };
  };
}

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type CharacterSettingsRow = Database['public']['Tables']['character_settings']['Row'];
export type TaskHistoryRow = Database['public']['Tables']['task_history']['Row'];
