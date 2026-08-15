import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

const STATUSES = ["draft", "inactive", "active", "suspended", "archived"] as const;

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, active, name, status } = await request.json();
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

  let warning: string | undefined;
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: `status debe ser uno de: ${STATUSES.join(", ")}` }, { status: 400 });
    }
    if (status === "active") {
      const { data: loc } = await sb.from("locations").select("name, slug, latitude, longitude, type").eq("id", id).maybeSingle();
      if (!loc) return NextResponse.json({ error: "Ciudad no encontrada" }, { status: 404 });
      const faltantes: string[] = [];
      if (!loc.name) faltantes.push("nombre");
      if (!loc.slug) faltantes.push("slug");
      if (loc.latitude == null || loc.longitude == null) faltantes.push("coordenadas (para el mapa)");
      if (faltantes.length) {
        return NextResponse.json(
          { error: `No se puede activar: falta ${faltantes.join(", ")}.` },
          { status: 400 }
        );
      }
      if (loc.type === "city") {
        const { count } = await sb.from("businesses").select("id", { count: "exact", head: true }).eq("location_id", id);
        if (!count) warning = "Se activó sin negocios cargados todavía -- la ciudad va a mostrar el estado vacío hasta que se sumen los primeros.";
      }
    }
    // "active" (boolean) se mantiene en sync por compatibilidad -- todo
    // el código existente que filtra por active=true sigue funcionando
    // igual sin tener que tocar cada query para que lea "status".
    update.status = status;
    update.active = status === "active";
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada para actualizar (active | name | status)" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("locations").update(update).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true, warning });
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
      { error: `No se puede borrar: tiene ${bizCount || 0} negocio(s) y ${childCount || 0} barrio(s) asociados. Reasigná o borrá esos primero, o archivala en vez de borrarla.` },
      { status: 409 }
    );
  }

  const { error: dbError } = await sb.from("locations").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
