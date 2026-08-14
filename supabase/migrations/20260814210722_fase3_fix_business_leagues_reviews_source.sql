-- La vista business_leagues (fuente única de "puntos" para el sistema de
-- rangos/marcos de negocio) contaba reseñas desde "reviews", una tabla
-- huérfana a la que la app ya no escribe (ver Fase 2). Las reseñas reales
-- viven en "business_reviews" (ocultas cuando el dueño las oculta). Sin
-- este fix, ninguna reseña real sumaba puntos ni reputación.
CREATE OR REPLACE VIEW "public"."business_leagues" AS
 SELECT "b"."id",
    "b"."name",
    "b"."slug",
    "b"."category",
    "b"."logo_url",
    "b"."status",
    (((((COALESCE("f"."seguidores", 0) * 2) + (COALESCE("r"."resenas", 0) * 10)) + (COALESCE("o"."ofertas", 0) * 5)) + (COALESCE("c"."canjes", 0) * 8)) +
        CASE
            WHEN ("b"."status" = 'verificado'::"text") THEN 50
            ELSE 0
        END) AS "puntos",
    COALESCE("f"."seguidores", 0) AS "seguidores",
    COALESCE("r"."resenas", 0) AS "resenas",
    COALESCE("o"."ofertas", 0) AS "ofertas",
    COALESCE("c"."canjes", 0) AS "canjes"
   FROM (((("public"."businesses" "b"
     LEFT JOIN ( SELECT "followers"."business_id",
            ("count"(*))::integer AS "seguidores"
           FROM "public"."followers"
          GROUP BY "followers"."business_id") "f" ON (("f"."business_id" = "b"."id")))
     LEFT JOIN ( SELECT "business_reviews"."business_id",
            ("count"(*))::integer AS "resenas"
           FROM "public"."business_reviews"
          WHERE ("business_reviews"."hidden" = false)
          GROUP BY "business_reviews"."business_id") "r" ON (("r"."business_id" = "b"."id")))
     LEFT JOIN ( SELECT "offers"."business_id",
            ("count"(*))::integer AS "ofertas"
           FROM "public"."offers"
          WHERE ("offers"."active" = true)
          GROUP BY "offers"."business_id") "o" ON (("o"."business_id" = "b"."id")))
     LEFT JOIN ( SELECT "coupons"."business_id",
            ("count"(*))::integer AS "canjes"
           FROM "public"."coupons"
          WHERE ("coupons"."status" = 'redeemed'::"text")
          GROUP BY "coupons"."business_id") "c" ON (("c"."business_id" = "b"."id")));
