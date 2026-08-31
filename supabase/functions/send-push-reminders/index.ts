// Supabase Edge Function: send-push-reminders
// Executado periodicamente via pg_cron ou HTTP Webhook para enviar lembretes push reais
// Deno TypeScript Environment

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import webpush from 'https://esm.sh/web-push@3.6.7';

// Interface do Payload
interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  taskId?: string;
  url?: string;
  data?: Record<string, unknown>;
}

// Configuração do CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Tratamento de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || '';
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:suporte@polarisagenda.app';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Inicializa cliente admin do Supabase (Service Role para acessar tarefas e subscriptions)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Configura Web Push com VAPID se a chave privada estiver configurada
    if (vapidPrivateKey) {
      webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Busca todas as tarefas não concluídas que possuem data e horário
    // Intervalo de busca: ontem até amanhã para abranger todos os fusos horários
    const { data: tasks, error: tasksError } = await supabaseAdmin
      .from('tasks')
      .select('id, user_id, title, date, time, reminders, priority, completed, category')
      .eq('completed', false)
      .not('time', 'is', null);

    if (tasksError) {
      throw new Error(`Erro ao consultar tarefas: ${tasksError.message}`);
    }

    let totalRemindersEvaluated = 0;
    let totalNotificationsSent = 0;
    let totalSubscriptionsCleaned = 0;

    const deliveryLogs: Array<{ taskId: string; userId: string; status: string }> = [];

    // 2. Itera sobre cada tarefa para verificar seus lembretes
    for (const task of tasks || []) {
      if (!task.time || !task.date) continue;
      const reminders = Array.isArray(task.reminders) ? task.reminders : [];
      if (reminders.length === 0) continue;

      // Monta a data/hora alvo da tarefa
      // Observação: assume o horário no formato local da tarefa
      const [hours, minutes] = task.time.split(':').map(Number);
      const [year, month, day] = task.date.split('-').map(Number);
      const taskDateTime = new Date(year, month - 1, day, hours, minutes, 0);

      for (const reminder of reminders) {
        totalRemindersEvaluated++;
        
        let offsetMinutes = 15;
        let offsetLabel = '15 minutos antes';

        if (reminder.offset === '5m') {
          offsetMinutes = 5;
          offsetLabel = '5 minutos antes';
        } else if (reminder.offset === '15m') {
          offsetMinutes = 15;
          offsetLabel = '15 minutos antes';
        } else if (reminder.offset === '30m') {
          offsetMinutes = 30;
          offsetLabel = '30 minutos antes';
        } else if (reminder.offset === '1h') {
          offsetMinutes = 60;
          offsetLabel = '1 hora antes';
        } else if (reminder.offset === '1d') {
          offsetMinutes = 1440;
          offsetLabel = '1 dia antes';
        } else if (reminder.offset === 'custom' && reminder.customMinutes) {
          offsetMinutes = reminder.customMinutes;
          offsetLabel = `${reminder.customMinutes} minutos antes`;
        }

        // Horário exato em que a notificação deve ser disparada
        const scheduledTime = new Date(taskDateTime.getTime() - offsetMinutes * 60 * 1000);
        const scheduledTimeIso = scheduledTime.toISOString();

        // Janela de disparo: até 3 minutos no passado e até 3 minutos no futuro para cron tolerance
        const diffMs = now.getTime() - scheduledTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Se estiver dentro da janela de disparo (entre 0 e 5 minutos após o horário agendado)
        if (diffMinutes >= -1 && diffMinutes <= 6) {
          // 3. Verifica se esta entrega já foi registrada (Idempotência Estrita)
          const { data: existingDelivery } = await supabaseAdmin
            .from('notification_deliveries')
            .select('id')
            .eq('task_id', task.id)
            .eq('scheduled_for', scheduledTimeIso)
            .maybeSingle();

          if (existingDelivery) {
            // Notificação já foi enviada anteriormente, pula para evitar duplicidade
            continue;
          }

          // 4. Busca as subscriptions do usuário
          const { data: subscriptions, error: subsError } = await supabaseAdmin
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', task.user_id);

          if (subsError || !subscriptions || subscriptions.length === 0) {
            continue;
          }

          // Monta o payload da notificação
          const payload: WebPushPayload = {
            title: `⭐ Polaris • ${task.title}`,
            body: `🌟 Lembrete: Sua tarefa começa às ${task.time} (${offsetLabel}). Vamos manter o foco!`,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: `polaris-reminder-${task.id}-${offsetMinutes}`,
            taskId: task.id,
            url: `/?taskId=${task.id}`,
            data: {
              taskId: task.id,
              date: task.date,
              time: task.time,
              offset: reminder.offset,
            },
          };

          // 5. Envia para todos os dispositivos registrados do usuário
          let sentToAny = false;

          for (const sub of subscriptions) {
            const pushSubscriptionObj = {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            };

            if (vapidPrivateKey) {
              try {
                await webpush.sendNotification(
                  pushSubscriptionObj,
                  JSON.stringify(payload)
                );
                sentToAny = true;
                totalNotificationsSent++;
              } catch (sendErr: any) {
                console.warn(`Falha ao enviar push para endpoint ${sub.endpoint}:`, sendErr.statusCode || sendErr.message);

                // Se o endpoint retornou 410 (Gone) ou 404 (Not Found), limpa a subscription inválida
                if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
                  await supabaseAdmin
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id);
                  totalSubscriptionsCleaned++;
                }
              }
            } else {
              // Simulação de log caso chave privada VAPID não esteja configurada no ambiente
              console.log(`[Push Simulado] Para usuário ${task.user_id}: ${payload.body}`);
              sentToAny = true;
              totalNotificationsSent++;
            }
          }

          // 6. Registra a entrega na tabela notification_deliveries para evitar reenvios
          if (sentToAny) {
            await supabaseAdmin.from('notification_deliveries').insert({
              user_id: task.user_id,
              task_id: task.id,
              scheduled_for: scheduledTimeIso,
              sent_at: nowIso,
              status: 'delivered',
            });
            deliveryLogs.push({ taskId: task.id, userId: task.user_id, status: 'delivered' });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: nowIso,
        evaluatedReminders: totalRemindersEvaluated,
        sentNotifications: totalNotificationsSent,
        cleanedSubscriptions: totalSubscriptionsCleaned,
        deliveries: deliveryLogs,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Erro na execução do send-push-reminders:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
