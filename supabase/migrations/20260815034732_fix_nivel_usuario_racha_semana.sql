-- Fuente única de verdad de puntos de usuario: /perfil calculaba sus
-- puntos en el cliente sumando también un bonus de racha (+50 si hay
-- 7+ días consecutivos de actividad) y un bonus semanal (+40 si esta
-- semana hubo >=10 vistas, >=3 contactos por WhatsApp y >=1 reseña),
-- pero la función nivel_usuario() (usada por /vecinos para armar el
-- ranking y el level-gating) nunca los sumaba -- un mismo usuario
-- podía ver un número en su perfil y aparecer rankeado con otro
-- distinto en /vecinos. Se agregan los mismos dos bonus acá, con la
-- misma fórmula exacta que ya usa app/perfil/page.tsx.

CREATE OR REPLACE FUNCTION "public"."nivel_usuario"("uid" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  WITH dias AS (
    SELECT DISTINCT (created_at AT TIME ZONE 'UTC')::date AS d
    FROM public.user_activity WHERE user_id = uid
  ),
  islas AS (
    SELECT d, d - (ROW_NUMBER() OVER (ORDER BY d))::int AS isla FROM dias
  ),
  rachas AS (
    SELECT COUNT(*) AS largo FROM islas GROUP BY isla
  ),
  base AS (
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
      + (SELECT COUNT(*) * 25 FROM public.business_reviews r WHERE r.user_id = uid AND NOT r.hidden)
      + (SELECT COUNT(*) * 30 FROM public.referrals ref WHERE ref.referrer_id = uid AND ref.activated_at IS NOT NULL)
      AS puntos_base,
      COALESCE((SELECT MAX(largo) FROM rachas), 0) AS max_racha,
      (SELECT COUNT(DISTINCT business_id) FROM public.user_activity WHERE user_id = uid AND type = 'view' AND created_at >= now() - interval '7 days') AS vis_semana,
      (SELECT COUNT(DISTINCT business_id) FROM public.user_activity WHERE user_id = uid AND type = 'whatsapp' AND created_at >= now() - interval '7 days') AS wa_semana,
      (SELECT COUNT(*) FROM public.business_reviews WHERE user_id = uid AND NOT hidden AND created_at >= now() - interval '7 days') AS res_semana
  )
  SELECT
    (puntos_base
      + (CASE WHEN max_racha >= 7 THEN 50 ELSE 0 END)
      + (CASE WHEN vis_semana >= 10 AND wa_semana >= 3 AND res_semana >= 1 THEN 40 ELSE 0 END)
    )::int
  FROM base;
$$;
