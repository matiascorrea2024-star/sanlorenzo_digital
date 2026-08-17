-- Los comentarios de Reels son texto público de cualquier usuario
-- logueado, el mismo tipo de riesgo que el chat comunitario -- se le
-- suman las mismas dos capas (reusando la lista de palabras de
-- chat_banned_words, un solo lugar para mantenerla) que ya se
-- probaron en vivo para city_chat_messages.
create or replace function public.check_reel_comment_language()
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

create trigger trg_check_reel_comment_language
before insert on reel_comments
for each row execute function public.check_reel_comment_language();

create or replace function public.check_reel_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if exists (
    select 1 from public.reel_comments c
    where c.user_id = new.user_id
      and c.created_at > now() - interval '3 seconds'
  ) then
    raise exception 'CHAT_MUY_SEGUIDO';
  end if;
  return new;
end;
$$;

create trigger trg_reel_comment_rate_limit
before insert on reel_comments
for each row execute function public.check_reel_comment_rate_limit();
