import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, status, destacado, activo } = await request.json();
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
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada para actualizar (status | destacado | activo)" }, { status: 400 });
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
