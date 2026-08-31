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
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          is_pinned: boolean;
          category: string | null;
          color: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          category?: string | null;
          color?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          is_pinned?: boolean;
          category?: string | null;
          color?: string | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          device_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          device_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          device_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      notification_deliveries: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          scheduled_for: string;
          sent_at: string;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          scheduled_for: string;
          sent_at?: string;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          scheduled_for?: string;
          sent_at?: string;
          status?: string;
        };
      };
    };
  };
}

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type CharacterSettingsRow = Database['public']['Tables']['character_settings']['Row'];
export type TaskHistoryRow = Database['public']['Tables']['task_history']['Row'];
export type NoteRow = Database['public']['Tables']['notes']['Row'];
export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row'];
export type NotificationDeliveryRow = Database['public']['Tables']['notification_deliveries']['Row'];

