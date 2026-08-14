


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."add_pts"("biz" "uuid", "pts" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NULL;
END $$;


ALTER FUNCTION "public"."add_pts"("biz" "uuid", "pts" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_business_league"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO public.business_leagues (id, name, slug, category, rating, reviews)
  VALUES (NEW.id, NEW.name, NEW.slug, NEW.category, NEW.rating, NEW.reviews)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug, category = EXCLUDED.category;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END $$;


ALTER FUNCTION "public"."ensure_business_league"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.user_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."nivel_usuario"("uid" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select
    coalesce((select sum(case type
      when 'view' then 2
      when 'whatsapp' then 15
      when 'share' then 10
      else 0 end) from public.user_activity a where a.user_id = uid), 0)
    + (select count(*) * 10 from public.followers f where f.user_id = uid)
    + (select count(*) * 25 from public.reviews r where r.user_id = uid);
$$;


ALTER FUNCTION "public"."nivel_usuario"("uid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_followers_on_offer"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  biz_name TEXT;
BEGIN
  SELECT name INTO biz_name FROM businesses WHERE id = NEW.business_id;

  -- Intenta con columnas title/body; si no existen, usa message
  BEGIN
    INSERT INTO notifications (user_id, title, body, type, link, business_id)
    SELECT f.user_id,
           '🔥 ' || biz_name || ' publicó una nueva oferta',
           NEW.title,
           'offer',
           '/oferta/' || NEW.id,
           NEW.business_id
    FROM followers f
    WHERE f.business_id = NEW.business_id;
  EXCEPTION WHEN undefined_column THEN
    INSERT INTO notifications (user_id, message, type, link, business_id)
    SELECT f.user_id,
           '🔥 ' || biz_name || ' publicó una nueva oferta: ' || NEW.title,
           'offer',
           '/oferta/' || NEW.id,
           NEW.business_id
    FROM followers f
    WHERE f.business_id = NEW.business_id;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_followers_on_offer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pts_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN PERFORM add_pts(NEW.business_id, 5); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."pts_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pts_offer"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN PERFORM add_pts(NEW.business_id, 20); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."pts_offer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pts_post"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN PERFORM add_pts(NEW.business_id, 10); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."pts_post"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pts_product"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN PERFORM add_pts(NEW.business_id, 10); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."pts_product"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."pts_review"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN PERFORM add_pts(NEW.business_id, 5); RETURN NEW; END;
$$;


ALTER FUNCTION "public"."pts_review"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_business_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE businesses 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.business_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE businesses 
    SET favorites_count = favorites_count - 1
    WHERE id = OLD.business_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_business_stats"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_feed" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "business_id" "uuid",
    "user_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "link" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_feed" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" bigint NOT NULL,
    "business_id" "uuid",
    "event_name" "text" NOT NULL,
    "path" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_type" "text" NOT NULL,
    "offer_id" "uuid",
    "product_id" "uuid"
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


ALTER TABLE "public"."analytics_events" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."analytics_events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "claimer_id" "uuid",
    "claimer_name" "text",
    "claimer_email" "text",
    "claimer_phone" "text",
    "proof_method" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid"
);


ALTER TABLE "public"."business_claims" OWNER TO "postgres";


COMMENT ON TABLE "public"."business_claims" IS 'Reclamos de negocios por dueños reales';



CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "category" "text" NOT NULL,
    "type" "text" DEFAULT 'comercio'::"text" NOT NULL,
    "description" "text",
    "address" "text",
    "schedule" "text",
    "whatsapp" "text",
    "instagram" "text",
    "accent" "text" DEFAULT '#8B5CF6'::"text",
    "status" "text" DEFAULT 'no_reclamado'::"text",
    "demo" boolean DEFAULT false,
    "open" boolean DEFAULT true,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "items" "jsonb" DEFAULT '[]'::"jsonb",
    "professionals" "jsonb" DEFAULT '[]'::"jsonb",
    "rating" numeric DEFAULT 0,
    "reviews" integer DEFAULT 0,
    "promotions" "jsonb" DEFAULT '[]'::"jsonb",
    "latitude" numeric,
    "longitude" numeric,
    "published" boolean DEFAULT true NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "city" "text" DEFAULT 'San Lorenzo'::"text",
    "province" "text" DEFAULT 'Santa Fe'::"text",
    "country" "text" DEFAULT 'Argentina'::"text",
    "website" "text",
    "cover_url" "text",
    "logo_url" "text",
    "phone" "text",
    "email" "text",
    "views" integer DEFAULT 0 NOT NULL,
    "favorites_count" integer DEFAULT 0 NOT NULL,
    "portada_url" "text",
    "activo" boolean DEFAULT true,
    "plan" "text" DEFAULT 'gratis'::"text",
    "destacado" boolean DEFAULT false,
    "location_verified" boolean DEFAULT false,
    "location_id" "uuid",
    "neighborhood_id" "uuid",
    "subcategory" "text",
    "ofertas_al_cerrar" boolean DEFAULT true
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "offer_id" "uuid",
    "user_id" "uuid",
    "code" "text" NOT NULL,
    "status" "text" DEFAULT 'generated'::"text",
    "generated_at" timestamp with time zone DEFAULT "now"(),
    "redeemed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "qr_data" "text"
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


COMMENT ON TABLE "public"."coupons" IS 'Cupones generados y canjeados para tracking de conversión';



CREATE TABLE IF NOT EXISTS "public"."followers" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "business_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."followers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "title" "text" NOT NULL,
    "product" "text",
    "old_price" numeric,
    "offer_price" numeric,
    "discount_percent" integer,
    "image_url" "text",
    "whatsapp" "text",
    "valid_until" "date",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text"
);


ALTER TABLE "public"."offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" bigint NOT NULL,
    "business_id" "uuid",
    "author_name" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "user_email" "text",
    "approved" boolean DEFAULT true,
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Reseñas de usuarios sobre negocios';



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
     LEFT JOIN ( SELECT "reviews"."business_id",
            ("count"(*))::integer AS "resenas"
           FROM "public"."reviews"
          GROUP BY "reviews"."business_id") "r" ON (("r"."business_id" = "b"."id")))
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


ALTER VIEW "public"."business_leagues" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "kind" "text" DEFAULT 'image'::"text" NOT NULL,
    "alt" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."business_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "reviewer_name" "text" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "reply" "text",
    "replied_at" timestamp with time zone,
    "verified_visit" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."business_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "content_type" "text" DEFAULT 'text'::"text",
    "text" "text",
    "image_url" "text",
    "background" "text" DEFAULT 'from-orange-500 to-pink-500'::"text",
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."business_stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "parent_id" "uuid",
    "type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "locations_type_check" CHECK (("type" = ANY (ARRAY['country'::"text", 'province'::"text", 'city'::"text", 'neighborhood'::"text"])))
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."businesses_with_location" AS
 SELECT "b"."id",
    "b"."owner_id",
    "b"."name",
    "b"."slug",
    "b"."category",
    "b"."type",
    "b"."description",
    "b"."address",
    "b"."schedule",
    "b"."whatsapp",
    "b"."instagram",
    "b"."accent",
    "b"."status",
    "b"."demo",
    "b"."open",
    "b"."tags",
    "b"."updated_at",
    "b"."created_at",
    "b"."items",
    "b"."professionals",
    "b"."rating",
    "b"."reviews",
    "b"."promotions",
    "b"."latitude",
    "b"."longitude",
    "b"."published",
    "b"."featured",
    "b"."city",
    "b"."province",
    "b"."country",
    "b"."website",
    "b"."cover_url",
    "b"."logo_url",
    "b"."phone",
    "b"."email",
    "b"."views",
    "b"."favorites_count",
    "b"."portada_url",
    "b"."activo",
    "b"."plan",
    "b"."destacado",
    "b"."location_verified",
    "b"."location_id",
    "b"."neighborhood_id",
    "l_city"."name" AS "city_name",
    "l_city"."slug" AS "city_slug",
    "l_neigh"."name" AS "neighborhood_name",
    "l_neigh"."slug" AS "neighborhood_slug"
   FROM (("public"."businesses" "b"
     LEFT JOIN "public"."locations" "l_city" ON (("b"."location_id" = "l_city"."id")))
     LEFT JOIN "public"."locations" "l_neigh" ON (("b"."neighborhood_id" = "l_neigh"."id")));


ALTER VIEW "public"."businesses_with_location" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "custom_name" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone,
    "address" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."favorites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "item_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "favorites_item_type_check" CHECK (("item_type" = ANY (ARRAY['business'::"text", 'offer'::"text", 'product'::"text"])))
);


