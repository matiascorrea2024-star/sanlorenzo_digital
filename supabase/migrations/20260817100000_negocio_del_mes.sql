-- Negocio del Mes: votación real (no el ranking algorítmico que ya
-- existe en business_leagues) -- la gente vota directo por su negocio
-- favorito, un voto por mes por persona (se puede cambiar de opinión,
-- como ya funciona daily_votes para "Voto del día"). Genera que los
-- negocios inviten a sus clientes a votarlos, y da un motivo real para
-- volver a la plataforma cada mes.
create table business_month_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  month text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table business_month_votes enable row level security;

create policy bmv_select on business_month_votes for select using (true);
create policy bmv_insert on business_month_votes for insert with check (auth.uid() = user_id);
create policy bmv_update on business_month_votes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy bmv_delete on business_month_votes for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table business_month_votes;
