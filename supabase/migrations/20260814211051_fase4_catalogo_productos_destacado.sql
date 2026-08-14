-- El catálogo de productos existe (tabla "products", RLS ya correcta con
-- ownership real) pero el formulario nunca subía imagen ni permitía
-- destacar productos, pese a que ya existe la columna "images text[]" y
-- el motor de subida (lib/media.ts + ImageUploader) reutilizado del resto
-- de la app. Se agrega "featured" para poder mostrar destacados primero.
ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "featured" boolean NOT NULL DEFAULT false;
