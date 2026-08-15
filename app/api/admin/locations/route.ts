import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, active, name } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (active !== undefined) {
    if (typeof active !== "boolean") return NextResponse.json({ error: "active debe ser boolean" }, { status: 400 });
    update.active = active;
  }
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (!trimmed) return NextResponse.json({ error: "name no puede estar vacío" }, { status: 400 });
    update.name = trimmed;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada para actualizar (active | name)" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("locations").update(update).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // Protección: no borrar una ciudad/barrio que ya tiene negocios o
  // barrios propios -- evita dejar negocios huérfanos sin ubicación.
  const [{ count: bizCount }, { count: childCount }] = await Promise.all([
    sb.from("businesses").select("id", { count: "exact", head: true }).or(`location_id.eq.${id},neighborhood_id.eq.${id}`),
    sb.from("locations").select("id", { count: "exact", head: true }).eq("parent_id", id),
  ]);
  if ((bizCount || 0) > 0 || (childCount || 0) > 0) {
    return NextResponse.json(
      { error: `No se puede borrar: tiene ${bizCount || 0} negocio(s) y ${childCount || 0} barrio(s) asociados. Reasigná o borrá esos primero.` },
      { status: 409 }
    );
  }

  const { error: dbError } = await sb.from("locations").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
