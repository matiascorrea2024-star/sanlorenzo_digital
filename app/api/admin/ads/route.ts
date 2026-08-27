import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

// Aprobar/rechazar una campaña ya pagada (status='pending_review'). Al
// aprobar: si ya arrancó (starts_at pasado) queda activa ahora mismo, si
// no, "scheduled" -- el cron de ciclo de vida (/api/cron/ads-lifecycle) la
// activa solo en la fecha. Rechazar no reactiva el pago -- eso es una
// devolución manual fuera de este flujo, señalado en la respuesta al admin.
export async function PATCH(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, action, admin_notes } = await request.json().catch(() => ({}));
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "id y action ('approve' | 'reject') requeridos" }, { status: 400 });
  }

  const { data: campana } = await sb.from("ad_campaigns")
    .select("id, status, starts_at, business_id, businesses(owner_id, name)").eq("id", id).maybeSingle();
  if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  if (campana.status !== "pending_review") {
    return NextResponse.json({ error: "Esta campaña no está pendiente de revisión" }, { status: 409 });
  }
  const negocio = campana.businesses as unknown as { owner_id: string; name: string } | null;

  const yaEmpezo = new Date(campana.starts_at).getTime() <= Date.now();
  const nuevoEstado = action === "approve" ? (yaEmpezo ? "active" : "scheduled") : "rejected";

  const { error: updError } = await sb.from("ad_campaigns").update({
    status: nuevoEstado,
    active: nuevoEstado === "active",
    admin_notes: admin_notes || null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq("id", id).eq("status", "pending_review");
  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

  if (negocio?.owner_id) {
    await sb.from("notifications").insert({
      user_id: negocio.owner_id,
      business_id: campana.business_id,
      type: "ad_review",
      title: action === "approve" ? "✅ Campaña aprobada" : "❌ Campaña rechazada",
      body: action === "approve"
        ? `Tu publicidad "${negocio.name}" fue aprobada${yaEmpezo ? " y ya está activa" : " y se activará en la fecha programada"}.`
        : `Tu campaña de publicidad no fue aprobada.${admin_notes ? ` Motivo: ${admin_notes}` : ""} Escribinos si tenés dudas.`,
      link: "/dashboard/publicidad",
    });
  }

  return NextResponse.json({ ok: true, status: nuevoEstado });
}
