import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, active } = await request.json();
  if (!id || typeof active !== "boolean") {
    return NextResponse.json({ error: "id y active (boolean) requeridos" }, { status: 400 });
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
