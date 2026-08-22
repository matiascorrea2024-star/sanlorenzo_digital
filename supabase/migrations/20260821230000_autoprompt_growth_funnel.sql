-- Embudo medible, links rastreables y atribución de referidos.
-- Todo es idempotente y no habilita escrituras arbitrarias sobre negocios.

alter table public.analytics_events add column if not exists source text;
alter table public.analytics_events add column if not exists source_code text;

alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;
alter table public.analytics_events
  add constraint analytics_events_event_type_check check (event_type in (
    'view_business', 'view_offer', 'click_whatsapp', 'click_map',
    'favorite', 'follow', 'search', 'coupon_generated', 'coupon_redeemed',
    'share_business', 'share_offer', 'checkout_started',
    'payment_confirmed', 'tracked_link_click'
  ));

alter table public.referrals add column if not exists source text;
alter table public.referrals add column if not exists source_code text;
alter table public.referrals drop constraint if exists referrals_not_self;
alter table public.referrals add constraint referrals_not_self
  check (referrer_id <> referred_id);

create index if not exists idx_analytics_business_type_date
  on public.analytics_events (business_id, event_type, created_at desc);
create index if not exists idx_tracked_links_code
  on public.tracked_links (short_code);
create index if not exists idx_referrals_referrer_date
  on public.referrals (referrer_id, created_at desc);

-- La tabla histórica no tenía policies de escritura. Los dueños pueden
-- consultar y crear sus propios links; los links públicos se resuelven por
-- las funciones SECURITY DEFINER de abajo.
drop policy if exists tracked_links_owner_select on public.tracked_links;
create policy tracked_links_owner_select on public.tracked_links for select
  using (
    auth.uid() in (
      select owner_id from public.businesses where id = tracked_links.business_id
    )
  );

drop policy if exists tracked_links_owner_insert on public.tracked_links;
create policy tracked_links_owner_insert on public.tracked_links for insert
  with check (
    auth.uid() in (
      select owner_id from public.businesses where id = tracked_links.business_id
    )
    and (offer_id is null or offer_id in (
      select id from public.offers where business_id = tracked_links.business_id
    ))
  );

create or replace function public.create_tracked_link(
  p_business_id uuid,
  p_offer_id uuid default null,
  p_source text default 'share',
  p_short_code text default null
) returns table(short_code text, full_url text)
language plpgsql security definer set search_path = public
as $$
declare
  v_code text := lower(coalesce(nullif(trim(p_short_code), ''), substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)));
  v_business_id uuid := p_business_id;
begin
  if p_business_id is null and p_offer_id is null then
    raise exception 'target_required';
  end if;
  if p_offer_id is not null then
    select business_id into v_business_id from public.offers
      where id = p_offer_id and active = true;
    if v_business_id is null then raise exception 'offer_not_found'; end if;
  end if;
  if not exists (
    select 1 from public.businesses
    where id = v_business_id and activo is distinct from false
      and status in ('verificado', 'reclamado')
  ) then raise exception 'business_not_public'; end if;
  if v_code !~ '^[a-z0-9_-]{6,32}$' then raise exception 'invalid_code'; end if;

  insert into public.tracked_links (business_id, offer_id, source, short_code, full_url)
  values (v_business_id, p_offer_id, left(coalesce(nullif(trim(p_source), ''), 'share'), 40), v_code, null);
  return query select v_code, null::text;
exception when unique_violation then
  raise exception 'code_in_use';
end;
$$;

create or replace function public.resolve_tracked_link(p_code text)
returns table(target_path text, business_id uuid, offer_id uuid, source text)
language plpgsql security definer set search_path = public
as $$
declare
  v_link public.tracked_links%rowtype;
  v_path text;
begin
  select * into v_link from public.tracked_links
    where short_code = lower(trim(p_code))
    limit 1;
  if not found then raise exception 'link_not_found'; end if;
  if not exists (
    select 1 from public.businesses
    where id = v_link.business_id and activo is distinct from false
      and status in ('verificado', 'reclamado')
  ) then raise exception 'business_not_public'; end if;
  if v_link.offer_id is not null and not exists (
    select 1 from public.offers where id = v_link.offer_id and active = true
  ) then raise exception 'offer_not_public'; end if;

  v_path := case when v_link.offer_id is not null
    then '/oferta/' || v_link.offer_id::text
    else '/negocio/' || (select slug from public.businesses where id = v_link.business_id)
  end || '?src=' || v_link.short_code;

  update public.tracked_links
    set clicks = coalesce(clicks, 0) + 1, last_clicked_at = now()
    where id = v_link.id;
  insert into public.analytics_events
    (business_id, offer_id, event_name, event_type, metadata, source, source_code)
  values
    (v_link.business_id, v_link.offer_id, 'tracked_link_click', 'tracked_link_click',
     jsonb_build_object('source', v_link.source, 'code', v_link.short_code),
     v_link.source, v_link.short_code);

  return query select v_path, v_link.business_id, v_link.offer_id, v_link.source;
end;
$$;

grant execute on function public.create_tracked_link(uuid, uuid, text, text) to anon, authenticated;
grant execute on function public.resolve_tracked_link(text) to anon, authenticated;
