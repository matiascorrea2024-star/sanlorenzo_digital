-- ============================================================
-- Fase 6: monetización -- pago manual (comprobante + activación admin).
-- No se integra ningún cobro automático todavía (Mercado Pago queda
-- como "Próximamente" solo en el texto de /planes).
--
-- Flujo:
--   1) El dueño del negocio sube un comprobante y queda una fila en
--      "subscriptions" con status = 'pending'. `businesses.plan` NO
--      cambia todavía.
--   2) Un admin revisa el comprobante desde /admin y aprueba o
--      rechaza vía la ruta server-side app/api/admin/subscriptions
--      (usa el cliente autenticado + requireAdmin(), sin service role
--      key). Al aprobar, recién ahí se actualiza businesses.plan.
--
-- Corrección de seguridad importante: las policies RLS que ya
-- existían ("sub_insert_owner"/"sub_update_owner") permitían que el
-- propio dueño del negocio insertara o actualizara su fila de
-- suscripción con status = 'active' directamente por RLS, sin pasar
-- por ningún admin -- un "self-checkout" gratis. Esta migración lo
-- cierra: el dueño solo puede INSERTAR filas en status 'pending' (no
-- puede fijar 'active'), y ya no puede hacer UPDATE de sus propias
-- filas en absoluto -- solo un admin puede aprobar/rechazar.
-- ============================================================

ALTER TABLE "public"."subscriptions" DROP CONSTRAINT IF EXISTS "subscriptions_status_check";
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_status_check"
  CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'cancelled'::"text", 'expired'::"text", 'rechazado'::"text"])));

ALTER TABLE "public"."subscriptions" ADD COLUMN IF NOT EXISTS "comprobante_url" "text";
ALTER TABLE "public"."subscriptions" ADD COLUMN IF NOT EXISTS "revisado_por" "uuid" REFERENCES "auth"."users"("id");
ALTER TABLE "public"."subscriptions" ADD COLUMN IF NOT EXISTS "revisado_en" timestamptz;
ALTER TABLE "public"."subscriptions" ALTER COLUMN "status" SET DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS "idx_sub_status" ON "public"."subscriptions" USING "btree" ("status");

DROP POLICY IF EXISTS "sub_insert_owner" ON "public"."subscriptions";
CREATE POLICY "sub_insert_owner" ON "public"."subscriptions" FOR INSERT
  WITH CHECK (
    "status" = 'pending'
    AND ("auth"."uid"() IN ( SELECT "businesses"."owner_id" FROM "businesses" WHERE ("businesses"."id" = "subscriptions"."business_id")))
  );

-- Los dueños ya NO pueden hacer UPDATE de sus propias suscripciones
-- (antes podían auto-aprobarse). Solo lectura de las propias + lo que
-- haga un admin server-side.
DROP POLICY IF EXISTS "sub_update_owner" ON "public"."subscriptions";

CREATE POLICY "sub_select_admin" ON "public"."subscriptions" FOR SELECT USING ("public"."is_admin"());
CREATE POLICY "sub_update_admin" ON "public"."subscriptions" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());
CREATE POLICY "sub_insert_admin" ON "public"."subscriptions" FOR INSERT WITH CHECK ("public"."is_admin"());
