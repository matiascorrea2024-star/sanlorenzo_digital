import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

const EDITABLE_FIELDS = [
  "name", "description", "address", "schedule", "whatsapp", "instagram",
  "open", "latitude", "longitude", "portada_url", "logo_url", "items", "promotions",
  "type", "hace_envios", "retiro_en_local", "envio_gratis", "costo_envio", "zona_cobertura",
] as const;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { data: prof } = await sb.from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
  const isAdmin = prof?.role === "admin";

  const { data: business } = await sb.from("businesses").select("id, owner_id").eq("slug", slug).maybeSingle();
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (!isAdmin && business.owner_id !== user.id) {
    return NextResponse.json({ error: "Este negocio no te pertenece" }, { status: 403 });
  }

  const body = await request.json();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  if (typeof update.latitude === "string") update.latitude = update.latitude ? parseFloat(update.latitude as string) : null;
  if (typeof update.longitude === "string") update.longitude = update.longitude ? parseFloat(update.longitude as string) : null;
  if (typeof update.costo_envio === "string") update.costo_envio = update.costo_envio ? parseFloat(update.costo_envio as string) : null;

  const { error: dbError } = await sb.from("businesses").update(update).eq("id", business.id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
