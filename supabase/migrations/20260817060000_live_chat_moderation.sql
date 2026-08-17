-- El chat de En Vivo es el mismo tipo de superficie pública (cualquier
-- usuario logueado escribe en tiempo real) que el chat comunitario y
-- los comentarios de Reels -- se le suman las mismas dos capas,
-- reusando la lista compartida chat_banned_words.
create or replace function public.check_live_chat_language()
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

create trigger trg_check_live_chat_language
before insert on live_stream_messages
for each row execute function public.check_live_chat_language();

create or replace function public.check_live_chat_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if exists (
    select 1 from public.live_stream_messages m
    where m.user_id = new.user_id
      and m.live_stream_id = new.live_stream_id
      and m.created_at > now() - interval '3 seconds'
  ) then
    raise exception 'CHAT_MUY_SEGUIDO';
  end if;
  return new;
end;
$$;

create trigger trg_live_chat_rate_limit
before insert on live_stream_messages
for each row execute function public.check_live_chat_rate_limit();
