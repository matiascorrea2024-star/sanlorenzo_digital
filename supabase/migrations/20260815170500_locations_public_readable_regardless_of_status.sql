-- Hasta ahora locations_select exigía active=true para poder leer una fila
-- de locations -- correcto para negocios/ofertas (por eso esos quedan
-- gateados via location_is_active()), pero demasiado estricto para la
-- ciudad/barrio en sí: para mostrar "Estamos llegando a San Jerónimo Sud"
-- en /[ciudad] o listar la ciudad como "Próximamente" en el selector, el
-- cliente necesita poder leer su nombre/slug aunque esté inactive/draft/
-- suspended/archived. locations no tiene ninguna columna sensible (nombre,
-- slug, tipo, coordenadas, metadata siempre vacío hoy) -- el contenido
-- real (negocios/ofertas/productos) sigue protegido por
-- businesses_select_all / offers_select_all / products_select, que SÍ
-- siguen exigiendo location_is_active().
drop policy if exists locations_select on locations;
create policy locations_select on locations
  for select
  using (true);
