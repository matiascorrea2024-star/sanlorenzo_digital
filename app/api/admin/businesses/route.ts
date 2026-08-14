import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, status } = await request.json();
  if (!id || !["verificado", "rechazado"].includes(status)) {
    return NextResponse.json({ error: "id y status ('verificado' | 'rechazado') requeridos" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("businesses").update({ status }).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
