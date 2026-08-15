import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { user_id, role } = await request.json();
  if (!user_id || !["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "user_id y role ('user' | 'admin') requeridos" }, { status: 400 });
  }
  // Nadie puede quitarle el admin al único admin que queda -- ni a sí
  // mismo ni a otro -- porque dejaría la plataforma sin nadie que pueda
  // revertirlo desde el panel.
  if (role !== "admin") {
    const { data: target } = await sb.from("user_profiles").select("role").eq("user_id", user_id).maybeSingle();
    if (target?.role === "admin") {
      const { count } = await sb.from("user_profiles").select("user_id", { count: "exact", head: true }).eq("role", "admin");
      if ((count || 0) <= 1) {
        return NextResponse.json({ error: "No se puede quitar el rol de admin: es el único admin activo. Convertí a otro usuario en admin primero." }, { status: 400 });
      }
    }
  }

  const { error: dbError } = await sb.from("user_profiles").update({ role }).eq("user_id", user_id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
