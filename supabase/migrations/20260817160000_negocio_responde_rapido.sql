-- Badge de confianza "Responde rápido" en la ficha de negocio, calculado
-- con datos reales del chat -- nunca inventado. RLS en "messages"
-- restringe SELECT al cliente de esa conversación o al dueño del negocio
-- (correcto, son chats privados), así que un visitante nuevo NUNCA podría
-- calcular esto del lado del cliente -- es justo a ese visitante a quien
-- hay que convencer. Esta función corre con privilegios elevados
-- (security definer) para poder leer los mensajes de todas las
-- conversaciones de un negocio, pero SOLO devuelve un número agregado
-- (mediana en minutos) -- nunca expone mensajes, remitentes ni customer_id.
create or replace function public.negocio_responde_rapido(biz_id uuid)
returns int
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  mediana int;
  cant int;
begin
  -- count y mediana se calculan en la misma consulta -- los CTE de un
  -- "with" no existen más allá de esa consulta puntual en PL/pgSQL.
  with primer_mensaje as (
    select customer_id, min(created_at) as ts
    from messages
    where business_id = biz_id and sender_role = 'customer'
    group by customer_id
  ),
  primera_respuesta as (
    select pm.customer_id,
           min(m.created_at) as ts_respuesta,
           pm.ts as ts_cliente
    from primer_mensaje pm
    join messages m on m.business_id = biz_id
      and m.customer_id = pm.customer_id
      and m.sender_role = 'business'
      and m.created_at > pm.ts
    group by pm.customer_id, pm.ts
  ),
  gaps as (
    select extract(epoch from (ts_respuesta - ts_cliente)) / 60 as minutos
    from primera_respuesta
  )
  select count(*), percentile_cont(0.5) within group (order by minutos)::int
  into cant, mediana
  from gaps;

  -- Con menos de 3 conversaciones respondidas, el dato no dice nada --
  -- no se muestra badge (ni bueno ni malo) en vez de sacar conclusiones
  -- de una sola respuesta.
  if cant < 3 then
    return null;
  end if;

  return mediana;
end;
$$;

grant execute on function public.negocio_responde_rapido(uuid) to anon, authenticated;
