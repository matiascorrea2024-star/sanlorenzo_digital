import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { PLANES } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const { sb, user, isAdmin, error } = await requireAdmin();
  if (!isAdmin || !user) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { title, description, grants_plan, grants_dias, max_cupos, ends_at } = await request.json();
  if (!title?.trim()) return NextResponse.json({ error: "title requerido" }, { status: 400 });
  if (!Object.keys(PLANES).includes(grants_plan)) return NextResponse.json({ error: `grants_plan debe ser uno de: ${Object.keys(PLANES).join(", ")}` }, { status: 400 });
  if (!(Number(grants_dias) > 0)) return NextResponse.json({ error: "grants_dias debe ser mayor a 0" }, { status: 400 });

  const { data, error: dbError } = await sb.from("campaigns").insert({
    title: title.trim(),
    description: description?.trim() || null,
    grants_plan,
    grants_dias: Number(grants_dias),
    max_cupos: max_cupos ? Number(max_cupos) : null,
    ends_at: ends_at || null,
    created_by: user.id,
  }).select().single();
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { sb, isAdmin, error } = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error }, { status: error === "No autorizado" ? 401 : 403 });

  const { id, active } = await request.json();
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });
  if (typeof active !== "boolean") return NextResponse.json({ error: "active debe ser boolean" }, { status: 400 });

  const { error: dbError } = await sb.from("campaigns").update({ active }).eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