ALTER TABLE "public"."favorites" OWNER TO "postgres";


ALTER TABLE "public"."followers" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."followers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "name" "text" NOT NULL,
    "price" "text",
    "note" "text"
);


ALTER TABLE "public"."items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."list_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "list_id" "uuid",
    "business_id" "uuid",
    "added_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."list_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "sender_id" "uuid",
    "sender_role" "text" DEFAULT 'customer'::"text",
    "sender_name" "text",
    "body" "text" NOT NULL,
    "read_by_business" boolean DEFAULT false,
    "read_by_customer" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "customer_id" "uuid"
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."metrics" (
    "id" bigint NOT NULL,
    "business_id" "uuid",
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."metrics" OWNER TO "postgres";


ALTER TABLE "public"."metrics" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."metrics_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."muro_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "image_url" "text",
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "muro_posts_type_check" CHECK (("type" = ANY (ARRAY['oferta'::"text", 'novedad'::"text", 'evento'::"text", 'apertura'::"text", 'producto'::"text", 'anuncio'::"text"])))
);


ALTER TABLE "public"."muro_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "business_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text",
    "body" "text",
    "link" "text",
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'Notificaciones para usuarios';



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
    "b"."longitude" AS "business_longitude"
   FROM ("public"."offers" "o"
     LEFT JOIN "public"."businesses" "b" ON (("o"."business_id" = "b"."id")))
  WHERE ("o"."active" = true);


