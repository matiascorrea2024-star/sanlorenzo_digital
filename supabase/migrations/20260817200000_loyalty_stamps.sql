-- Sellitos digitales: tarjeta de fidelidad tipo "la 10ma compra gratis",
-- sin plástico. El negocio define cuántos sellos hacen falta y el premio;
-- el cliente genera un código corto (parecido al de coupons) y se lo
-- muestra al comercio en el local; el dueño lo carga en su panel y ahí
-- recién se suma el sello -- así un cliente no puede autoasignarse
-- sellos, y el negocio no necesita cámara ni app de escaneo.

create table if not exists public.loyalty_programs (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  meta int not null default 10,
  premio text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.loyalty_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.loyalty_stamps (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  redeemed boolean not null default false
);

create index if not exists idx_loyalty_codes_lookup on public.loyalty_codes (business_id, code, used);
create index if not exists idx_loyalty_stamps_user_biz on public.loyalty_stamps (business_id, user_id, redeemed);

alter table public.loyalty_programs enable row level security;
alter table public.loyalty_codes enable row level security;
alter table public.loyalty_stamps enable row level security;

-- Programas: lectura pública (hace falta para mostrar la tarjeta a
-- cualquier visitante de la ficha), escritura solo del dueño del negocio.
create policy "loyalty_programs_select" on public.loyalty_programs for select using (true);
create policy "loyalty_programs_write" on public.loyalty_programs for all
  using (exists (select 1 from businesses b where b.id = loyalty_programs.business_id and b.owner_id = auth.uid()) or is_admin())
  with check (exists (select 1 from businesses b where b.id = loyalty_programs.business_id and b.owner_id = auth.uid()) or is_admin());

-- Códigos: cada uno genera el suyo, solo el dueño del negocio (o el mismo
-- cliente) puede verlo, y solo el dueño lo marca usado al validarlo.
create policy "loyalty_codes_select" on public.loyalty_codes for select
  using (auth.uid() = user_id or exists (select 1 from businesses b where b.id = loyalty_codes.business_id and b.owner_id = auth.uid()) or is_admin());
create policy "loyalty_codes_insert" on public.loyalty_codes for insert
  with check (auth.uid() = user_id);
create policy "loyalty_codes_update" on public.loyalty_codes for update
  using (exists (select 1 from businesses b where b.id = loyalty_codes.business_id and b.owner_id = auth.uid()) or is_admin());

-- Sellos: el cliente ve los suyos, el dueño ve/da/canjea los de su negocio.
create policy "loyalty_stamps_select" on public.loyalty_stamps for select
  using (auth.uid() = user_id or exists (select 1 from businesses b where b.id = loyalty_stamps.business_id and b.owner_id = auth.uid()) or is_admin());
create policy "loyalty_stamps_write" on public.loyalty_stamps for all
  using (exists (select 1 from businesses b where b.id = loyalty_stamps.business_id and b.owner_id = auth.uid()) or is_admin())
  with check (exists (select 1 from businesses b where b.id = loyalty_stamps.business_id and b.owner_id = auth.uid()) or is_admin());
