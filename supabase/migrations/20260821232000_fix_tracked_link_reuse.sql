create or replace function public.create_tracked_link(
  p_business_id uuid,
  p_offer_id uuid default null,
  p_source text default 'share',
  p_short_code text default null
) returns table(short_code text, full_url text)
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_business_id uuid := p_business_id;
  v_offer_business_id uuid;
  v_source text := left(coalesce(nullif(trim(p_source), ''), 'share'), 40);
begin
  if p_business_id is null and p_offer_id is null then raise exception 'target_required'; end if;
  if p_offer_id is not null then
    select o.business_id into v_offer_business_id from public.offers as o
      where o.id = p_offer_id and o.active = true;
    if v_offer_business_id is null then raise exception 'offer_not_found'; end if;
    if p_business_id is not null and p_business_id <> v_offer_business_id then raise exception 'target_mismatch'; end if;
    v_business_id := v_offer_business_id;
  end if;
  if not exists (
    select 1 from public.businesses as b
    where b.id = v_business_id and b.activo is distinct from false
      and b.status in ('verificado', 'reclamado')
  ) then raise exception 'business_not_public'; end if;

  select tl.short_code into v_code from public.tracked_links as tl
    where tl.business_id = v_business_id
      and tl.offer_id is not distinct from p_offer_id
      and tl.source = v_source
    order by tl.created_at asc limit 1;
  if v_code is not null then return query select v_code, null::text; return; end if;

  v_code := lower(coalesce(nullif(trim(p_short_code), ''), substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));
  if v_code !~ '^[a-z0-9_-]{6,32}$' then raise exception 'invalid_code'; end if;
  insert into public.tracked_links (business_id, offer_id, source, short_code, full_url)
    values (v_business_id, p_offer_id, v_source, v_code, null);
  return query select v_code, null::text;
exception when unique_violation then
  raise exception 'code_in_use';
end;
$$;
