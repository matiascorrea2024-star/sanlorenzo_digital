-- Turnos simples: para rubros de servicio (peluquerías, canchas,
-- talleres, profesionales) que hoy solo pueden coordinar horarios por
-- WhatsApp, ida y vuelta. El negocio define horario de atención y
-- duración de turno; el cliente reserva un horario libre directo.
--
-- El índice único parcial (solo turnos "confirmado") es lo que evita el
-- doble-booking a nivel de base: si dos personas tocan "reservar" al
-- mismo tiempo para el mismo horario, el segundo insert falla con
-- 23505 y el cliente reintenta con otro horario -- no hace falta una
-- ruta de servidor para esto, RLS + el índice ya lo garantizan.

create table if not exists public.booking_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  dias_semana int[] not null default '{1,2,3,4,5}', -- 0=domingo .. 6=sábado
  hora_desde time not null default '09:00',
  hora_hasta time not null default '18:00',
  duracion_min int not null default 30,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  fecha date not null,
  hora time not null,
  estado text not null default 'confirmado' check (estado in ('confirmado', 'cancelado')),
  nota text,
  created_at timestamptz not null default now()
);

create unique index if not exists bookings_slot_unique on public.bookings (business_id, fecha, hora) where estado = 'confirmado';
create index if not exists idx_bookings_business_fecha on public.bookings (business_id, fecha);
create index if not exists idx_bookings_user on public.bookings (user_id);

alter table public.booking_settings enable row level security;
alter table public.bookings enable row level security;

create policy "booking_settings_select" on public.booking_settings for select using (true);
create policy "booking_settings_write" on public.booking_settings for all
  using (exists (select 1 from businesses b where b.id = booking_settings.business_id and b.owner_id = auth.uid()) or is_admin())
  with check (exists (select 1 from businesses b where b.id = booking_settings.business_id and b.owner_id = auth.uid()) or is_admin());

-- Ver: el propio cliente, el dueño del negocio, o admin.
create policy "bookings_select" on public.bookings for select
  using (auth.uid() = user_id or exists (select 1 from businesses b where b.id = bookings.business_id and b.owner_id = auth.uid()) or is_admin());
-- Reservar: cualquier autenticado reserva PARA SÍ MISMO.
create policy "bookings_insert" on public.bookings for insert
  with check (auth.uid() = user_id);
-- Cancelar: el propio cliente o el dueño del negocio.
create policy "bookings_update" on public.bookings for update
  using (auth.uid() = user_id or exists (select 1 from businesses b where b.id = bookings.business_id and b.owner_id = auth.uid()) or is_admin());
