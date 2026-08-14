-- ============================================================
-- Fase 2: reportes anónimos, privacidad de favoritos, likes del
-- muro que no persistían, y moderación real de reseñas.
-- ============================================================

-- ----------------------------------------------------------------
-- reports: hoy cualquiera (incluso sin sesión) podía insertar con
-- WITH CHECK(true) sin user_id, y cualquiera podía leer todos los
-- reportes. Se exige sesión + user_id propio para crear, y se
-- restringe la lectura a admin (el único lector real hoy es /admin).
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "reports_insert_any" ON "public"."reports";
DROP POLICY IF EXISTS "reports_select" ON "public"."reports";

CREATE POLICY "reports_select_admin" ON "public"."reports"
  FOR SELECT USING ("public"."is_admin"());
-- "reports_authenticated_insert" (auth.uid() = user_id) ya existente queda como única vía de creación.

-- ----------------------------------------------------------------
-- favorites: "fav_read" exponía CUALQUIER favorito de CUALQUIER
-- usuario a cualquiera (USING true), incluido a través de una
-- consulta anónima directa a la tabla. "fav_write" (ALL, ya
-- correctamente scoped a user_id = auth.uid()) queda como única
-- policy. El conteo agregado de favoritos por negocio pasa a leerse
-- de businesses.favorites_count (ya mantenido por trigger), no de
-- un SELECT abierto sobre favorites.
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "fav_read" ON "public"."favorites";
DROP POLICY IF EXISTS "fav_select_own" ON "public"."favorites";
DROP POLICY IF EXISTS "fav_insert_own" ON "public"."favorites";
DROP POLICY IF EXISTS "fav_delete_own" ON "public"."favorites";

-- ----------------------------------------------------------------
-- muro_posts.likes existía como contador, pero nada lo escribía
-- desde el código (el botón de like solo tocaba localStorage).
-- Se agrega una tabla de likes por usuario (dedup real) + trigger
-- que mantiene muro_posts.likes sincronizado, mismo patrón que ya
-- usa update_business_stats() para favorites_count.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."muro_post_likes" (
  "post_id" "uuid" NOT NULL REFERENCES "public"."muro_posts"("id") ON DELETE CASCADE,
  "user_id" "uuid" NOT NULL,
  "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
  PRIMARY KEY ("post_id", "user_id")
);

ALTER TABLE "public"."muro_post_likes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "muro_likes_select" ON "public"."muro_post_likes" FOR SELECT USING (true);
CREATE POLICY "muro_likes_insert_own" ON "public"."muro_post_likes" FOR INSERT WITH CHECK ("auth"."uid"() = "user_id");
CREATE POLICY "muro_likes_delete_own" ON "public"."muro_post_likes" FOR DELETE USING ("auth"."uid"() = "user_id");

CREATE OR REPLACE FUNCTION "public"."update_muro_post_likes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.muro_posts SET likes = COALESCE(likes, 0) + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.muro_posts SET likes = GREATEST(0, COALESCE(likes, 0) - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS "trg_muro_post_likes" ON "public"."muro_post_likes";
CREATE TRIGGER "trg_muro_post_likes"
  AFTER INSERT OR DELETE ON "public"."muro_post_likes"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_muro_post_likes"();

-- ----------------------------------------------------------------
-- business_reviews: agrega moderación real (ocultar) para el
-- sistema de reseñas que SÍ está vivo en la app (a diferencia de
-- la tabla "reviews", huérfana — ver informe). Mantiene la
-- publicación instantánea actual; el dueño puede ocultar/responder.
-- ----------------------------------------------------------------
ALTER TABLE "public"."business_reviews" ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "brev_select" ON "public"."business_reviews";

CREATE POLICY "business_reviews_public_read" ON "public"."business_reviews"
  FOR SELECT USING (NOT "hidden");

CREATE POLICY "business_reviews_owner_read" ON "public"."business_reviews"
  FOR SELECT USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "businesses"."owner_id"
    FROM "public"."businesses" WHERE ("businesses"."id" = "business_reviews"."business_id")))));
