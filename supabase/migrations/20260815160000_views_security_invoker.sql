-- HALLAZGO CRÍTICO de esta ronda de QA: las vistas públicas del sitio
-- (offers_with_business, businesses_with_location, business_leagues) son
-- dueñas de "postgres" y fueron creadas sin security_invoker = true. En
-- Postgres, una vista sin security_invoker evalúa el RLS de las tablas de
-- base usando los privilegios del DUEÑO de la vista, no del rol que
-- realmente está consultando (anon/authenticated vía PostgREST). Como
-- "postgres" es también dueño de businesses/offers/locations y esas tablas
-- NO tienen FORCE ROW LEVEL SECURITY, el dueño evade su propio RLS -- lo
-- que significa que estas 3 vistas ignoraban por completo tanto las
-- policies históricas como las dos migraciones anteriores de esta sesión
-- (gate_public_content_by_city_status, gate_products_by_city_status).
--
-- Como la enorme mayoría de las pantallas públicas del sitio (Home, ticker,
-- ranking, radar, oferta bomba, La Gran Barata, ficha de negocio, etc.)
-- leen estas vistas y NO las tablas crudas, esta era la pieza que de
-- verdad determinaba si "activar una ciudad habilita su ecosistema" -- sin
-- este fix, el ciclo de vida de ciudad no tenía ningún efecto real sobre
-- lo que la mayoría de los usuarios ve.
--
-- security_invoker = true hace que la vista evalúe permisos y RLS como el
-- rol que realmente pregunta (anon/authenticated), igual que si consultara
-- la tabla directamente. anon/authenticated ya tienen GRANT SELECT directo
-- sobre businesses/offers/locations (confirmado: las queries directas a
-- esas tablas ya funcionaban), así que este cambio no rompe permisos --
-- solo deja de saltarse el RLS.
alter view public.offers_with_business set (security_invoker = true);
alter view public.businesses_with_location set (security_invoker = true);
alter view public.business_leagues set (security_invoker = true);
