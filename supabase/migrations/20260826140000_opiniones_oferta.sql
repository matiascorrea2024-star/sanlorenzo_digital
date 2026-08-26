-- Opinión real por oferta: "¿Vale la pena?" Sí/No, un voto por vecino por
-- oferta (se puede cambiar de opinión, no duplicar). Distinto del
-- "Voto del día" (daily_votes, competencia diaria cruzada entre ofertas):
-- esto es sentimiento persistente sobre UNA oferta puntual, visible
-- mientras la oferta esté activa. Mismo patrón de RLS que daily_votes.

CREATE TABLE IF NOT EXISTS "public"."offer_opinions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "offer_id" uuid NOT NULL REFERENCES "public"."offers"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL,
  "vale_la_pena" boolean NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("offer_id", "user_id")
);

ALTER TABLE "public"."offer_opinions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "offer_opinions_select" ON "public"."offer_opinions" FOR SELECT USING (true);
CREATE POLICY "offer_opinions_insert_own" ON "public"."offer_opinions" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "offer_opinions_update_own" ON "public"."offer_opinions" FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "offer_opinions_delete_own" ON "public"."offer_opinions" FOR DELETE USING (auth.uid() = user_id);