ALTER VIEW "public"."offers_with_business" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "source" "text" DEFAULT 'web'::"text",
    "ip" "text",
    "path" "text"
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "image_url" "text",
    "published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "old_price" numeric(10,2),
    "category" "text",
    "images" "text"[] DEFAULT '{}'::"text"[],
    "stock" integer,
    "active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promotions_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "discount_text" "text",
    "starts_at" timestamp with time zone,
    "ends_at" timestamp with time zone,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."promotions_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "user_id" "uuid",
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."reports" IS 'Reportes de contenido inapropiado';



CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "offer_id" "uuid",
    "user_id" "uuid",
    "user_name" "text",
    "user_phone" "text",
    "quantity" integer DEFAULT 1,
    "status" "text" DEFAULT 'pending'::"text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


COMMENT ON TABLE "public"."reservations" IS 'Reservas de productos/servicios sin pago';



CREATE SEQUENCE IF NOT EXISTS "public"."reviews_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."reviews_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."reviews_id_seq" OWNED BY "public"."reviews"."id";



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid" NOT NULL,
    "plan" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "payment_ref" "text",
    CONSTRAINT "subscriptions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tracked_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "offer_id" "uuid",
    "source" "text" NOT NULL,
    "short_code" "text",
    "full_url" "text",
    "clicks" integer DEFAULT 0,
    "conversions" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_clicked_at" timestamp with time zone
);


ALTER TABLE "public"."tracked_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."tracked_links" IS 'Links rastreables para automarketing';



CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "business_id" "uuid",
    "type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


ALTER TABLE "public"."user_activity" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."user_activity_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_id" "uuid",
    "offer_id" "uuid",
    "alert_type" "text" NOT NULL,
    "search_query" "text",
    "product_name" "text",
    "original_price" numeric,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "triggered_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_lists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_lists" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_lists" IS 'Listas creadas por usuarios';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text",
    "last_seen_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."visits" (
    "id" bigint NOT NULL,
    "ip" "text",
    "ua" "text",
    "path" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."visits" OWNER TO "postgres";


