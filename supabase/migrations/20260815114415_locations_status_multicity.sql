-- Multiciudad: "active" (boolean) solo distingue publicada/no publicada.
-- El producto necesita distinguir más estados reales de una ciudad:
--   draft      -- se está cargando (nombre, barrios, negocios) antes de publicar
--   inactive   -- publicada antes, pausada a propósito, se puede reactivar
--   active     -- pública y operativa
--   suspended  -- pausada por el admin (ej. contenido problemático), no por elección propia
--   archived   -- retirada definitivamente, datos conservados, no vuelve a la lista normal
-- "active" (boolean) se mantiene por compatibilidad -- todo el código que ya
-- filtra por active=true sigue funcionando exactamente igual. Queda en sync
-- con status desde la aplicación (ver app/api/admin/locations/route.ts):
-- status='active' -> active=true; cualquier otro status -> active=false.

ALTER TABLE "public"."locations"
  ADD COLUMN IF NOT EXISTS "status" "text" DEFAULT 'draft';

ALTER TABLE "public"."locations"
  ADD CONSTRAINT "locations_status_check"
  CHECK ("status" = ANY (ARRAY['draft'::"text", 'inactive'::"text", 'active'::"text", 'suspended'::"text", 'archived'::"text"]))
  NOT VALID;

ALTER TABLE "public"."locations" VALIDATE CONSTRAINT "locations_status_check";

-- Backfill: las filas existentes ya tenían un estado real vía "active"
-- (San Lorenzo activa, cualquier ciudad de prueba creada como inactiva) --
-- se traduce 1 a 1, no se asume "draft" para nada que ya estaba publicado
-- o deliberadamente despublicado.
UPDATE "public"."locations" SET "status" = 'active' WHERE "active" = true;
UPDATE "public"."locations" SET "status" = 'inactive' WHERE "active" = false;
