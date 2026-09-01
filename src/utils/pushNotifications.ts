// Utilitários e Gerenciador do Sistema de Notificações Web Push do Polaris Agenda
import { Task } from '../types';
import { savePushSubscription, removePushSubscriptionByEndpoint } from '../services/supabase/push';

// Chave pública VAPID (pode ser personalizada via .env VITE_VAPID_PUBLIC_KEY)
// Esta chave é PÚBLICA e segura para uso no cliente web.
export const DEFAULT_VAPID_PUBLIC_KEY =
  (import.meta as any).env?.VITE_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

/**
 * Converte chave base64url VAPID para Uint8Array exigido pela Push API
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Verifica se o ambiente do navegador suporta Service Workers e Push API
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Retorna o estado atual da permissão de notificação ('granted' | 'denied' | 'default')
 */
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}

/**
 * Detecta se o dispositivo é iOS (iPhone / iPad)
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

/**
 * Detecta se o aplicativo está rodando em modo PWA instalado (Standalone)
 */
export function isPWAStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

/**
 * Detecta o tipo de dispositivo para fins de auditoria no Supabase
 */
export function getDeviceType(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (isIOSDevice()) {
    return isPWAStandalone() ? 'ios_pwa' : 'ios_browser';
  }
  if (/Android/i.test(ua)) {
    return isPWAStandalone() ? 'android_pwa' : 'android_browser';
  }
  if (/Macintosh|Mac OS/i.test(ua)) return 'desktop_mac';
  if (/Windows/i.test(ua)) return 'desktop_windows';
  if (/Linux/i.test(ua)) return 'desktop_linux';
  return 'desktop_browser';
}

/**
 * Registra o Service Worker do Polaris se ainda não registrado
 */
export async function registerPolarisServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushNotificationSupported()) {
    console.warn('Polaris Push: Notificações não suportadas neste ambiente.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Aguarda o worker estar pronto
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error('Erro ao registrar Service Worker do Polaris:', error);
    return null;
  }
}

/**
 * Retorna a PushSubscription atual se existir
 */
export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn('Erro ao obter subscription existente:', error);
    return null;
  }
}

/**
 * Fluxo completo de ativação e registro de Push Subscription no Supabase
 */
export async function subscribeUserToPush(
  userId?: string,
  vapidKey: string = DEFAULT_VAPID_PUBLIC_KEY
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      error: 'Seu navegador ou dispositivo atual não suporta Web Push / Notificações.',
    };
  }

  // No iOS, alerta se não estiver instalado na tela de início
  if (isIOSDevice() && !isPWAStandalone()) {
    return {
      success: false,
      error: 'No iPhone/iOS, adicione o Polaris à Tela de Início (Toque em Compartilhar ➔ Adicionar à Tela de Início) para receber notificações.',
    };
  }

  try {
    // 1. Solicita a permissão nativa
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error:
          permission === 'denied'
            ? 'Permissão bloqueada no navegador. Para ativar: clique no ícone de configurações/cadeado ao lado da barra de endereços (URL), altere Notificações para "Permitir" e recarregue a página.'
            : 'Permissão de notificação não foi concedida.',
      };
    }

    // 2. Garante o registro do Service Worker
    let registration = await registerPolarisServiceWorker();
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }
    if (!registration) {
      return {
        success: false,
        error: 'Falha ao inicializar o Service Worker do Polaris.',
      };
    }

    // 3. Obtém ou cria a Push Subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // 4. Extrai as chaves p256dh e auth da subscription
    const rawP256dh = subscription.getKey('p256dh');
    const rawAuth = subscription.getKey('auth');

    if (rawP256dh && rawAuth) {
      const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawP256dh)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const deviceType = getDeviceType();

      // 5. Salva no Supabase na tabela push_subscriptions se usuário autenticado
      if (userId) {
        await savePushSubscription({
          userId,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          deviceType,
        });
      }
    }

    return {
      success: true,
      subscription,
    };
  } catch (error: any) {
    console.error('Erro no fluxo de Push Subscription:', error);
    return {
      success: false,
      error: error?.message || 'Ocorreu um erro ao ativar notificações no dispositivo.',
    };
  }
}

/**
 * Desativa as notificações no dispositivo e remove do Supabase
 */
export async function unsubscribeUserFromPush(userId?: string): Promise<boolean> {
  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      if (userId) {
        await removePushSubscriptionByEndpoint(endpoint, userId);
      }
    }
    return true;
  } catch (error) {
    console.error('Erro ao desativar push subscription:', error);
    return false;
  }
}

