-- Reseñas con foto: hasta 3 fotos por reseña (URLs del storage público).
-- La foto de lo que compró vale más que diez estrellas para la confianza
-- local. jsonb simple: el moderador ve la foto igual que el texto.
alter table public.business_reviews add column if not exists photos jsonb default '[]'::jsonb;
