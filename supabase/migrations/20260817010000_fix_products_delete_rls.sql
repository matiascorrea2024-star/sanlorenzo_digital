-- products tenía INSERT/SELECT/UPDATE pero nunca DELETE -- el botón
-- "Eliminar producto" del dashboard (app/dashboard/productos/page.tsx)
-- estaba silenciosamente roto: el dueño nunca podía borrar su propio
-- producto. Misma condición que ya usa products_update.
create policy "products_delete" on public.products for delete
  using (auth.uid() in (select businesses.owner_id from businesses where businesses.id = products.business_id));
