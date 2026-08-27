-- reel_products (etiquetas de producto/oferta dentro de un reel) ya tenía
-- RLS activado, pero la política de escritura tenía un agujero real: como
-- "product_id IS NULL" pasaba el check sin ninguna otra condición, CUALQUIER
-- usuario (incluso anónimo, la política corre para "public") podía insertar
-- una etiqueta de OFERTA en el reel de un negocio ajeno -- el caso de
-- producto sí estaba bien protegido, el de oferta no. No había explotado
-- nada porque la tabla tenía 0 filas y ninguna pantalla la usaba todavía;
-- se corrige ahora que se activa el flujo real de etiquetado.
drop policy if exists "reelp_owner" on public.reel_products;

create policy "reelp_owner"
on public.reel_products for all
to authenticated
using (
  exists (
    select 1 from public.reels r
    join public.businesses b on b.id = r.business_id
    where r.id = reel_products.reel_id and b.owner_id = auth.uid()
  ) or public.is_admin()
)
with check (
  exists (
    select 1 from public.reels r
    join public.businesses b on b.id = r.business_id
    where r.id = reel_products.reel_id and b.owner_id = auth.uid()
  ) or public.is_admin()
);
