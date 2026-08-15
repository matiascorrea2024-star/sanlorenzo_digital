import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { PLANES, MAX_DESTACADOS_SEMANALES } from "@/lib/plans";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, status, destacado, activo, plan, dias } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!["verificado", "rechazado"].includes(status)) {
      return NextResponse.json({ error: "status debe ser 'verificado' | 'rechazado'" }, { status: 400 });
    }
    update.status = status;
  }
  if (destacado !== undefined) {
    if (typeof destacado !== "boolean") return NextResponse.json({ error: "destacado debe ser boolean" }, { status: 400 });
    update.destacado = destacado;
  }
  if (activo !== undefined) {
    if (typeof activo !== "boolean") return NextResponse.json({ error: "activo debe ser boolean" }, { status: 400 });
    update.activo = activo;
  }
  // Asignación manual de plan -- para cuando vendés/regalás un plan fuera
  // del flujo de comprobante (efectivo, promo, etc.). Mismas reglas que la
  // aprobación automática: Destacado Semanal respeta el cupo de 5 y pone
  // vencimiento; el resto de los flags queda sincronizado.
  if (plan !== undefined) {
    if (!Object.keys(PLANES).includes(plan)) {
      return NextResponse.json({ error: `plan debe ser uno de: ${Object.keys(PLANES).join(", ")}` }, { status: 400 });
    }
    if (plan === "premium") {
      const { count } = await sb.from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("plan", "premium")
        .neq("id", id)
        .gt("plan_expira", new Date().toISOString());
      if ((count || 0) >= MAX_DESTACADOS_SEMANALES) {
        return NextResponse.json({ error: `Ya hay ${MAX_DESTACADOS_SEMANALES} negocios en Destacado Semanal esta semana. Esperá a que se libere un cupo.` }, { status: 409 });
      }
    }
    update.plan = plan;
    update.destacado = plan === "premium";
    const diasVigencia = typeof dias === "number" && dias > 0 ? dias : plan === "premium" ? 7 : plan === "profesional" ? 30 : null;
    update.plan_expira = diasVigencia ? new Date(Date.now() + diasVigencia * 24 * 60 * 60 * 1000).toISOString() : null;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada para actualizar (status | destacado | activo | plan)" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("businesses").update(update).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error: dbError } = await sb.from("businesses").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
