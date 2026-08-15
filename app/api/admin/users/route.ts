import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { user_id, role } = await request.json();
  if (!user_id || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "user_id y role ('user' | 'admin') requeridos" }, { status: 400 });
  }
  // Un admin no puede quitarse el rol a sí mismo -- evita quedar afuera
  // del panel sin otro admin que lo revierta.
  if (user_id === user.id && role !== "admin") {
    return NextResponse.json({ error: "No podés quitarte el rol de admin a vos mismo" }, { status: 400 });
  }

  const { error: dbError } = await sb.from("user_profiles").update({ role }).eq("user_id", user_id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
