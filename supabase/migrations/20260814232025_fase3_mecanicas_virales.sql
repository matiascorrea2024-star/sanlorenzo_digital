-- ============================================================
-- Fase 3: mecánicas virales -- referidos, oferta bomba, voto del
-- día, sello "Precio Prometido". Todo con persistencia real (tablas
-- + triggers), nada simulado en el cliente.
-- ============================================================

-- ----------------------------------------------------------------
-- A) Referidos: tracking real + recompensas automáticas por trigger.
-- "Activo" = el referido completó el onboarding (señal real de
-- que empezó a usar la plataforma, no solo se registró).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."referrals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrer_id" uuid NOT NULL,
  "referred_id" uuid NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "activated_at" timestamptz
);
ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_select_own" ON "public"."referrals" FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "referrals_insert_self" ON "public"."referrals" FOR INSERT WITH CHECK (auth.uid() = referred_id AND referrer_id <> referred_id);

ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "boost_nuevo_hasta" timestamptz;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "destacado_mes" boolean NOT NULL DEFAULT false;
ALTER TABLE "public"."businesses" ADD COLUMN IF NOT EXISTS "plan_expira" timestamptz;

CREATE OR REPLACE FUNCTION "public"."aplicar_recompensas_referidos"() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  ref_row RECORD;
  activos integer;
  biz_id uuid;
BEGIN
  IF NEW.onboarding_completed = true AND COALESCE(OLD.onboarding_completed, false) = false THEN
    UPDATE public.referrals SET activated_at = now()
      WHERE referred_id = NEW.user_id AND activated_at IS NULL
      RETURNING * INTO ref_row;

    IF ref_row IS NOT NULL THEN
      SELECT count(*) INTO activos FROM public.referrals WHERE referrer_id = ref_row.referrer_id AND activated_at IS NOT NULL;
      SELECT id INTO biz_id FROM public.businesses WHERE owner_id = ref_row.referrer_id ORDER BY created_at ASC LIMIT 1;

      IF biz_id IS NOT NULL THEN
        IF activos >= 3 THEN
          UPDATE public.businesses SET boost_nuevo_hasta = GREATEST(COALESCE(boost_nuevo_hasta, now()), now()) + interval '3 days' WHERE id = biz_id;
        END IF;
        IF activos >= 10 THEN
          UPDATE public.businesses SET plan = 'profesional', plan_expira = now() + interval '1 month' WHERE id = biz_id AND plan = 'gratis';
        END IF;
        IF activos >= 25 THEN
          UPDATE public.businesses SET destacado_mes = true WHERE id = biz_id;
        END IF;
        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (ref_row.referrer_id, 'referral', '🎉 ¡Sumaste un referido activo!', 'Llevás ' || activos || ' referidos activos.', '/invitar');
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_recompensas_referidos" ON "public"."user_profiles";
CREATE TRIGGER "trg_recompensas_referidos"
  AFTER UPDATE ON "public"."user_profiles"
  FOR EACH ROW EXECUTE FUNCTION "public"."aplicar_recompensas_referidos"();

-- ----------------------------------------------------------------
-- D) Oferta bomba del día: el dueño marca una oferta propia: 18:00 a
-- 20:00, visible solo para vecinos nivel Explorador+ (50+ pts).
-- ----------------------------------------------------------------
ALTER TABLE "public"."offers" ADD COLUMN IF NOT EXISTS "es_bomba" boolean NOT NULL DEFAULT false;

-- ----------------------------------------------------------------
-- E) Voto del día: un voto por usuario por oferta por día.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."daily_votes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "offer_id" uuid NOT NULL REFERENCES "public"."offers"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL,
  "vote_date" date NOT NULL DEFAULT CURRENT_DATE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("user_id", "vote_date")
);
ALTER TABLE "public"."daily_votes" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_votes_select" ON "public"."daily_votes" FOR SELECT USING (true);
CREATE POLICY "daily_votes_insert_own" ON "public"."daily_votes" FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_votes_delete_own" ON "public"."daily_votes" FOR DELETE USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- G) Sello "Precio Prometido": el admin certifica que el precio de
-- una oferta es real. "Comercio Verificado" ya existía (businesses.status).
-- ----------------------------------------------------------------
ALTER TABLE "public"."offers" ADD COLUMN IF NOT EXISTS "precio_prometido" boolean NOT NULL DEFAULT false;
