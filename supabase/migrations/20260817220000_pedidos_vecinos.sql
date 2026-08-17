-- "¿Quién tiene esto?": tablón inverso -- el vecino publica qué está
-- buscando y los negocios/particulares le responden. Le da vida a
-- rubros que hoy casi no publican ofertas propias (nadie tiene una
-- oferta armada de "repuesto de tal cosa", pero puede tenerlo en
-- stock). Mismo scope por ciudad que el chat de comunidad.

create table if not exists public.pedidos_vecinos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  texto text not null,
  resuelto boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pedido_respuestas (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos_vecinos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete set null,
  mensaje text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pedidos_location on public.pedidos_vecinos (location_id, created_at desc);
create index if not exists idx_respuestas_pedido on public.pedido_respuestas (pedido_id, created_at);

alter table public.pedidos_vecinos enable row level security;
alter table public.pedido_respuestas enable row level security;

create policy "pedidos_select" on public.pedidos_vecinos for select using (true);
create policy "pedidos_insert" on public.pedidos_vecinos for insert with check (auth.uid() = user_id);
create policy "pedidos_update" on public.pedidos_vecinos for update
  using (auth.uid() = user_id or is_admin());

create policy "pedido_respuestas_select" on public.pedido_respuestas for select using (true);
create policy "pedido_respuestas_insert" on public.pedido_respuestas for insert with check (auth.uid() = user_id);
create policy "pedido_respuestas_delete" on public.pedido_respuestas for delete
  using (auth.uid() = user_id or is_admin());
