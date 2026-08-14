-- Asigna rol admin al usuario creado manualmente en el Dashboard de
-- Supabase (Authentication → Users → Add user). No hace nada si ese
-- usuario todavía no existe -- por eso esta migración se deja SIN
-- pushear hasta confirmar que el usuario ya fue creado ahí.
INSERT INTO "public"."user_profiles" ("user_id", "display_name", "role")
SELECT "id", 'Matias', 'admin'
FROM "auth"."users"
WHERE "email" = 'matiascorrea2024@gmail.com'
ON CONFLICT ("user_id") DO UPDATE SET "role" = 'admin', "display_name" = 'Matias';
