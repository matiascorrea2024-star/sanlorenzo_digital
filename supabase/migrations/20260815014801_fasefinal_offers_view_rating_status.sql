-- Auditoría visual (Fase Final): las cards de oferta calculan un "SDL
-- Score" (0-100, sección "más vendido") usando un rating hardcodeado
-- (4.5 para TODOS los negocios, con un TODO en el código) en vez del
-- rating real -- eso hace que el score mostrado en cada card no sea
-- honesto. También falta exponer el status del negocio para poder
-- mostrar un sello de verificado real en la card (hoy solo existe
-- como filtro, no como badge visible en la card).

CREATE OR REPLACE VIEW "public"."offers_with_business" AS
 SELECT "o"."id",
    "o"."business_id",
    "o"."title",
    "o"."product",
    "o"."old_price",
    "o"."offer_price",
    "o"."discount_percent",
    "o"."image_url",
    "o"."whatsapp",
    "o"."valid_until",
    "o"."active",
    "o"."created_at",
    "b"."name" AS "business_name",
    "b"."slug" AS "business_slug",
    "b"."category" AS "business_category",
    "b"."portada_url" AS "business_portada",
    "b"."logo_url" AS "business_logo",
    "b"."whatsapp" AS "business_whatsapp",
    "b"."instagram" AS "business_instagram",
    "b"."address" AS "business_address",
    "b"."latitude" AS "business_latitude",
    "b"."longitude" AS "business_longitude",
    "o"."es_bomba",
    "o"."precio_prometido",
    "b"."destacado" AS "business_destacado",
    "b"."plan" AS "business_plan",
    "b"."rating" AS "business_rating",
    "b"."status" AS "business_status"
   FROM ("public"."offers" "o"
     LEFT JOIN "public"."businesses" "b" ON (("o"."business_id" = "b"."id")))
  WHERE ("o"."active" = true);
