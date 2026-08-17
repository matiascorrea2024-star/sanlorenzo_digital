-- /api/visit y /api/track son endpoints públicos sin autenticar, sin
-- límite de frecuencia: un script simple puede spamearlos para
-- inflar "visitas reales" (admin) y analytics_events (dashboard del
-- comerciante) -- el dato que reemplazó a los números fabricados
-- esta sesión. Mismo patrón ya usado para el chat: trigger de rate
-- limit por IP a nivel de base, no solo del lado del cliente.

create or replace function public.check_visits_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.ip is not null and new.ip <> 'desconocida' and exists (
    select 1 from public.visits v
    where v.ip = new.ip
      and v.created_at > now() - interval '5 seconds'
    having count(*) >= 20
  ) then
    raise exception 'DEMASIADAS_VISITAS';
  end if;
  return new;
end;
$$;

create trigger trg_visits_rate_limit
before insert on visits
for each row execute function public.check_visits_rate_limit();

create or replace function public.check_page_views_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.ip is not null and new.ip <> '' and exists (
    select 1 from public.page_views p
    where p.ip = new.ip
      and p.viewed_at > now() - interval '5 seconds'
    having count(*) >= 20
  ) then
    raise exception 'DEMASIADAS_VISITAS';
  end if;
  return new;
end;
$$;

create trigger trg_page_views_rate_limit
before insert on page_views
for each row execute function public.check_page_views_rate_limit();

-- analytics_events: además del límite de frecuencia, event_type queda
-- restringido al set real que emite lib/hooks/use-analytics.ts -- antes
-- aceptaba cualquier string, dejando la tabla abierta a basura arbitraria.
alter table analytics_events
  add constraint analytics_events_event_type_check
  check (event_type in (
    'view_business', 'view_offer', 'click_whatsapp', 'click_map',
    'favorite', 'follow', 'search', 'coupon_generated', 'coupon_redeemed'
  ));

-- No tenía columna ip (a diferencia de visits/page_views) -- sin eso, la
-- única forma de "limitar por IP" sería agrupar por business_id, lo que
-- frenaría eventos reales de un negocio con mucho tráfico simultáneo.
alter table analytics_events add column if not exists ip text;

create or replace function public.check_analytics_events_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.ip is not null and new.ip <> '' and exists (
    select 1 from public.analytics_events a
    where a.ip = new.ip
      and a.created_at > now() - interval '5 seconds'
    having count(*) >= 20
  ) then
    raise exception 'DEMASIADOS_EVENTOS';
  end if;
  return new;
end;
$$;

create trigger trg_analytics_events_rate_limit
before insert on analytics_events
for each row execute function public.check_analytics_events_rate_limit();
