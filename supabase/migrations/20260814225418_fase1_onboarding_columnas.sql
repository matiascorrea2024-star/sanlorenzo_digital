-- Onboarding de 3 pasos al primer login: se persiste en user_profiles
-- (no en localStorage) para que no vuelva a aparecer si el vecino entra
-- desde otro dispositivo. notifications_opt_in guarda el consentimiento
-- para cuando se construya el sistema real de push (Fase 3).
ALTER TABLE "public"."user_profiles" ADD COLUMN IF NOT EXISTS "onboarding_completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "public"."user_profiles" ADD COLUMN IF NOT EXISTS "notifications_opt_in" boolean NOT NULL DEFAULT false;
