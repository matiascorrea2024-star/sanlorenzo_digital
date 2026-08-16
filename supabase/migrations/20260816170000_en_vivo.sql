-- Módulo "En Vivo": transmisiones de comercios con productos/ofertas
-- asociados y chat en tiempo real. El video en sí lo maneja LiveKit
-- (WebRTC externo) -- esta base solo guarda metadata, estado, moderación
-- y el chat (por Supabase Realtime, mismo patrón que el chat negocio↔
-- cliente que ya existía).
create table live_streams (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  title text not null,
  description text,
  category text,
  cover_url text,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  room_name text not null unique default gen_random_uuid()::text,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  max_viewers integer not null default 0,
  total_viewers integer not null default 0,
  -- moderación de admin: un vivo bloqueado deja de ser público al toque,
  -- sin borrar el historial ni las estadísticas.
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create table live_stream_items (
  id uuid primary key default gen_random_uuid(),
  live_stream_id uuid not null references live_streams(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  offer_id uuid references offers(id) on delete set null,
  promo_price numeric,
  created_at timestamptz not null default now()
);

create table live_stream_messages (
  id uuid primary key default gen_random_uuid(),
  live_stream_id uuid not null references live_streams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  sender_name text not null,
  body text not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un comercio suspendido (businesses.activo = false) o de una ciudad no
-- activa no puede transmitir públicamente -- reusa location_is_active()
-- ya creada para negocios/ofertas, mismo motor, sin lógica especial.
create or replace function public.stream_is_public(biz_id uuid, is_blocked boolean)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select not is_blocked
    and exists (
      select 1 from businesses b
      where b.id = biz_id
        and b.activo is not false
        and public.location_is_active(b.location_id)
    );
$$;

alter table live_streams enable row level security;
alter table live_stream_items enable row level security;
alter table live_stream_messages enable row level security;

create policy live_streams_select_public on live_streams
  for select using (public.stream_is_public(business_id, blocked));

create policy live_streams_write on live_streams
  for all using (
    is_admin() or exists (select 1 from businesses b where b.id = live_streams.business_id and b.owner_id = auth.uid())
  );

create policy live_stream_items_select_public on live_stream_items
  for select using (
    exists (select 1 from live_streams s where s.id = live_stream_items.live_stream_id and public.stream_is_public(s.business_id, s.blocked))
  );

create policy live_stream_items_write on live_stream_items
  for all using (
    is_admin() or exists (
      select 1 from live_streams s join businesses b on b.id = s.business_id
      where s.id = live_stream_items.live_stream_id and b.owner_id = auth.uid()
    )
  );

create policy live_stream_messages_select_public on live_stream_messages
  for select using (
    not hidden and exists (select 1 from live_streams s where s.id = live_stream_messages.live_stream_id and public.stream_is_public(s.business_id, s.blocked))
  );

-- Cualquier usuario autenticado puede escribir en el chat de un vivo
-- público (mismo criterio que notifications_insert_trigger: with_check
-- true, la moderación pasa por poder ocultar/borrar después, no por
-- restringir quién escribe).
create policy live_stream_messages_insert on live_stream_messages
  for insert with check (auth.uid() = user_id);

create policy live_stream_messages_moderate on live_stream_messages
  for update using (
    is_admin() or exists (
      select 1 from live_streams s join businesses b on b.id = s.business_id
      where s.id = live_stream_messages.live_stream_id and b.owner_id = auth.uid()
    )
  );

create policy live_stream_messages_delete on live_stream_messages
  for delete using (
    is_admin() or exists (
      select 1 from live_streams s join businesses b on b.id = s.business_id
      where s.id = live_stream_messages.live_stream_id and b.owner_id = auth.uid()
    )
  );
