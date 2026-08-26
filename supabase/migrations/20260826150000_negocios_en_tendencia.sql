-- "Negocios en tendencia": señal real de popularidad, no inventada.
-- Se apoya en page_views (ya se inserta en cada visita real vía
-- /api/track, INSERT abierto pero SELECT restringido al dueño/admin
-- -- ver pv_select_owner/views_read en 20260814200942_remote_schema.sql).
-- Esta vista expone SOLO el conteo agregado de los últimos 7 días por
-- negocio (nunca IP, nunca fila por fila) -- un contador de popularidad
-- público es un dato distinto y de mucho menor sensibilidad que el log
-- crudo de visitas, mismo criterio que cualquier contador de "vistas"
-- público de cualquier plataforma.

CREATE INDEX IF NOT EXISTS "idx_page_views_business_viewed"
  ON "public"."page_views" ("business_id", "viewed_at" DESC)
  WHERE "business_id" IS NOT NULL;

CREATE OR REPLACE VIEW "public"."trending_businesses" AS
SELECT
  b."id", b."name", b."slug", b."category", b."portada_url", b."logo_url",
  b."rating", b."reviews", b."status", b."address",
  COUNT(pv."id") AS "visitas_7d"
FROM "public"."businesses" b
JOIN "public"."page_views" pv
  ON pv."business_id" = b."id" AND pv."viewed_at" >= (now() - interval '7 days')
WHERE b."activo" = true AND b."status" IN ('verificado', 'reclamado')
GROUP BY b."id"
ORDER BY "visitas_7d" DESC;
