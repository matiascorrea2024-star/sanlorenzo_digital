-- coupons tenía RLS activado (ENABLE ROW LEVEL SECURITY) pero CERO
-- políticas -- con RLS así, Postgres deniega todo por default. El botón
-- "Obtener cupón" (components/offers/coupon-button.tsx) inserta directo
-- desde el cliente, y /dashboard/ofertas/[id]/cupones lee directo también
-- -- las dos rutas estaban rotas en producción, no solo las API routes
-- (esas ya re-verifican con el mismo cliente cookie-based, sin bypass).

-- Ver: solo el dueño del cupón, el dueño del negocio (para validar
-- códigos), o admin.
create policy "coupons_select" on public.coupons for select
  using (
    auth.uid() = user_id
    or exists (select 1 from businesses b where b.id = coupons.business_id and b.owner_id = auth.uid())
    or is_admin()
  );

-- Generar: cualquier usuario autenticado genera SU PROPIO cupón.
create policy "coupons_insert" on public.coupons for insert
  with check (auth.uid() = user_id);

-- Canjear (marcar redeemed): solo el dueño del negocio o admin.
create policy "coupons_update" on public.coupons for update
  using (
    exists (select 1 from businesses b where b.id = coupons.business_id and b.owner_id = auth.uid())
    or is_admin()
  );
