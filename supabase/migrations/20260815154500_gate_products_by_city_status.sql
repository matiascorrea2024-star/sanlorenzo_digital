-- Mismo agujero que businesses/offers (migración anterior), encontrado al
-- revisar components/ui/smart-search.tsx: la búsqueda de productos consulta
-- la tabla "products" directamente, sin pasar por businesses, y su policy
-- pública (products_select) solo miraba products.active -- no la ciudad del
-- negocio dueño. Un producto de un negocio en una ciudad suspended/archived/
-- draft podía seguir apareciendo en el buscador aunque el negocio y sus
-- ofertas ya estuvieran ocultos por la migración anterior.
--
-- A diferencia de businesses/offers, products no tenía ninguna policy de
-- SELECT para el dueño (solo INSERT/UPDATE) -- si sumáramos el filtro de
-- ciudad activa a secas, un comerciante dejaría de ver su propio catálogo
-- en /dashboard/productos mientras su ciudad está en draft, rompiendo el
-- flujo de "cargar el negocio antes de que el admin active la ciudad". Por
-- eso esta policy nueva agrega explícitamente esa rama para dueño/admin.
drop policy if exists products_select on products;
create policy products_select on products
  for select
  using (
    (
      active = true
      and exists (
        select 1 from businesses b
        where b.id = products.business_id
          and public.location_is_active(b.location_id)
      )
    )
    or exists (
      select 1 from businesses b
      where b.id = products.business_id
        and (b.owner_id = auth.uid() or public.is_admin())
    )
  );
