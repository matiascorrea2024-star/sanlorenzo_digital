-- Nuevo ecosistema: vendedores particulares + capa de envíos.
--
-- No se crea una tabla paralela: "businesses" ya tenía una columna
-- "type" (default 'comercio', sin restricción de valores, y sin
-- ningún selector en el formulario de alta -- SIEMPRE se guardaba
-- "comercio"). Se reutiliza para distinguir comercio/particular/
-- servicio/profesional en vez de duplicar el sistema. Como sigue
-- siendo la misma tabla, hereda automáticamente las policies RLS que
-- ya existen (dueño o admin pueden escribir, lectura pública) -- no
-- hace falta RLS nueva.
ALTER TABLE "public"."businesses" ADD CONSTRAINT "businesses_type_check"
  CHECK ("type" = ANY (ARRAY['comercio'::"text", 'particular'::"text", 'servicio'::"text", 'profesional'::"text"]))
  NOT VALID;
-- NOT VALID: no revalida filas existentes (todas ya son 'comercio',
-- válido), pero sí exige la restricción para inserts/updates nuevos.
ALTER TABLE "public"."businesses" VALIDATE CONSTRAINT "businesses_type_check";

-- Envíos: capa transversal, opcional, honesta -- si el dueño no la
-- carga, todo queda en su default (sin inventar disponibilidad).
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "hace_envios" boolean NOT NULL DEFAULT false;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "retiro_en_local" boolean NOT NULL DEFAULT true;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "envio_gratis" boolean NOT NULL DEFAULT false;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "costo_envio" numeric;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "zona_cobertura" text;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "radio_entrega_km" numeric;

CREATE INDEX IF NOT EXISTS "idx_businesses_type" ON "public"."businesses" USING "btree" ("type");
CREATE INDEX IF NOT EXISTS "idx_businesses_hace_envios" ON "public"."businesses" USING "btree" ("hace_envios") WHERE "hace_envios" = true;
