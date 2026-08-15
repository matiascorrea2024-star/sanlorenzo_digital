-- Hasta esta migración, activar/suspender/archivar una ciudad desde Admin
-- (locations.status) NO cortaba realmente la visibilidad pública de sus
-- negocios ni ofertas: businesses_select_all y offers_select_all eran
-- USING (true), sin relación con la ciudad. Una ciudad en draft/suspended/
-- archived seguía siendo capaz de aparecer en Home, /negocios, /mapa,
-- /ranking, /radar, La Gran Barata, etc. si algún negocio quedaba asociado
-- a ella -- el filtrado de "ciudad activa" solo existía, parcialmente, en
-- el código de /[ciudad] agregado en la migración anterior.
--
-- Esta función centraliza esa regla a nivel de base (un solo lugar, no una
-- por cada una de las 30+ queries públicas del sitio) para que activar una
-- ciudad realmente habilite su ecosistema y desactivarla/suspenderla/
-- archivarla realmente lo corte, sin tener que tocar cada ruta.
--
-- location_id = null se considera visible (retrocompatibilidad: negocios
-- cargados antes de que existiera la asignación de ciudad).
create or replace function public.location_is_active(loc_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $$
  select loc_id is null or exists (
    select 1 from locations l
    where l.id = loc_id
      and l.status = 'active'
      and (
        l.parent_id is null
        or exists (select 1 from locations p where p.id = l.parent_id and p.status = 'active')
      )
  );
$$;

comment on function public.location_is_active(uuid) is
  'true si loc_id es null (negocio sin ciudad asignada) o si la ciudad/barrio (y su ciudad padre, si es un barrio) tienen status = active. Usada en RLS de businesses/offers para que el ciclo de vida de la ciudad controle realmente la visibilidad pública.';

-- El dueño del negocio y los admins siguen viendo/editando todo sin
-- importar el estado de la ciudad (biz_write / offers_write, sin tocar) --
-- esto solo restringe la policy de lectura PÚBLICA.
drop policy if exists businesses_select_all on businesses;
create policy businesses_select_all on businesses
  for select
  using (public.location_is_active(location_id));

drop policy if exists offers_select_all on offers;
create policy offers_select_all on offers
  for select
  using (
    exists (
      select 1 from businesses b
      where b.id = offers.business_id
        and public.location_is_active(b.location_id)
    )
  );
