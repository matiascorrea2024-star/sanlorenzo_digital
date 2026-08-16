-- Chat comunitario por ciudad: un canal público por ciudad (Realtime,
-- mismo patrón que live_stream_messages) para preguntas, avisos ("se
-- perdió un perro"), etc. Requiere estar logueado (nada de anónimo --
-- es lo que más ayuda a que la gente se porte bien) y tiene tres capas
-- de protección server-side (no solo client-side, así no se puede
-- evadir llamando la API directo):
--   1. filtro de lenguaje (lista de palabras extensible en una tabla)
--   2. límite de velocidad (no más de 1 mensaje cada 3 segundos)
--   3. auto-ocultado a partir de 3 reportes, hasta que un admin lo revise
create table city_chat_messages (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sender_name text not null,
  -- se resuelve server-side (trigger), nunca por lo que mande el cliente --
  -- así no se puede fingir ser dueño de un negocio para destacarse.
  business_id uuid references businesses(id) on delete set null,
  body text not null check (char_length(body) between 1 and 500),
  hidden boolean not null default false,
  reports_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table city_chat_reports (
  message_id uuid not null references city_chat_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- Lista de palabras filtradas -- en tabla (no hardcodeada en el código)
-- para poder ampliarla sin un deploy nuevo. Punto de partida razonable,
-- se puede ajustar.
create table chat_banned_words (
  word text primary key
);

insert into chat_banned_words (word) values
  ('forro'), ('garca'), ('sorete'), ('choto'), ('pelotudo'),
  ('puto'), ('puta'), ('trolo'), ('trola'), ('hijodeputa'),
  ('concha'), ('careconcha'), ('cornudo'), ('negrodemierda'),
  ('gordoasqueroso'), ('violador'), ('nazi');

alter table city_chat_messages enable row level security;
alter table city_chat_reports enable row level security;
alter table chat_banned_words enable row level security;

create policy city_chat_select_public on city_chat_messages
  for select using (
    not hidden and exists (select 1 from locations l where l.id = location_id and l.status = 'active')
  );

create policy city_chat_insert on city_chat_messages
  for insert with check (auth.uid() = user_id);

create policy city_chat_moderate on city_chat_messages
  for update using (is_admin() or auth.uid() = user_id);

create policy city_chat_delete on city_chat_messages
  for delete using (is_admin() or auth.uid() = user_id);

create policy city_chat_reports_insert on city_chat_reports
  for insert with check (auth.uid() = user_id);

create policy city_chat_reports_admin_read on city_chat_reports
  for select using (is_admin());

create policy chat_banned_words_admin on chat_banned_words
  for all using (is_admin());

-- Resuelve el negocio del que escribe (si tiene uno en esa ciudad) para
-- destacarlo con una insignia en el chat -- no se confía en el cliente.
create or replace function public.resolve_chat_business()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  select b.id into new.business_id
    from public.businesses b
    where b.owner_id = new.user_id
      and b.location_id = new.location_id
      and b.activo is not false
    order by b.created_at asc
    limit 1;
  return new;
end;
$$;

create trigger trg_resolve_chat_business
before insert on city_chat_messages
for each row execute function public.resolve_chat_business();

create or replace function public.check_chat_language()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_normalized text;
  v_word text;
begin
  v_normalized := lower(regexp_replace(new.body, '[^a-záéíóúñA-ZÁÉÍÓÚÑ]', '', 'g'));
  for v_word in select word from public.chat_banned_words loop
    if v_normalized like '%' || v_word || '%' then
      raise exception 'MENSAJE_INAPROPIADO';
    end if;
  end loop;
  return new;
end;
$$;

create trigger trg_check_chat_language
before insert on city_chat_messages
for each row execute function public.check_chat_language();

create or replace function public.check_chat_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if exists (
    select 1 from public.city_chat_messages m
    where m.user_id = new.user_id
      and m.location_id = new.location_id
      and m.created_at > now() - interval '3 seconds'
  ) then
    raise exception 'CHAT_MUY_SEGUIDO';
  end if;
  return new;
end;
$$;

create trigger trg_chat_rate_limit
before insert on city_chat_messages
for each row execute function public.check_chat_rate_limit();

create or replace function public.update_chat_reports()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.city_chat_messages m
    set reports_count = m.reports_count + 1,
        hidden = (m.reports_count + 1) >= 3
    where m.id = new.message_id;
  return new;
end;
$$;

create trigger trg_chat_reports
after insert on city_chat_reports
for each row execute function public.update_chat_reports();
