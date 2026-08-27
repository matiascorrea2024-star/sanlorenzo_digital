-- Reconstruida a partir de supabase_migrations.schema_migrations en producción
-- (columna `statements`): esta migración se había aplicado directo a la base
-- productiva sin quedar guardada como archivo local en el repo, generando un
-- drift entre local/remoto. Contenido verificado 1:1 contra lo que corrió
-- realmente el 18 de agosto -- no se adivina ni se inventa nada.
--
-- Cuando un plan pago vence, el catálogo NUNCA se borra -- pero hasta ahora
-- tampoco se volvía a controlar el límite del plan una vez publicado el
-- producto: alguien podía pagar un mes, cargar 50 productos, dejar de pagar,
-- y quedarse con los 50 visibles gratis para siempre. Esta columna permite
-- ocultar (no borrar) el excedente del catálogo público cuando el plan baja,
-- y reactivarlo solo con volver a pagar. Se guarda aparte de "active" (que
-- ya usa el comerciante para apagar productos a mano) para no confundir
-- "yo lo apagué" con "el sistema lo ocultó por plan".
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "hidden_by_plan" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "idx_products_hidden_by_plan" ON "public"."products" ("business_id", "hidden_by_plan");
