-- La Gran Barata Ads: ad_campaigns/ad_clicks/ad_impressions ya existían
-- con un modelo real (bid_weight, budget_cents, targeting jsonb, RLS de
-- dueño + lectura pública de activas + inserción pública de eventos),
-- pero sin ningún campo para la creatividad ni para el estado del ciclo
-- de vida (solo había un booleano "active"). Se agregan los campos que
-- faltan para poder crear, pagar, moderar y programar una campaña real.
alter table public.ad_campaigns
  add column if not exists status text not null default 'draft',
  add column if not exists creative_url text,
  add column if not exists creative_type text not null default 'image',
  add column if not exists cta_label text not null default 'Ver más',
  add column if not exists payment_ref text,
  add column if not exists admin_notes text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid;

alter table public.ad_campaigns
  drop constraint if exists ad_campaigns_status_check;
alter table public.ad_campaigns
  add constraint ad_campaigns_status_check check (status in (
    'draft', 'pending_payment', 'pending_review', 'rejected',
    'scheduled', 'active', 'paused', 'completed'
  ));

create index if not exists ad_campaigns_status_idx on public.ad_campaigns (status);
create index if not exists ad_campaigns_placement_idx on public.ad_campaigns (placement) where active;