ALTER TABLE "public"."visits" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."visits_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."reviews" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."reviews_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_feed"
    ADD CONSTRAINT "activity_feed_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_blocked_id_key" UNIQUE ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_claims"
    ADD CONSTRAINT "business_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_media"
    ADD CONSTRAINT "business_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_stories"
    ADD CONSTRAINT "business_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_business_id_customer_id_key" UNIQUE ("business_id", "customer_id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_item_id_item_type_key" UNIQUE ("user_id", "item_id", "item_type");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_user_id_business_id_key" UNIQUE ("user_id", "business_id");



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_list_id_business_id_key" UNIQUE ("list_id", "business_id");



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_slug_parent_id_key" UNIQUE ("slug", "parent_id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."metrics"
    ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."muro_posts"
    ADD CONSTRAINT "muro_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."promotions_v2"
    ADD CONSTRAINT "promotions_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracked_links"
    ADD CONSTRAINT "tracked_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tracked_links"
    ADD CONSTRAINT "tracked_links_short_code_key" UNIQUE ("short_code");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_alerts"
    ADD CONSTRAINT "user_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_lists"
    ADD CONSTRAINT "user_lists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."visits"
    ADD CONSTRAINT "visits_pkey" PRIMARY KEY ("id");



CREATE INDEX "analytics_business_date_idx" ON "public"."analytics_events" USING "btree" ("business_id", "created_at");



CREATE INDEX "analytics_event_name_idx" ON "public"."analytics_events" USING "btree" ("event_name");



CREATE INDEX "business_media_business_idx" ON "public"."business_media" USING "btree" ("business_id");



CREATE INDEX "businesses_category_idx" ON "public"."businesses" USING "btree" ("category");



CREATE INDEX "businesses_city_idx" ON "public"."businesses" USING "btree" ("city");



CREATE INDEX "businesses_featured_idx" ON "public"."businesses" USING "btree" ("featured");



CREATE INDEX "businesses_owner_idx" ON "public"."businesses" USING "btree" ("owner_id");



CREATE INDEX "businesses_published_idx" ON "public"."businesses" USING "btree" ("published");



CREATE INDEX "businesses_slug_idx" ON "public"."businesses" USING "btree" ("slug");



CREATE INDEX "events_business_idx" ON "public"."events" USING "btree" ("business_id");



CREATE INDEX "events_date_idx" ON "public"."events" USING "btree" ("starts_at");



CREATE INDEX "idx_activity_time" ON "public"."activity_feed" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_type" ON "public"."activity_feed" USING "btree" ("type");



CREATE INDEX "idx_analytics_business" ON "public"."analytics_events" USING "btree" ("business_id");



CREATE INDEX "idx_analytics_time" ON "public"."analytics_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analytics_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_brev_business" ON "public"."business_reviews" USING "btree" ("business_id");



CREATE INDEX "idx_brev_time" ON "public"."business_reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_businesses_category" ON "public"."businesses" USING "btree" ("category");



CREATE INDEX "idx_businesses_location" ON "public"."businesses" USING "btree" ("location_id");



CREATE INDEX "idx_businesses_neighborhood" ON "public"."businesses" USING "btree" ("neighborhood_id");



CREATE INDEX "idx_businesses_owner" ON "public"."businesses" USING "btree" ("owner_id");



CREATE INDEX "idx_businesses_slug" ON "public"."businesses" USING "btree" ("slug");



CREATE INDEX "idx_claims_business" ON "public"."business_claims" USING "btree" ("business_id");



CREATE INDEX "idx_claims_status" ON "public"."business_claims" USING "btree" ("status");



CREATE INDEX "idx_coupons_business" ON "public"."coupons" USING "btree" ("business_id");



CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");



CREATE INDEX "idx_coupons_status" ON "public"."coupons" USING "btree" ("status");



CREATE INDEX "idx_fav_item" ON "public"."favorites" USING "btree" ("item_type", "item_id");



CREATE INDEX "idx_fav_unique" ON "public"."favorites" USING "btree" ("user_id", "item_id", "item_type");



CREATE INDEX "idx_fav_user" ON "public"."favorites" USING "btree" ("user_id");



CREATE INDEX "idx_locations_active" ON "public"."locations" USING "btree" ("active");



CREATE INDEX "idx_locations_parent" ON "public"."locations" USING "btree" ("parent_id");



CREATE INDEX "idx_locations_slug" ON "public"."locations" USING "btree" ("slug");



CREATE INDEX "idx_locations_type" ON "public"."locations" USING "btree" ("type");



CREATE INDEX "idx_messages_business" ON "public"."messages" USING "btree" ("business_id");



CREATE INDEX "idx_messages_time" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_muro_business" ON "public"."muro_posts" USING "btree" ("business_id");



CREATE INDEX "idx_muro_time" ON "public"."muro_posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_muro_type" ON "public"."muro_posts" USING "btree" ("type");



CREATE INDEX "idx_notif_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notif_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_products_active" ON "public"."products" USING "btree" ("active");



CREATE INDEX "idx_products_business" ON "public"."products" USING "btree" ("business_id");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price");



CREATE INDEX "idx_profiles_last_seen" ON "public"."user_profiles" USING "btree" ("last_seen_at" DESC);



CREATE INDEX "idx_pv_business" ON "public"."page_views" USING "btree" ("business_id");



CREATE INDEX "idx_pv_time" ON "public"."page_views" USING "btree" ("viewed_at" DESC);



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_reservations_business" ON "public"."reservations" USING "btree" ("business_id");



CREATE INDEX "idx_reservations_status" ON "public"."reservations" USING "btree" ("status");



CREATE INDEX "idx_reviews_business" ON "public"."reviews" USING "btree" ("business_id");



CREATE INDEX "idx_reviews_user" ON "public"."reviews" USING "btree" ("user_id");



CREATE INDEX "idx_stories_business" ON "public"."business_stories" USING "btree" ("business_id");



CREATE INDEX "idx_stories_expires" ON "public"."business_stories" USING "btree" ("expires_at");



CREATE INDEX "idx_sub_business" ON "public"."subscriptions" USING "btree" ("business_id");



CREATE INDEX "idx_sub_plan" ON "public"."subscriptions" USING "btree" ("plan");



CREATE INDEX "idx_tracked_business" ON "public"."tracked_links" USING "btree" ("business_id");



CREATE INDEX "idx_tracked_source" ON "public"."tracked_links" USING "btree" ("source");



CREATE INDEX "idx_user_alerts_business" ON "public"."user_alerts" USING "btree" ("business_id");



CREATE INDEX "idx_user_alerts_status" ON "public"."user_alerts" USING "btree" ("status");



CREATE INDEX "idx_user_alerts_type" ON "public"."user_alerts" USING "btree" ("alert_type");



CREATE INDEX "idx_user_alerts_user" ON "public"."user_alerts" USING "btree" ("user_id");



CREATE INDEX "posts_business_idx" ON "public"."posts" USING "btree" ("business_id");



CREATE INDEX "posts_published_idx" ON "public"."posts" USING "btree" ("published", "published_at");



CREATE INDEX "promotions_v2_business_idx" ON "public"."promotions_v2" USING "btree" ("business_id");



CREATE INDEX "promotions_v2_dates_idx" ON "public"."promotions_v2" USING "btree" ("starts_at", "ends_at");



CREATE INDEX "reports_business_idx" ON "public"."reports" USING "btree" ("business_id");



CREATE INDEX "reports_status_idx" ON "public"."reports" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "businesses_updated_at" BEFORE UPDATE ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_ensure_league" AFTER INSERT OR UPDATE ON "public"."businesses" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_business_league"();



CREATE OR REPLACE TRIGGER "trg_notify_offer" AFTER INSERT ON "public"."offers" FOR EACH ROW WHEN (("new"."active" = true)) EXECUTE FUNCTION "public"."notify_followers_on_offer"();



CREATE OR REPLACE TRIGGER "trg_pts_follow" AFTER INSERT ON "public"."followers" FOR EACH ROW EXECUTE FUNCTION "public"."pts_follow"();



CREATE OR REPLACE TRIGGER "trg_pts_offer" AFTER INSERT ON "public"."offers" FOR EACH ROW WHEN (("new"."active" = true)) EXECUTE FUNCTION "public"."pts_offer"();



CREATE OR REPLACE TRIGGER "trg_pts_post" AFTER INSERT ON "public"."muro_posts" FOR EACH ROW EXECUTE FUNCTION "public"."pts_post"();



CREATE OR REPLACE TRIGGER "trg_pts_product" AFTER INSERT ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."pts_product"();



CREATE OR REPLACE TRIGGER "trg_pts_review" AFTER INSERT ON "public"."business_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."pts_review"();



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."business_claims"
    ADD CONSTRAINT "business_claims_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_media"
    ADD CONSTRAINT "business_media_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_stories"
    ADD CONSTRAINT "business_stories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_neighborhood_id_fkey" FOREIGN KEY ("neighborhood_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."favorites"
    ADD CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followers"
    ADD CONSTRAINT "followers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."items"
    ADD CONSTRAINT "items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."list_items"
    ADD CONSTRAINT "list_items_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "public"."user_lists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."metrics"
    ADD CONSTRAINT "metrics_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."muro_posts"
    ADD CONSTRAINT "muro_posts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."offers"
    ADD CONSTRAINT "offers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promotions_v2"
    ADD CONSTRAINT "promotions_v2_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracked_links"
    ADD CONSTRAINT "tracked_links_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tracked_links"
    ADD CONSTRAINT "tracked_links_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Cualquiera puede dejar reseña" ON "public"."reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Dueño modera sus reseñas" ON "public"."reviews" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "reviews"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Dueño puede actualizar su negocio" ON "public"."businesses" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Dueño puede borrar su negocio" ON "public"."businesses" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "Dueño puede crear negocio" ON "public"."businesses" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "Dueño ve todas sus reseñas" ON "public"."reviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "reviews"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "Negocios públicos legibles" ON "public"."businesses" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Reseñas aprobadas públicas" ON "public"."reviews" FOR SELECT TO "anon" USING (("status" = 'approved'::"text"));



ALTER TABLE "public"."activity_feed" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activity_insert_auth" ON "public"."activity_feed" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "activity_select_public" ON "public"."activity_feed" FOR SELECT USING (true);



CREATE POLICY "admin actualiza negocios" ON "public"."businesses" FOR UPDATE USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['matiascorrea2024@gmail.com'::"text", 'matiascorrea2025@gmail.com'::"text", 'matiasgazta2027@gmail.com'::"text"])));



