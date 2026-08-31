// Serviço Supabase para Gerenciamento de Push Subscriptions e Entregas de Notificações
import { supabase, isSupabaseConfigured, isValidUUID } from '../../lib/supabaseClient';

export interface PushSubscriptionData {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceType?: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationDeliveryRecord {
  id: string;
  user_id: string;
  task_id: string;
  scheduled_for: string;
  sent_at: string;
  status: string;
}

/**
 * Salva ou atualiza a subscription do dispositivo no Supabase
 */
export async function savePushSubscription(data: PushSubscriptionData): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(data.userId)) {
    return false;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== data.userId) {
      return false;
    }

    const payload = {
      user_id: data.userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      device_type: data.deviceType || 'unknown',
      updated_at: new Date().toISOString(),
    };

    // Upsert baseado no endpoint único
    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' });

    if (error) {
      console.warn('Supabase savePushSubscription note:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Supabase savePushSubscription exception:', error);
    return false;
  }
}

/**
 * Remove a subscription pelo endpoint do dispositivo
 */
export async function removePushSubscriptionByEndpoint(
  endpoint: string,
  userId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !endpoint) {
    return false;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return false;
    }

    const { error } = await (supabase as any)
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', userId);

    if (error) {
      console.warn('Supabase removePushSubscription note:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Supabase removePushSubscription exception:', error);
    return false;
  }
}

/**
 * Busca todas as subscriptions ativas do usuário
 */
export async function fetchUserPushSubscriptions(
  userId: string
): Promise<PushSubscriptionRecord[]> {
  if (!isSupabaseConfigured() || !isValidUUID(userId)) {
    return [];
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
      return [];
    }

    const { data, error } = await (supabase as any)
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchUserPushSubscriptions note:', error.message || error);
      return [];
    }

    return (data || []) as PushSubscriptionRecord[];
  } catch (error) {
    console.warn('Supabase fetchUserPushSubscriptions exception:', error);
    return [];
  }
}

/**
 * Registra o envio de uma notificação para garantir idempotência estrita
 */
export async function recordNotificationDelivery(
  userId: string,
  taskId: string,
  scheduledFor: string,
  status: string = 'sent'
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(userId) || !isValidUUID(taskId)) {
    return false;
  }

  try {
    const { error } = await (supabase as any)
      .from('notification_deliveries')
      .insert({
        user_id: userId,
        task_id: taskId,
        scheduled_for: scheduledFor,
        sent_at: new Date().toISOString(),
        status,
      });

    if (error) {
      // Código 23505 indica conflito único (já enviada), o que é esperado e desejado
      if (error.code === '23505') {
        return true;
      }
      console.warn('Supabase recordNotificationDelivery note:', error.message || error);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Supabase recordNotificationDelivery exception:', error);
    return false;
  }
}

/**
 * Verifica se uma notificação já foi enviada para evitar duplicidades
 */
export async function checkNotificationDelivery(
  taskId: string,
  scheduledFor: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidUUID(taskId)) {
    return false;
  }

  try {
    const { data, error } = await (supabase as any)
      .from('notification_deliveries')
      .select('id')
      .eq('task_id', taskId)
      .eq('scheduled_for', scheduledFor)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  } catch (error) {
    return false;
  }
}
