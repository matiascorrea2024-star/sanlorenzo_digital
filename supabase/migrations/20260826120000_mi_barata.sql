-- Mi Barata: lista de compras del vecino con ofertas de varios negocios.
-- list_items gana offer_id (la tabla original solo pensaba negocios) y las
-- dos tablas ganan RLS propia: cada usuario ve y manipula SOLO sus listas.
alter table public.list_items add column if not exists offer_id uuid references public.offers(id) on delete cascade;

alter table public.user_lists enable row level security;
alter table public.list_items enable row level security;

drop policy if exists user_lists_owner_all on public.user_lists;
create policy user_lists_owner_all on public.user_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- El acceso a los ítems se valida a través de la lista madre: si la lista
-- es tuya, sus ítems también (evita policies duplicadas por tabla).
drop policy if exists list_items_owner_all on public.list_items;
create policy list_items_owner_all on public.list_items
  for all using (
    exists (
      select 1 from public.user_lists ul
      where ul.id = list_id and ul.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.user_lists ul
      where ul.id = list_id and ul.user_id = auth.uid()
    )
  );
