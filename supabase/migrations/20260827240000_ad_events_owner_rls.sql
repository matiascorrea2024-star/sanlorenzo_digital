-- ad_impressions y ad_clicks solo tenían política de INSERT público (para
-- el registro fire-and-forget) -- CERO políticas de SELECT, ni para el
-- dueño del negocio ni para admin. En la práctica, el dashboard de
-- publicidad no podría mostrar analytics reales (impresiones/clicks) de
-- las propias campañas: cualquier select devolvía 0 filas por RLS.

create policy "ad_impressions_owner_select"
on public.ad_impressions for select
to authenticated
using (
  exists (
    select 1 from public.ad_campaigns c
    join public.businesses b on b.id = c.business_id
    where c.id = ad_impressions.campaign_id
      and (b.owner_id = auth.uid() or public.is_admin())
  )
);

create policy "ad_clicks_owner_select"
on public.ad_clicks for select
to authenticated
using (
  exists (
    select 1 from public.ad_campaigns c
    join public.businesses b on b.id = c.business_id
    where c.id = ad_clicks.campaign_id
      and (b.owner_id = auth.uid() or public.is_admin())
  )
);
