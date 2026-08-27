-- ad_campaigns solo tenía política de dueño (ads_owner, ALL) y de lectura
-- pública de activas (ads_public_serve) -- sin política para admin, la
-- revisión desde /api/admin/ads (cliente con sesión, no service-role) no
-- podía ni leer las campañas pendientes de negocios ajenos ni
-- aprobarlas/rechazarlas (0 filas afectadas, en silencio). Verificado con
-- simulación de rol antes de este fix: select y update devolvían 0 filas.

create policy "ads_admin_select"
on public.ad_campaigns for select
to authenticated
using (public.is_admin());

create policy "ads_admin_update"
on public.ad_campaigns for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