CREATE POLICY "admin ve eventos" ON "public"."events" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['matiascorrea2024@gmail.com'::"text", 'matiascorrea2025@gmail.com'::"text", 'matiasgazta2027@gmail.com'::"text"])));



CREATE POLICY "admin ve metrics" ON "public"."metrics" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['matiascorrea2024@gmail.com'::"text", 'matiascorrea2025@gmail.com'::"text", 'matiasgazta2027@gmail.com'::"text"])));



CREATE POLICY "admin ve visitas" ON "public"."visits" FOR SELECT USING ((("auth"."jwt"() ->> 'email'::"text") = ANY (ARRAY['matiascorrea2024@gmail.com'::"text", 'matiascorrea2025@gmail.com'::"text", 'matiasgazta2027@gmail.com'::"text"])));



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "analytics_insert" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "analytics_public_insert" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "analytics_select_owner" ON "public"."analytics_events" FOR SELECT USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "analytics_events"."business_id"))));



CREATE POLICY "biz_read" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "biz_write" ON "public"."businesses" USING ((("owner_id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("owner_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blocks_delete" ON "public"."blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "blocks_insert" ON "public"."blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "blocks_select" ON "public"."blocks" FOR SELECT USING ((("auth"."uid"() = "blocker_id") OR ("auth"."uid"() = "blocked_id")));



CREATE POLICY "brev_insert" ON "public"."business_reviews" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "brev_select" ON "public"."business_reviews" FOR SELECT USING (true);



CREATE POLICY "brev_update_owner" ON "public"."business_reviews" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "business_reviews"."business_id"))));



