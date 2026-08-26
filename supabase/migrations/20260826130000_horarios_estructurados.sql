-- Horarios estructurados: el booleano "open" manual mentía (el comercio
-- se olvidaba de toggle). schedule_json = {"0":[], "1":[["08:00","13:30"],
-- ["16:30","21:00"]], ...} con claves 0-6 (0=domingo) y rangos HH:MM;
-- array vacío = cerrado ese día. El texto "schedule" se sigue escribiendo
-- (auto-formateado) para JSON-LD/SEO y lecturas humanas.
alter table public.businesses add column if not exists schedule_json jsonb;
