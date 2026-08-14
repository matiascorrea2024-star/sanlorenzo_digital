-- ============================================================
-- Fase 3: anti-abuso de gamificación.
-- ============================================================

-- Un usuario podía dejar reseñas ilimitadas sobre el mismo negocio,
-- inflando su puntaje (+25 pts c/u en nivel_usuario) y la reputación
-- del negocio sin límite. Se agrega unicidad por (business_id, user_id)
-- para reseñas de usuarios logueados (user_id NULL queda sin restringir
-- por si en el futuro se permiten reseñas anónimas, hoy no es el caso).
CREATE UNIQUE INDEX IF NOT EXISTS "business_reviews_one_per_user"
  ON "public"."business_reviews" ("business_id", "user_id")
  WHERE ("user_id" IS NOT NULL);

-- nivel_usuario tenía dos problemas:
--  1) Contaba reseñas desde "reviews" (tabla huérfana, sin escrituras
--     reales) en vez de "business_reviews" -- igual que business_leagues.
--  2) Sumaba TODAS las filas de user_activity sin deduplicar por
--     negocio: repetir la misma acción (ver/whatsapp/compartir el mismo
--     negocio muchas veces) inflaba el puntaje sin límite. Se dedupe por
--     (business_id, type), igual criterio que ya usa /perfil en el cliente.
CREATE OR REPLACE FUNCTION "public"."nivel_usuario"("uid" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT
    COALESCE((
      SELECT SUM(CASE d.type
        WHEN 'view' THEN 2
        WHEN 'whatsapp' THEN 15
        WHEN 'share' THEN 10
        ELSE 0 END)
      FROM (SELECT DISTINCT business_id, type FROM public.user_activity WHERE user_id = uid) d
    ), 0)
    + (SELECT COUNT(*) * 10 FROM public.followers f WHERE f.user_id = uid)
    + (SELECT COUNT(*) * 25 FROM public.business_reviews r WHERE r.user_id = uid AND NOT r.hidden);
$$;
