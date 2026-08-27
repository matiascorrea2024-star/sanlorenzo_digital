-- "Avisame si vuelve" / baja de precio: user_alerts ya guardaba estas
-- alertas (desde /oferta/[id] cuando la oferta ya venció, desde la ficha
-- de negocio y desde /ofertas-finalizadas) y el push real ya existe
-- (notifications -> trg_notify_push_webhook), pero nada las disparaba
-- nunca -- se guardaban y ahí quedaban para siempre.
--
-- Dos casos reales, según cómo se creó la alerta:
--  1) offer_id específico (la oferta ya había vencido cuando se pidió
--     el aviso): dispara cuando ESA MISMA oferta se reactiva
--     (active false -> true), o si sigue activa y baja por debajo del
--     precio guardado.
--  2) solo business_id (pedido desde la ficha del negocio o desde
--     ofertas finalizadas, sin una oferta puntual en mente): dispara
--     cuando ese negocio publica una oferta nueva.

create or replace function public.detectar_oferta_disponible()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  alerta record;
  volvio boolean;
  bajo_precio boolean;
begin
  volvio := (tg_op = 'UPDATE' and new.active = true and coalesce(old.active, false) = false);
  bajo_precio := (
    tg_op = 'UPDATE' and new.active = true
    and new.offer_price is not null and old.offer_price is not null
    and new.offer_price < old.offer_price
  );

  if tg_op = 'UPDATE' and (volvio or bajo_precio) then
    for alerta in
      select * from public.user_alerts
      where status = 'active' and alert_type = 'offer_back' and offer_id = new.id
        and (original_price is null or new.offer_price is null or new.offer_price <= original_price or volvio)
    loop
      insert into public.notifications (user_id, type, title, body, link)
      values (
        alerta.user_id,
        'offer_back',
        case when bajo_precio then '📉 Bajó de precio' else '🔔 Volvió la oferta que seguías' end,
        coalesce(alerta.product_name, 'Una oferta que seguías') ||
          case when bajo_precio then ' ahora está más barata.' else ' está disponible de nuevo.' end,
        '/oferta/' || new.id
      );
      update public.user_alerts set status = 'triggered', triggered_at = now() where id = alerta.id;
    end loop;
  end if;

  if tg_op = 'INSERT' and new.active = true then
    for alerta in
      select * from public.user_alerts
      where status = 'active' and alert_type = 'offer_back'
        and offer_id is null and business_id = new.business_id
    loop
      insert into public.notifications (user_id, type, title, body, link)
      values (
        alerta.user_id,
        'offer_back',
        '🔔 Novedad del negocio que seguías',
        coalesce(alerta.product_name, 'Un negocio que seguías') || ' publicó algo nuevo: ' || new.title,
        '/oferta/' || new.id
      );
      update public.user_alerts set status = 'triggered', triggered_at = now() where id = alerta.id;
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_detectar_oferta_disponible_update on public.offers;
create trigger trg_detectar_oferta_disponible_update
after update of active, offer_price on public.offers
for each row execute function public.detectar_oferta_disponible();

drop trigger if exists trg_detectar_oferta_disponible_insert on public.offers;
create trigger trg_detectar_oferta_disponible_insert
after insert on public.offers
for each row execute function public.detectar_oferta_disponible();
