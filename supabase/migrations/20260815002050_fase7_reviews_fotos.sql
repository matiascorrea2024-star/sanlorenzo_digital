-- Fase 7: reseñas con hasta 3 fotos. La validación de "máximo 3" se hace
-- en el cliente (mismo patrón que el resto de límites de la app); acá
-- solo se agrega la columna.
ALTER TABLE "public"."business_reviews" ADD COLUMN IF NOT EXISTS "photos" "text"[] DEFAULT '{}';
