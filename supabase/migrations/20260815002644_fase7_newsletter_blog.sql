-- Fase 7: newsletter (opt-in real, sin envío automático todavía -- no hay
-- proveedor de mail conectado, así que no se simula ningún envío) + blog
-- de novedades de la plataforma (contenido real, cargado por el admin
-- desde /admin, sin posts de ejemplo).

ALTER TABLE "public"."user_profiles" ADD COLUMN IF NOT EXISTS "newsletter_opt_in" boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "excerpt" text,
  "content" text NOT NULL,
  "cover_url" text,
  "author" text,
  "published" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read" ON "public"."blog_posts" FOR SELECT USING ("published" = true);
CREATE POLICY "blog_posts_admin_read" ON "public"."blog_posts" FOR SELECT USING ("public"."is_admin"());
CREATE POLICY "blog_posts_admin_write" ON "public"."blog_posts" FOR ALL USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

CREATE INDEX IF NOT EXISTS "idx_blog_posts_published" ON "public"."blog_posts" ("published", "created_at" DESC);
