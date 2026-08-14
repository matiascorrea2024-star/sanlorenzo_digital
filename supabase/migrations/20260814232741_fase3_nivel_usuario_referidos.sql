-- nivel_usuario debe sumar referidos activos igual que /perfil
-- (30 pts c/u), para que el ranking de /vecinos y el perfil del
-- propio usuario no muestren números distintos.
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
    + (SELECT COUNT(*) * 25 FROM public.business_reviews r WHERE r.user_id = uid AND NOT r.hidden)
    + (SELECT COUNT(*) * 30 FROM public.referrals ref WHERE ref.referrer_id = uid AND ref.activated_at IS NOT NULL);
$$;
