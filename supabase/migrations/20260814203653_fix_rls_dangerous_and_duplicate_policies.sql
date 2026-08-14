-- ============================================================
-- Fix RLS: eliminar policies peligrosas y duplicadas acumuladas
-- ============================================================
-- Contexto: la base tiene RLS habilitado en las 35 tablas y ~126 policies,
-- pero se fueron acumulando iteraciones sin limpiar las anteriores.
-- Resultado: en "businesses" y "offers" conviven policies correctas
-- (ownership real vía owner_id / is_admin()) con policies "_auth" que
-- dan USING/WITH CHECK (true) a cualquier usuario autenticado — en
-- Postgres RLS las policies del mismo comando se combinan con OR, así
-- que basta UNA policy permisiva para anular a todas las demás.
--
-- Esta migración:
--   1) Elimina las policies activamente peligrosas (cualquier usuario
--      autenticado podía editar/borrar negocios y ofertas ajenas, o
--      crear ofertas para negocios ajenos).
--   2) Elimina duplicados exactos que no aportan nada (misma condición,
--      distinto nombre, resultado de iteraciones previas).
--   3) Deja como única policy de escritura las ya existentes "biz_write"
--      y "offers_write" (owner_id = auth.uid() OR is_admin()), que ya
--      estaban bien diseñadas pero convivían con las peligrosas.
--
-- No cambia ningún comportamiento hoy permitido a dueños de negocio o
-- admins: toda escritura legítima (dashboard, "Nueva Oferta", panel
-- admin) sigue funcionando igual, verificado contra el código real.

-- ----------------------------------------------------------------
-- businesses: quedan solo "businesses_select_all" (lectura pública)
-- y "biz_write" (owner_id = auth.uid() OR is_admin(), cubre INSERT/
-- UPDATE/DELETE en una sola policy).
-- ----------------------------------------------------------------

-- Peligrosa: cualquier autenticado podía actualizar cualquier negocio.
DROP POLICY IF EXISTS "businesses_update_auth" ON "public"."businesses";
-- Peligrosa: cualquier autenticado podía insertar un negocio con
-- owner_id arbitrario (no forzaba owner_id = auth.uid()).
DROP POLICY IF EXISTS "businesses_insert_auth" ON "public"."businesses";

-- Duplicados de lectura pública (todas equivalentes a USING (true)).
DROP POLICY IF EXISTS "Negocios públicos legibles" ON "public"."businesses";
DROP POLICY IF EXISTS "biz_read" ON "public"."businesses";
DROP POLICY IF EXISTS "lectura publica negocios" ON "public"."businesses";
DROP POLICY IF EXISTS "public read businesses" ON "public"."businesses";
DROP POLICY IF EXISTS "businesses_public_read" ON "public"."businesses";

-- Duplicados de creación por dueño (ya cubierto por "biz_write").
DROP POLICY IF EXISTS "Dueño puede crear negocio" ON "public"."businesses";
DROP POLICY IF EXISTS "dueno crea negocio" ON "public"."businesses";
DROP POLICY IF EXISTS "owner insert businesses" ON "public"."businesses";

-- Duplicados de edición por dueño/admin (ya cubierto por "biz_write").
DROP POLICY IF EXISTS "Dueño puede actualizar su negocio" ON "public"."businesses";
DROP POLICY IF EXISTS "dueno edita negocio" ON "public"."businesses";
DROP POLICY IF EXISTS "owner update businesses" ON "public"."businesses";
-- Admin hardcodeado por email: reemplazado por is_admin() en "biz_write".
DROP POLICY IF EXISTS "admin actualiza negocios" ON "public"."businesses";

-- Duplicados de borrado por dueño (ya cubierto por "biz_write").
DROP POLICY IF EXISTS "Dueño puede borrar su negocio" ON "public"."businesses";
DROP POLICY IF EXISTS "dueno borra negocio" ON "public"."businesses";

-- ----------------------------------------------------------------
-- offers: quedan solo "offers_select_all" (lectura pública) y
-- "offers_write" (dueño del negocio vía EXISTS, OR is_admin()).
-- ----------------------------------------------------------------

-- Peligrosas: cualquier autenticado podía crear/editar/borrar
-- ofertas de CUALQUIER negocio.
DROP POLICY IF EXISTS "offers_insert_auth" ON "public"."offers";
DROP POLICY IF EXISTS "offers_update_auth" ON "public"."offers";
DROP POLICY IF EXISTS "offers_delete_auth" ON "public"."offers";

-- Duplicados de lectura pública.
DROP POLICY IF EXISTS "offers_read" ON "public"."offers";
DROP POLICY IF EXISTS "lectura publica ofertas" ON "public"."offers";

-- Duplicados de escritura por dueño (ya cubierto por "offers_write").
DROP POLICY IF EXISTS "dueno crea oferta" ON "public"."offers";
DROP POLICY IF EXISTS "dueno edita oferta" ON "public"."offers";
DROP POLICY IF EXISTS "dueno borra oferta" ON "public"."offers";
DROP POLICY IF EXISTS "offers_insert_own" ON "public"."offers";
DROP POLICY IF EXISTS "offers_update_own" ON "public"."offers";
DROP POLICY IF EXISTS "offers_delete_own" ON "public"."offers";

-- ----------------------------------------------------------------
-- business_reviews: solo duplicados exactos, sin cambio de
-- comportamiento (se deja para Fase 2 la unificación con "reviews"
-- y el agregado de columnas de moderación).
-- ----------------------------------------------------------------
DROP POLICY IF EXISTS "rev_insert" ON "public"."business_reviews"; -- idéntica a "brev_insert"
DROP POLICY IF EXISTS "rev_read" ON "public"."business_reviews";   -- idéntica a "brev_select"
