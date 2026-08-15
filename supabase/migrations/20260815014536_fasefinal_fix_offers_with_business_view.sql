-- Auditoría visual (Fase Final): la vista "offers_with_business" nunca
-- se actualizó cuando la Fase 3 agregó "es_bomba" y "precio_prometido"
-- a "offers" -- el badge de "precio prometido" en las cards de oferta
-- estaba silenciosamente roto (siempre undefined) desde que se
-- implementó. De paso se agrega el estado real de "destacado" y el
-- plan del negocio, necesarios para la jerarquía visual de ofertas
-- (bomba > destacadas > recientes > todas) que pide esta fase.

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
    "b"."plan" AS "business_plan"
   FROM ("public"."offers" "o"
     LEFT JOIN "public"."businesses" "b" ON (("o"."business_id" = "b"."id")))
  WHERE ("o"."active" = true);
