import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Aprobar/rechazar una solicitud de "reclamar negocio". Aprobar hace dos
// cosas atómicas del lado de la app: marca la solicitud como aprobada Y
// asigna el owner_id real en businesses -- ahí es donde el reclamante
// pasa a tener acceso de verdad al dashboard (RLS de businesses ya
// permite escritura a owner_id = auth.uid()). También le dejamos una
// notificación real (dispara el push que ya existe, sin nada nuevo).
export async function PATCH(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, action, admin_notes } = await request.json().catch(() => ({}));
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id y action ('approve' | 'reject') requeridos" }, { status: 400 });
  }

  const { data: claim, error: claimError } = await sb.from("business_claims")
    .select("id, business_id, claimer_id, status, businesses(name, owner_id)")
    .eq("id", id).maybeSingle();
  if (claimError || !claim) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
  if (claim.status !== "pending") {
    return NextResponse.json({ error: "Esta solicitud ya fue revisada" }, { status: 409 });
  }
  const negocio = claim.businesses as unknown as { name: string; owner_id: string | null } | null;
  if (negocio?.owner_id) {
    return NextResponse.json({ error: "Este negocio ya tiene un dueño asignado" }, { status: 409 });
  }

  const { error: updClaimError } = await sb.from("business_claims").update({
    status: action === "approve" ? "approved" : "rejected",
    admin_notes: admin_notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq("id", id);
  if (updClaimError) return NextResponse.json({ error: updClaimError.message }, { status: 500 });

  if (action === "approve") {
    const { error: updBizError } = await sb.from("businesses")
      .update({ owner_id: claim.claimer_id, status: "reclamado" })
      .eq("id", claim.business_id)
      .is("owner_id", null);
    if (updBizError) return NextResponse.json({ error: updBizError.message }, { status: 500 });
  }

  await sb.from("notifications").insert({
    user_id: claim.claimer_id,
    type: "business_claim",
    title: action === "approve" ? "✅ Reclamo aprobado" : "❌ Reclamo rechazado",
    body: action === "approve"
      ? `Ya sos el dueño de "${negocio?.name}" en La Gran Barata Digital. Entrá a tu panel para administrarlo.`
      : `No pudimos confirmar tu reclamo de "${negocio?.name}".${admin_notes ? ` Motivo: ${admin_notes}` : ""}`,
    link: action === "approve" ? "/dashboard/mis-negocios" : "/negocios",
  });

  return NextResponse.json({ ok: true });
}
