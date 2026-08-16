-- Copy de notificaciones con marco de "pérdida" en vez de "ganancia" --
-- la evidencia real (Kahneman, loss aversion) es que la gente reacciona
-- más fuerte a "te lo vas a perder" que a "hay algo nuevo". Mismo dato
-- real de siempre (nunca se inventa nada), solo cambia cómo se dice.
create or replace function public.notify_followers_on_offer() returns trigger
  language plpgsql as $$
declare
  biz_name text;
begin
  select name into biz_name from businesses where id = new.business_id;

  begin
    insert into notifications (user_id, title, body, type, link, business_id)
    select f.user_id,
           '🔥 ' || biz_name || ' publicó una oferta -- no te la pierdas',
           new.title,
           'offer',
           '/oferta/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  exception when undefined_column then
    insert into notifications (user_id, message, type, link, business_id)
    select f.user_id,
           '🔥 ' || biz_name || ' publicó una oferta que te podés perder: ' || new.title,
           'offer',
           '/oferta/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  end;

  return new;
end;
$$;

create or replace function public.notify_followers_on_live() returns trigger
  language plpgsql as $$
declare
  biz_name text;
begin
  select name into biz_name from businesses where id = new.business_id;

  begin
    insert into notifications (user_id, title, body, type, link, business_id)
    select f.user_id,
           '🔴 ' || biz_name || ' está en vivo ahora -- no te lo pierdas',
           new.title,
           'live',
           '/en-vivo/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  exception when undefined_column then
    insert into notifications (user_id, message, type, link, business_id)
    select f.user_id,
           '🔴 ' || biz_name || ' está en vivo ahora, te lo podés perder: ' || new.title,
           'live',
           '/en-vivo/' || new.id,
           new.business_id
    from followers f
    where f.business_id = new.business_id;
  end;

  return new;
end;
$$;
