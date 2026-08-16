import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, blocked, status } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (blocked !== undefined) {
    if (typeof blocked !== "boolean") return NextResponse.json({ error: "blocked debe ser boolean" }, { status: 400 });
    update.blocked = blocked;
  }
  if (status !== undefined) {
    if (status !== "ended") return NextResponse.json({ error: "status solo puede forzarse a 'ended' desde acá" }, { status: 400 });
    update.status = "ended";
    update.ended_at = new Date().toISOString();
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "nada para actualizar (blocked | status)" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("live_streams").update(update).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error: dbError } = await sb.from("live_streams").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