ALTER TABLE "public"."business_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_media" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "business_media_public_read" ON "public"."business_media" FOR SELECT USING (true);



ALTER TABLE "public"."business_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "businesses_insert_auth" ON "public"."businesses" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "businesses_public_read" ON "public"."businesses" FOR SELECT USING (("published" = true));



CREATE POLICY "businesses_select_all" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "businesses_update_auth" ON "public"."businesses" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "businesses_update_own" ON "public"."businesses" FOR UPDATE TO "authenticated" USING ((("owner_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_insert" ON "public"."contacts" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "contacts"."business_id"))));



CREATE POLICY "contacts_select" ON "public"."contacts" FOR SELECT USING (true);



CREATE POLICY "contacts_update" ON "public"."contacts" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "contacts"."business_id"))));



ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dueno borra negocio" ON "public"."businesses" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "dueno borra oferta" ON "public"."offers" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueno crea negocio" ON "public"."businesses" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "dueno crea oferta" ON "public"."offers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueno edita negocio" ON "public"."businesses" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "dueno edita oferta" ON "public"."offers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueno ve eventos" ON "public"."events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "events"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueno ve metrics" ON "public"."metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "metrics"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueño borra reseñas" ON "public"."reviews" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "reviews"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "dueño modera reseñas" ON "public"."reviews" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "reviews"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_public_read" ON "public"."events" FOR SELECT USING (("active" = true));



CREATE POLICY "fav_delete_own" ON "public"."favorites" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "fav_insert_own" ON "public"."favorites" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "fav_read" ON "public"."favorites" FOR SELECT USING (true);



CREATE POLICY "fav_select_own" ON "public"."favorites" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "fav_write" ON "public"."favorites" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."favorites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fol_read" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "fol_write" ON "public"."followers" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."followers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "items_public_read" ON "public"."items" FOR SELECT USING (true);



CREATE POLICY "lectura publica followers" ON "public"."followers" FOR SELECT USING (true);



CREATE POLICY "lectura publica negocios" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "lectura publica ofertas" ON "public"."offers" FOR SELECT USING (true);



CREATE POLICY "lectura publica reseñas aprobadas" ON "public"."reviews" FOR SELECT USING (("approved" = true));



ALTER TABLE "public"."list_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "locations_admin" ON "public"."locations" USING (("auth"."uid"() IN ( SELECT "user_profiles"."user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = 'admin'::"text"))));



CREATE POLICY "locations_select" ON "public"."locations" FOR SELECT USING (("active" = true));



ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_insert" ON "public"."messages" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "messages_select" ON "public"."messages" FOR SELECT USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "sender_id") OR ("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "messages"."business_id")))));



CREATE POLICY "messages_update" ON "public"."messages" FOR UPDATE USING ((("auth"."uid"() = "customer_id") OR ("auth"."uid"() = "sender_id") OR ("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "messages"."business_id")))));



ALTER TABLE "public"."metrics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "muro_delete" ON "public"."muro_posts" FOR DELETE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "muro_posts"."business_id"))));



CREATE POLICY "muro_insert" ON "public"."muro_posts" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "muro_posts"."business_id"))));



ALTER TABLE "public"."muro_posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "muro_select" ON "public"."muro_posts" FOR SELECT USING (true);



