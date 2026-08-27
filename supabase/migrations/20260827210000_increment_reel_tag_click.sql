-- Mismo patrón que increment_reel_view: un RPC mínimo que solo suma un
-- contador, para que el click público en una etiqueta de reel (sin
-- sesión de usuario detrás, cualquiera puede tocarla) no necesite pasar
-- por RLS de escritura en reel_products.
create or replace function public.increment_reel_tag_click(p_tag_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.reel_products set clicks = clicks + 1 where id = p_tag_id;
end;
$$;
