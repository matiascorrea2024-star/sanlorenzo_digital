-- Configuración de la plataforma editable desde /perfil (solo admin),
-- para no volver a hardcodear datos como el WhatsApp de contacto en
-- código/env. Lectura pública (se usa en pantallas de negocio/planes),
-- escritura solo admin.
CREATE TABLE IF NOT EXISTS "public"."platform_settings" (
  "key" "text" PRIMARY KEY,
  "value" "text",
  "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

ALTER TABLE "public"."platform_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_settings_public_read" ON "public"."platform_settings"
  FOR SELECT USING (true);

CREATE POLICY "platform_settings_admin_write" ON "public"."platform_settings"
  FOR ALL USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());

INSERT INTO "public"."platform_settings" ("key", "value") VALUES ('whatsapp_contacto', NULL)
ON CONFLICT ("key") DO NOTHING;
