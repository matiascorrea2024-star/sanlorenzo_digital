-- Avisa a los seguidores de un negocio cuando arranca una transmisión en
-- vivo, reusando el mismo patrón que notify_followers_on_offer (columnas
-- title/body con fallback a message, sin depender de un servicio de push
-- pago -- son notificaciones internas de la plataforma).
create or replace function public.notify_followers_on_live() returns trigger
  language plpgsql as $$
declare
  biz_name text;
begin
  select name into biz_name from businesses where id = new.business_id;

  begin
    insert into notifications (user_id, title, body, type, link, business_id)
    select f.user_id,
           '🔴 ' || biz_name || ' está en vivo',
           new.title,
           'live',
           '/en-vivo/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  exception when undefined_column then
    insert into notifications (user_id, message, type, link, business_id)
    select f.user_id,
           '🔴 ' || biz_name || ' está en vivo: ' || new.title,
           'live',
           '/en-vivo/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  end;

  return new;
end;
$$;

drop trigger if exists trg_notify_live on live_streams;
create trigger trg_notify_live
  after update on live_streams
  for each row
  when (old.status is distinct from 'live' and new.status = 'live')
  execute function public.notify_followers_on_live();
