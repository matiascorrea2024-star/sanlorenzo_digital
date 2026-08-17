-- Push notifications reales. Hasta ahora el onboarding le pedía permiso
-- de notificaciones al usuario (Notification.requestPermission()) pero
-- nunca se armó nada que realmente le mande algo -- se guardaba un flag
-- (notifications_opt_in) que no se leía en ningún lado. Esto conecta el
-- sistema de "notifications" que ya existe (mensajes, seguidores,
-- ofertas nuevas, etc.) con push real al navegador/celular, aunque la
-- app esté cerrada.
create extension if not exists pg_net;

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy push_subscriptions_own on push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cada notificación nueva dispara un webhook (fire-and-forget, no bloquea
-- el insert si el webhook tarda o falla) a una ruta protegida por un
-- secreto compartido -- mismo patrón de "tarea de sistema sin usuario
-- detrás" que ya usan las rutas de app/api/cron/* (CRON_SECRET), pero
-- con su propio secreto (PUSH_WEBHOOK_SECRET) porque este lo dispara la
-- base, no Vercel Cron. El secreto vive acá (solo lo puede leer el
-- dueño de la base) y como variable de entorno en Vercel para que la
-- ruta lo pueda comparar.
create or replace function public.notify_push_webhook()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  perform net.http_post(
    url := 'https://sanlorenzodigital.vercel.app/api/push/send',
    body := jsonb_build_object('notification_id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer e08b5b38e961430276bf0782ea8266ae386a22a6aeed54d409d2d759df1bc33a')
  );
  return new;
end;
$$;

create trigger trg_notify_push_webhook
after insert on notifications
for each row execute function public.notify_push_webhook();
