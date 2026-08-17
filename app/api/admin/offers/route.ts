import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, active, impulsar_horas } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // Impulsar: puerta de entrada más chica que un plan completo -- el
  // negocio paga solo por esta oferta puntual, no por el negocio
  // entero. Por ahora lo otorga un admin (mismo criterio manual que ya
  // usa Destacado Semanal, negociado por WhatsApp).
  if (impulsar_horas) {
    const hasta = new Date(Date.now() + Number(impulsar_horas) * 3600000).toISOString();
    const { error: dbError } = await sb.from("offers").update({ impulsada_hasta: hasta }).eq("id", id);
    if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
    return NextResponse.json({ ok: true, impulsada_hasta: hasta });
  }

  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "active (boolean) o impulsar_horas requerido" }, { status: 400 });
  }
  const { error: dbError } = await sb.from("offers").update({ active }).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error: dbError } = await sb.from("offers").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
