# Edge Function: send-push-reminders (Polaris Agenda)

Esta Edge Function verifica periodicamente as tarefas pendentes no Supabase com lembretes agendados e dispara notificações Web Push reais para todos os dispositivos cadastrados dos usuários.

## ⚙️ Variáveis de Ambiente no Supabase (Secrets)

No painel do Supabase -> **Settings** -> **Edge Functions** (ou via CLI `supabase secrets set`):

| Variável | Descrição | Exemplo |
|---|---|---|
| `SUPABASE_URL` | URL do seu projeto Supabase | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (segredo do backend) | `ey...` |
| `VAPID_PUBLIC_KEY` | Chave pública VAPID | `BEl62iUY...` |
| `VAPID_PRIVATE_KEY` | Chave privada VAPID (secreta) | `...` |
| `VAPID_SUBJECT` | Contato administrativo VAPID | `mailto:seu-email@dominio.com` |

## 🚀 Como fazer Deploy via Supabase CLI

```bash
supabase functions deploy send-push-reminders --no-verify-jwt
```

## ⏰ Configuração de Agendamento Automático (pg_cron)

Execute no **SQL Editor** do Supabase para disparar a função a cada minuto:

```sql
-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Agendar a execução a cada minuto
SELECT cron.schedule(
  'polaris-push-reminders-job',
  '* * * * *', -- a cada minuto
  $$
  SELECT net.http_post(
    url:='https://qytekphleuholefczmyo.supabase.co/functions/v1/send-push-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);
```

## 🛡️ Idempotência e Limpeza Automática

- **Sem duplicidades**: cada lembrete de tarefa para um horário específico é registrado na tabela `notification_deliveries`.
- **Limpeza de endpoints mortos**: se um navegador desinstalar a aplicação ou revogar a permissão (HTTP 410 Gone ou 404), a subscription é removida automaticamente do banco de dados.