/**
 * Dispara uma notificação real de teste no dispositivo via Service Worker
 */
export async function testDevicePushNotification(
  task?: Task,
  _userId?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return {
      success: false,
      error: 'Web Push ou Notificações não são suportados neste dispositivo/navegador.',
    };
  }

  const perm = getNotificationPermissionState();
  if (perm !== 'granted') {
    if (perm === 'denied') {
      return {
        success: false,
        error: 'Permissão de notificação está bloqueada no navegador. Permita notificações nas configurações do site primeiro.',
      };
    }
    return {
      success: false,
      error: 'Permissão de notificação ainda não foi concedida. Clique em "Ativar Push no Dispositivo" primeiro.',
    };
  }

  try {
    let registration = await registerPolarisServiceWorker();
    if (!registration) {
      registration = await navigator.serviceWorker.ready;
    }
    if (!registration) {
      return {
        success: false,
        error: 'Service Worker do Polaris não está pronto no navegador.',
      };
    }

    const taskTitle = task?.title || 'Revisar metas do Polaris';
    const taskTime = task?.time || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const notificationOptions: any = {
      body: `🌟 Lembrete: Sua tarefa "${taskTitle}" está programada para ${taskTime}. Vamos manter o foco!`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `polaris-test-${Date.now()}`,
      renotify: true,
      vibrate: [150, 80, 150],
      data: {
        taskId: task?.id || null,
        url: task?.id ? `/?taskId=${task.id}` : '/',
        timestamp: Date.now(),
        isTest: true,
      },
      actions: [
        {
          action: 'open_app',
          title: 'Abrir Polaris',
        },
        {
          action: 'dismiss',
          title: 'Fechar',
        },
      ],
    };

    await registration.showNotification('⭐ Polaris Agenda • Notificação Push Real', notificationOptions);
    return { success: true };
  } catch (err: any) {
    console.warn('Erro ao disparar notificação local pelo Service Worker:', err);
    return {
      success: false,
      error: err?.message || 'Falha ao exibir notificação no dispositivo.',
    };
  }
}

/**
 * Dispara uma notificação real de alerta de tarefa atrasada no dispositivo
 */
export async function sendDeviceOverdueNotification(
  task: Task,
  delayText: string
): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Web Push não suportado.' };
  }

  const perm = getNotificationPermissionState();
  if (perm !== 'granted') {
    return { success: false, error: 'Permissão não concedida.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const notificationOptions: any = {
      body: `"${task.title}" está ${delayText.toLowerCase()}. Toque para abrir e concluir ou reagendar.`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `polaris-overdue-${task.id}-${task.date}`,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        taskId: task.id,
        url: `/?taskId=${task.id}`,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open_app',
          title: 'Abrir Tarefa',
        },
        {
          action: 'dismiss',
          title: 'Ignorar',
        },
      ],
    };

    await registration.showNotification('⚠️ Tarefa Atrasada • Polaris Agenda', notificationOptions);
    return { success: true };
  } catch (err: any) {
    console.warn('Erro ao disparar notificação de tarefa atrasada:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Dispara uma notificação de lembrete antes do horário agendado
 */
export async function sendDeviceApproachingTaskNotification(
  task: Task,
  minutesUntil: number
): Promise<{ success: boolean; error?: string }> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: 'Web Push não suportado.' };
  }

  const perm = getNotificationPermissionState();
  if (perm !== 'granted') {
    return { success: false, error: 'Permissão não concedida.' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const timeInfo = task.time ? ` às ${task.time}` : '';
    const notificationOptions: any = {
      body: `Sua tarefa "${task.title}" começará em ${minutesUntil} min${timeInfo}. Foco total!`,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `polaris-reminder-${task.id}-${task.time || 'all-day'}`,
      renotify: true,
      vibrate: [100, 50, 100],
      data: {
        taskId: task.id,
        url: `/?taskId=${task.id}`,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open_app',
          title: 'Ver Tarefa',
        },
        {
          action: 'dismiss',
          title: 'Ok',
        },
      ],
    };

    await registration.showNotification('⏰ Lembrete de Tarefa • Polaris Agenda', notificationOptions);
    return { success: true };
  } catch (err: any) {
    console.warn('Erro ao disparar notificação de lembrete de tarefa:', err);
    return { success: false, error: err?.message };
  }
}

