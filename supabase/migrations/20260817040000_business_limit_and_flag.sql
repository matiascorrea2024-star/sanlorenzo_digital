-- Anti-abuso: un usuario solo puede tener un negocio en plan gratis.
-- Sin esto, alguien podía crear varios negocios distintos con la misma
-- cuenta y juntar cupos de ofertas gratis en cada uno -- para tener un
-- segundo negocio (o más), al menos uno de los que ya tiene tiene que
-- estar en un plan pago. Server-side (trigger), no solo en el
-- formulario -- así no se puede evadir llamando la API directo.
create or replace function public.check_business_limit()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if new.owner_id is null or is_admin() then
    return new;
  end if;
  if exists (select 1 from public.businesses b where b.owner_id = new.owner_id)
     and not exists (
       select 1 from public.businesses b
       where b.owner_id = new.owner_id and b.plan is not null and b.plan <> 'gratis'
     )
  then
    raise exception 'LIMITE_NEGOCIOS_GRATIS';
  end if;
  return new;
end;
$$;

create trigger trg_check_business_limit
before insert on businesses
for each row execute function public.check_business_limit();
