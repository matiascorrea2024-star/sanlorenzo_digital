-- Ofertas grupales: el mecanismo de Groupon para comercio local -- "20%
-- OFF si se anotan 15 personas". Genera urgencia real (nadie quiere ser
-- el que hizo que no se junte la gente) y hace que la gente misma
-- invite a sus vecinos para que se active, sin gastar en publicidad.
alter table offers add column if not exists es_grupal boolean not null default false;
alter table offers add column if not exists meta_participantes integer;
alter table offers add column if not exists grupal_activada boolean not null default false;

create table group_deal_participants (
  offer_id uuid not null references offers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, user_id)
);

alter table group_deal_participants enable row level security;

-- Público: cualquiera puede ver cuánta gente se anotó (es lo que genera
-- la urgencia -- "faltan 3"), pero solo el propio usuario puede
-- anotarse o bajarse.
create policy gdp_select on group_deal_participants for select using (true);
create policy gdp_insert on group_deal_participants for insert with check (auth.uid() = user_id);
create policy gdp_delete on group_deal_participants for delete using (auth.uid() = user_id);

-- Al anotarse la persona número justa, se activa la oferta UNA sola vez
-- (el "if found" del update solo es true la vez que grupal_activada
-- pasa de false a true, no en cada inscripción posterior) y se avisa a
-- todos los que ya se habían anotado -- el aviso real de "se activó,
-- andá a comprarlo" es lo que cierra el loop de urgencia.
create or replace function public.check_group_deal_activation()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_count integer;
  v_meta integer;
  v_title text;
  v_business_id uuid;
begin
  select meta_participantes, title, business_id into v_meta, v_title, v_business_id
    from offers where id = new.offer_id;
  if v_meta is null then
    return new;
  end if;
  select count(*) into v_count from group_deal_participants where offer_id = new.offer_id;
  if v_count >= v_meta then
    update offers set grupal_activada = true where id = new.offer_id and grupal_activada = false;
    if found then
      insert into notifications (user_id, business_id, type, title, body, link)
      select gdp.user_id, v_business_id, 'group_deal_activated',
             '🎉 ¡Se activó la oferta grupal!',
             v_title || ' ya alcanzó el mínimo de gente -- el descuento ya es real.',
             '/oferta/' || new.offer_id
      from group_deal_participants gdp where gdp.offer_id = new.offer_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_check_group_deal_activation
after insert on group_deal_participants
for each row execute function public.check_group_deal_activation();
