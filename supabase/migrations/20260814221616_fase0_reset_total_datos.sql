-- ============================================================
-- FASE 0 — Reset total de datos antes del lanzamiento viral.
-- Borra TODOS los datos de negocios/ofertas/actividad/usuarios de
-- perfil, para arrancar de cero. NO toca schema, columnas, RLS ni
-- auth.users (eso se vacía aparte, desde el Dashboard de Supabase).
-- CASCADE por si alguna FK no listada explícitamente depende de estas.
-- ============================================================
TRUNCATE TABLE
  "public"."activity_feed",
  "public"."analytics_events",
  "public"."blocks",
  "public"."business_claims",
  "public"."business_media",
  "public"."business_reviews",
  "public"."business_stories",
  "public"."businesses",
  "public"."contacts",
  "public"."coupons",
  "public"."events",
  "public"."favorites",
  "public"."followers",
  "public"."items",
  "public"."list_items",
  "public"."locations",
  "public"."messages",
  "public"."metrics",
  "public"."muro_post_likes",
  "public"."muro_posts",
  "public"."notifications",
  "public"."offers",
  "public"."page_views",
  "public"."posts",
  "public"."products",
  "public"."promotions_v2",
  "public"."reports",
  "public"."reservations",
  "public"."reviews",
  "public"."subscriptions",
  "public"."tracked_links",
  "public"."user_activity",
  "public"."user_alerts",
  "public"."user_lists",
  "public"."user_profiles",
  "public"."visits"
CASCADE;
