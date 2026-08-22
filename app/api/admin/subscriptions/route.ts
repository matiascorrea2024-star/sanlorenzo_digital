import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { MAX_DESTACADOS_SEMANALES } from "@/lib/plans";
import { aplicarLimiteCatalogo } from "@/lib/catalogo-limite";

export async function PATCH(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, decision } = await request.json();
  if (!id || !["aprobar", "rechazar"].includes(decision)) {
    return NextResponse.json({ error: "id y decision ('aprobar' | 'rechazar') requeridos" }, { status: 400 });
  }

  const { data: sub, error: subError } = await sb.from("subscriptions").select("*").eq("id", id).maybeSingle();
  if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });
  if (!sub) return NextResponse.json({ error: "Suscripción no encontrada" }, { status: 404 });
  if (sub.status !== "pending") return NextResponse.json({ error: "Esta solicitud ya fue revisada" }, { status: 409 });

  if (decision === "rechazar") {
    const { error: updError } = await sb.from("subscriptions")
      .update({ status: "rechazado", revisado_por: user!.id, revisado_en: new Date().toISOString() })
      .eq("id", id);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Aprobar: "Destacado Semanal" tiene posición fija y cupo limitado --
  // no se aprueba si ya hay MAX_DESTACADOS_SEMANALES negocios con ese
  // plan vigente.
  if (sub.plan === "premium") {
    const { count } = await sb.from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("plan", "premium")
      .gt("plan_expira", new Date().toISOString());
    if ((count || 0) >= MAX_DESTACADOS_SEMANALES) {
      return NextResponse.json({ error: `Ya hay ${MAX_DESTACADOS_SEMANALES} negocios en Destacado Semanal esta semana. Rechazá o esperá a que se libere un cupo.` }, { status: 409 });
    }
  }

  const diasVigencia = sub.plan === "premium" ? 7 : 30;
  const expira = new Date(Date.now() + diasVigencia * 24 * 60 * 60 * 1000).toISOString();

  const { error: bizError } = await sb.from("businesses")
    .update({ plan: sub.plan, destacado: sub.plan === "premium", plan_expira: expira })
    .eq("id", sub.business_id);
  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 });

  // Si el plan nuevo alcanza, esto reactiva solo lo que estaba oculto por
  // haberse pasado del límite del plan anterior (el comerciante no tiene
  // que volver a cargar nada).
  await aplicarLimiteCatalogo(sb, sub.business_id, sub.plan);

  const { error: updError } = await sb.from("subscriptions")
    .update({ status: "active", expires_at: expira, revisado_por: user!.id, revisado_en: new Date().toISOString() })
    .eq("id", id);
  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

  await sb.from("analytics_events").insert({
    business_id: sub.business_id,
    event_name: "payment_confirmed",
    event_type: "payment_confirmed",
    metadata: { plan: sub.plan, provider: "transferencia", subscription_id: sub.id },
  });

  return NextResponse.json({ ok: true });
}
