-- ============================================================
-- Fase 5: expansión regional -- ciudades del cordón industrial y
-- barrios de San Lorenzo. La infraestructura (rutas /[ciudad] y
-- /[ciudad]/[barrio], selector, filtros) ya existía en el código;
-- lo que faltaba era cargar los datos reales.
--
-- Nota de honestidad: las coordenadas de San Lorenzo, Puerto General
-- San Martín, Capitán Bermúdez, Fray Luis Beltrán, Carcarañá y Roldán
-- son ubicaciones bien conocidas. Las de Timbúes, Ricardone, Andino,
-- San Jerónimo Sud, Villa Mugueta, Aldao y Luis Palacios son una
-- aproximación de buena fe (este entorno no tiene acceso a internet
-- para verificarlas con un geocoder) -- recomiendo confirmarlas en
-- Google Maps antes de depender de ellas para algo más preciso que
-- "mostrar un pin en la zona correcta".
-- ============================================================

INSERT INTO "public"."locations" ("type", "name", "slug", "latitude", "longitude", "active") VALUES
  ('city', 'San Lorenzo', 'san-lorenzo', -32.7454, -60.7346, true),
  ('city', 'Puerto General San Martín', 'puerto-general-san-martin', -32.7167, -60.7333, true),
  ('city', 'Capitán Bermúdez', 'capitan-bermudez', -32.8283, -60.7128, true),
  ('city', 'Fray Luis Beltrán', 'fray-luis-beltran', -32.7654, -60.7204, true),
  ('city', 'Timbúes', 'timbues', -32.6871, -60.7247, true),
  ('city', 'Ricardone', 'ricardone', -32.9008, -60.9294, true),
  ('city', 'Andino', 'andino', -32.8264, -60.8492, true),
  ('city', 'San Jerónimo Sud', 'san-jeronimo-sud', -32.6975, -61.0964, true),
  ('city', 'Villa Mugueta', 'villa-mugueta', -32.8814, -60.9550, true),
  ('city', 'Aldao', 'aldao', -32.8206, -61.0794, true),
  ('city', 'Luis Palacios', 'luis-palacios', -32.8756, -61.0206, true),
  ('city', 'Carcarañá', 'carcarana', -32.8500, -61.1500, true),
  ('city', 'Roldán', 'roldan', -32.9083, -60.9119, true)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  sl_id uuid;
BEGIN
  SELECT id INTO sl_id FROM public.locations WHERE slug = 'san-lorenzo' AND type = 'city' LIMIT 1;
  IF sl_id IS NOT NULL THEN
    INSERT INTO public.locations (type, name, slug, parent_id, active) VALUES
      ('neighborhood', 'Centro', 'centro', sl_id, true),
      ('neighborhood', 'Mitre', 'mitre', sl_id, true),
      ('neighborhood', 'Combate', 'combate', sl_id, true),
      ('neighborhood', 'Villa Robles', 'villa-robles', sl_id, true),
      ('neighborhood', 'Mariano Moreno', 'mariano-moreno', sl_id, true),
      ('neighborhood', 'Villa Felisa', 'villa-felisa', sl_id, true),
      ('neighborhood', 'Portal del Sol', 'portal-del-sol', sl_id, true),
      ('neighborhood', 'Pino de San Lorenzo', 'pino-de-san-lorenzo', sl_id, true)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
