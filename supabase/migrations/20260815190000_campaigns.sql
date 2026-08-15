-- Campañas de beneficios manuales para atraer comerciantes al lanzamiento
-- (ej: "3 meses de PRO gratis para los primeros 20 negocios"). El admin
-- las crea/cancela desde /admin; el negocio las reclama solo (sin que el
-- admin tenga que hacerlo a mano uno por uno) mientras haya cupo.
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  grants_plan text not null check (grants_plan in ('gratis','profesional','premium')),
  grants_dias integer not null check (grants_dias > 0),
  max_cupos integer, -- null = sin límite de cupos
  active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  ends_at timestamptz -- null = sin fecha de fin, se corta manualmente
);

create table campaign_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  business_id uuid not null references businesses(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (campaign_id, business_id)
);

alter table campaigns enable row level security;
alter table campaign_claims enable row level security;

-- Lectura pública de campañas activas (para mostrar el banner en
-- /dashboard/planes) -- el resto del manejo queda para el admin.
create policy campaigns_select on campaigns
  for select using (true);

create policy campaigns_admin_write on campaigns
  for all using (public.is_admin());

-- Un dueño de negocio puede ver sus propios reclamos, y el admin todos.
create policy campaign_claims_select on campaign_claims
  for select using (
    public.is_admin()
    or exists (select 1 from businesses b where b.id = campaign_claims.business_id and b.owner_id = auth.uid())
  );

-- El reclamo en sí lo hace el server (API con service check) validando
-- cupo/fecha/duplicados -- acá solo se exige que sea dueño del negocio.
create policy campaign_claims_insert on campaign_claims
  for insert with check (
    exists (select 1 from businesses b where b.id = campaign_claims.business_id and b.owner_id = auth.uid())
  );