CREATE POLICY "muro_update" ON "public"."muro_posts" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "muro_posts"."business_id"))));



CREATE POLICY "notif_insert_auth" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "notif_insert_trigger" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "notif_select_own" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_update_own" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "offers_delete_auth" ON "public"."offers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "offers_delete_own" ON "public"."offers" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "offers_insert_auth" ON "public"."offers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "offers_insert_own" ON "public"."offers" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "offers_read" ON "public"."offers" FOR SELECT USING (true);



CREATE POLICY "offers_select_all" ON "public"."offers" FOR SELECT USING (true);



CREATE POLICY "offers_update_auth" ON "public"."offers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "offers_update_own" ON "public"."offers" FOR UPDATE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles" "p"
  WHERE (("p"."user_id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "offers_write" ON "public"."offers" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "offers"."business_id") AND ("b"."owner_id" = "auth"."uid"()))))));



CREATE POLICY "owner delete items" ON "public"."items" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "items"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner insert businesses" ON "public"."businesses" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "owner insert items" ON "public"."items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "items"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



CREATE POLICY "owner update businesses" ON "public"."businesses" FOR UPDATE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "owner update items" ON "public"."items" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."businesses" "b"
  WHERE (("b"."id" = "items"."business_id") AND ("b"."owner_id" = "auth"."uid"())))));



ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_public_read" ON "public"."posts" FOR SELECT USING (("published" = true));



ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_insert" ON "public"."products" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "products"."business_id"))));



CREATE POLICY "products_select" ON "public"."products" FOR SELECT USING (("active" = true));



CREATE POLICY "products_update" ON "public"."products" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "products"."business_id"))));



CREATE POLICY "prof_read" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "prof_write" ON "public"."user_profiles" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profiles_admin_update" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "user_profiles_1"."user_id"
   FROM "public"."user_profiles" "user_profiles_1"
  WHERE ("user_profiles_1"."role" = 'admin'::"text"))));



CREATE POLICY "profiles_insert" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "profiles_select" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "promotions_public_read" ON "public"."promotions_v2" FOR SELECT USING ((("active" = true) AND (("ends_at" IS NULL) OR ("ends_at" > "now"()))));



ALTER TABLE "public"."promotions_v2" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read businesses" ON "public"."businesses" FOR SELECT USING (true);



CREATE POLICY "public read items" ON "public"."items" FOR SELECT USING (true);



CREATE POLICY "pv_insert" ON "public"."page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "pv_select_owner" ON "public"."page_views" FOR SELECT USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "page_views"."business_id"))));



CREATE POLICY "registro publico de eventos" ON "public"."events" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "registro publico de metrics" ON "public"."metrics" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "registro publico visitas" ON "public"."visits" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reports_authenticated_insert" ON "public"."reports" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "reports_insert_any" ON "public"."reports" FOR INSERT WITH CHECK (true);



CREATE POLICY "reports_select" ON "public"."reports" FOR SELECT USING (true);



ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rev_delete" ON "public"."business_reviews" FOR DELETE USING (("public"."is_admin"() OR ("user_id" = "auth"."uid"())));



CREATE POLICY "rev_insert" ON "public"."business_reviews" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "rev_read" ON "public"."business_reviews" FOR SELECT USING (true);



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reviews_public_read" ON "public"."reviews" FOR SELECT USING ((("status" IS NULL) OR ("status" = 'published'::"text")));



CREATE POLICY "stories_delete_auth" ON "public"."business_stories" FOR DELETE USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "stories_insert_auth" ON "public"."business_stories" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "stories_select_public" ON "public"."business_stories" FOR SELECT USING (true);



CREATE POLICY "sub_insert_owner" ON "public"."subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "subscriptions"."business_id"))));



CREATE POLICY "sub_select_owner" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "subscriptions"."business_id"))));



