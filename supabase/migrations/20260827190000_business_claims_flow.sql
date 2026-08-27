-- Flujo de "reclamar negocio": business_claims tenía RLS activado sin
-- ninguna política (0 políticas) -- en la práctica, nadie podía leer ni
-- escribir la tabla, ni siquiera el dueño de su propia fila. La tabla y
-- sus columnas (claimer_name/email/phone/proof_method/status/admin_notes/
-- reviewed_at/reviewed_by) ya estaban completas, solo faltaba habilitarla.

-- Un usuario autenticado puede crear su propia solicitud de reclamo.
create policy "business_claims_insert_own"
on public.business_claims for insert
to authenticated
with check (claimer_id = auth.uid());

-- Puede ver sus propias solicitudes (para mostrarle el estado); el admin ve todas.
create policy "business_claims_select_own_or_admin"
on public.business_claims for select
to authenticated
using (claimer_id = auth.uid() or public.is_admin());

-- Solo el admin aprueba/rechaza.
create policy "business_claims_update_admin"
on public.business_claims for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Evita que se acumulen reclamos duplicados en revisión para el mismo
-- negocio (sí permite volver a intentar después de un rechazo).
create unique index if not exists business_claims_pending_unique
on public.business_claims (business_id)
where status = 'pending';

create index if not exists business_claims_claimer_idx on public.business_claims (claimer_id);
