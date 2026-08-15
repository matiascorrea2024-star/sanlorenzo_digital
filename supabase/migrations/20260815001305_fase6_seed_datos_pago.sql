INSERT INTO "public"."platform_settings" ("key", "value") VALUES ('datos_pago', NULL)
ON CONFLICT ("key") DO NOTHING;
