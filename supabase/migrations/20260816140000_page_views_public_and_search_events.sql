-- Hallazgo real: page_views_select restringe a dueño/admin (protege la IP,
-- correcto), pero eso significa que /ranking (pestaña "Crecimiento") y
-- cualquier vista pública de "negocio en alza" siempre devolvían vacío
-- para un visitante común -- solo un admin logueado veía algo ahí.
--
-- Vista pública mínima: solo business_id + viewed_at (nunca ip, nunca
-- path). No es una exposición nueva: ya se muestran conteos agregados
-- por negocio en business_leagues (seguidores/reseñas/ofertas/canjes),
-- esto es del mismo tipo -- agregado, no el detalle de cada visita.
create view page_views_public as
  select business_id, viewed_at from page_views;

-- analytics_events: los eventos de búsqueda (event_type='search') no
-- tienen business_id (no son de ningún negocio en particular), así que
-- la policy de "solo el dueño del negocio" nunca los deja pasar --
-- quedaban sin poder leerse por nadie. Se habilita lectura pública SOLO
-- para filas sin negocio asociado (búsquedas); los eventos ligados a un
-- negocio (visitas, WhatsApp, favoritos) siguen siendo privados del dueño.
create policy analytics_select_public_generic on analytics_events
  for select using (business_id is null);
