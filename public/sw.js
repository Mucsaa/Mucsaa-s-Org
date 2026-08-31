// Service Worker do Polaris Agenda - Sistema Real de Notificações Web Push
// Versão 1.2.0

const CACHE_NAME = 'polaris-cache-v1';

self.addEventListener('install', (event) => {
  // Ativa imediatamente a nova versão do service worker sem aguardar
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Reivindica todos os clientes imediatamente
  event.waitUntil(self.clients.claim());
});

// Evento de Recebimento de Notificação Push em Segundo Plano
self.addEventListener('push', (event) => {
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      try {
        data = { body: event.data.text() };
      } catch (err) {
        data = {};
      }
    }
  }

  const title = data.title || '⭐ Polaris Agenda';
  const body = data.body || 'Você tem um lembrete de tarefa programado no Polaris!';
  const icon = data.icon || '/icon.svg';
  const badge = data.badge || '/icon.svg';
  const tag = data.tag || `polaris-task-${data.taskId || Date.now()}`;
  const taskId = data.taskId || (data.data && data.data.taskId) || null;
  const url = data.url || (taskId ? `/?taskId=${taskId}` : '/');

  const options = {
    body,
    icon,
    badge,
    tag,
    data: {
      url,
      taskId,
      timestamp: Date.now(),
      ...(data.data || {}),
    },
    vibrate: [100, 50, 100],
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open_task',
        title: '🔍 Ver Tarefa',
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Evento de Clique na Notificação Push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || (notificationData.taskId ? `/?taskId=${notificationData.taskId}` : '/');
  const taskId = notificationData.taskId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existe uma janela aberta, foca nela e envia mensagem com o taskId
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (taskId) {
            client.postMessage({
              type: 'POLARIS_NOTIFICATION_CLICK',
              taskId: taskId,
              action: event.action,
            });
          }
          return client.navigate ? client.navigate(targetUrl) : Promise.resolve();
        }
      }
      // Se nenhuma janela estiver aberta, abre uma nova janela do Polaris
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Listener para mensagens diretas do cliente (ex: testes locais)
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_LOCAL_NOTIFICATION') {
    const { title, body, taskId, data } = event.data;
    self.registration.showNotification(title || '⭐ Polaris Agenda', {
      body: body || 'Notificação de teste do Polaris!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `polaris-local-${Date.now()}`,
      data: {
        url: taskId ? `/?taskId=${taskId}` : '/',
        taskId: taskId || null,
        ...data,
      },
      vibrate: [80, 40, 80],
    });
  }
});