CREATE POLICY "sub_update_owner" ON "public"."subscriptions" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "businesses"."owner_id"
   FROM "public"."businesses"
  WHERE ("businesses"."id" = "subscriptions"."business_id"))));



ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tracked_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_lists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_delete_own_alerts" ON "public"."user_alerts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_insert_own_alerts" ON "public"."user_alerts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_select_own_alerts" ON "public"."user_alerts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_alerts" ON "public"."user_alerts" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "usuario crea reseña" ON "public"."reviews" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "usuario deja de seguir" ON "public"."followers" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "usuario registra actividad" ON "public"."user_activity" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "usuario sigue" ON "public"."followers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "usuario ve actividad" ON "public"."user_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "views_insert" ON "public"."page_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "views_read" ON "public"."page_views" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."visits" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_pts"("biz" "uuid", "pts" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."add_pts"("biz" "uuid", "pts" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_pts"("biz" "uuid", "pts" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_business_league"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_business_league"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_business_league"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."nivel_usuario"("uid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."nivel_usuario"("uid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."nivel_usuario"("uid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_followers_on_offer"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_followers_on_offer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_followers_on_offer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pts_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."pts_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pts_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pts_offer"() TO "anon";
GRANT ALL ON FUNCTION "public"."pts_offer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pts_offer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pts_post"() TO "anon";
GRANT ALL ON FUNCTION "public"."pts_post"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pts_post"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pts_product"() TO "anon";
GRANT ALL ON FUNCTION "public"."pts_product"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pts_product"() TO "service_role";



GRANT ALL ON FUNCTION "public"."pts_review"() TO "anon";
GRANT ALL ON FUNCTION "public"."pts_review"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."pts_review"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_business_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_business_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_business_stats"() TO "service_role";



GRANT ALL ON TABLE "public"."activity_feed" TO "anon";
GRANT ALL ON TABLE "public"."activity_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_feed" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."analytics_events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."analytics_events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."analytics_events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."blocks" TO "anon";
GRANT ALL ON TABLE "public"."blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."blocks" TO "service_role";



GRANT ALL ON TABLE "public"."business_claims" TO "anon";
GRANT ALL ON TABLE "public"."business_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."business_claims" TO "service_role";



GRANT ALL ON TABLE "public"."businesses" TO "anon";
GRANT ALL ON TABLE "public"."businesses" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."followers" TO "anon";
GRANT ALL ON TABLE "public"."followers" TO "authenticated";
GRANT ALL ON TABLE "public"."followers" TO "service_role";



GRANT ALL ON TABLE "public"."offers" TO "anon";
GRANT ALL ON TABLE "public"."offers" TO "authenticated";
GRANT ALL ON TABLE "public"."offers" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."business_leagues" TO "anon";
GRANT ALL ON TABLE "public"."business_leagues" TO "authenticated";
GRANT ALL ON TABLE "public"."business_leagues" TO "service_role";



GRANT ALL ON TABLE "public"."business_media" TO "anon";
GRANT ALL ON TABLE "public"."business_media" TO "authenticated";
GRANT ALL ON TABLE "public"."business_media" TO "service_role";



GRANT ALL ON TABLE "public"."business_reviews" TO "anon";
GRANT ALL ON TABLE "public"."business_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."business_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."business_stories" TO "anon";
GRANT ALL ON TABLE "public"."business_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."business_stories" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."businesses_with_location" TO "anon";
GRANT ALL ON TABLE "public"."businesses_with_location" TO "authenticated";
GRANT ALL ON TABLE "public"."businesses_with_location" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."favorites" TO "anon";
GRANT ALL ON TABLE "public"."favorites" TO "authenticated";
GRANT ALL ON TABLE "public"."favorites" TO "service_role";



GRANT ALL ON SEQUENCE "public"."followers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."followers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."followers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."items" TO "anon";
GRANT ALL ON TABLE "public"."items" TO "authenticated";
GRANT ALL ON TABLE "public"."items" TO "service_role";



GRANT ALL ON TABLE "public"."list_items" TO "anon";
GRANT ALL ON TABLE "public"."list_items" TO "authenticated";
GRANT ALL ON TABLE "public"."list_items" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."metrics" TO "anon";
GRANT ALL ON TABLE "public"."metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."metrics" TO "service_role";



GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."metrics_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."muro_posts" TO "anon";
GRANT ALL ON TABLE "public"."muro_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."muro_posts" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."offers_with_business" TO "anon";
GRANT ALL ON TABLE "public"."offers_with_business" TO "authenticated";
GRANT ALL ON TABLE "public"."offers_with_business" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."promotions_v2" TO "anon";
GRANT ALL ON TABLE "public"."promotions_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."promotions_v2" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reviews_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."tracked_links" TO "anon";
GRANT ALL ON TABLE "public"."tracked_links" TO "authenticated";
GRANT ALL ON TABLE "public"."tracked_links" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_activity_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_alerts" TO "anon";
GRANT ALL ON TABLE "public"."user_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."user_lists" TO "anon";
GRANT ALL ON TABLE "public"."user_lists" TO "authenticated";
GRANT ALL ON TABLE "public"."user_lists" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."visits" TO "anon";
GRANT ALL ON TABLE "public"."visits" TO "authenticated";
GRANT ALL ON TABLE "public"."visits" TO "service_role";



GRANT ALL ON SEQUENCE "public"."visits_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."visits_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."visits_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







