import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { validarBody } from "@/lib/validate";
import { z } from "zod";

// Etiquetas de producto/oferta dentro de un reel (reel_products). RLS ya
// exige que el reel pertenezca a un negocio del usuario (ver migración
// 20260827200000_reel_products_rls_fix.sql) -- esta ruta agrega la
// validación de datos y las reglas de negocio (un producto o una oferta,
// nunca ninguno o los dos; que pertenezcan al mismo negocio que el reel).
const createSchema = z.object({
  reel_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  offer_id: z.string().uuid().optional(),
  label: z.string().trim().max(80).optional(),
  timecode_seconds: z.number().int().min(0).max(600).default(0),
}).refine((d) => (!!d.product_id) !== (!!d.offer_id), {
  message: "Elegí un producto O una oferta, no ambos ni ninguno",
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 20, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const parsed = validarBody(createSchema, await request.json().catch(() => ({})));
  if (parsed instanceof NextResponse) return parsed;
  const { reel_id, product_id, offer_id, label, timecode_seconds } = parsed;

  const { data: reel } = await sb.from("reels").select("id, business_id").eq("id", reel_id).maybeSingle();
  if (!reel) return NextResponse.json({ error: "Reel no encontrado" }, { status: 404 });

  const { data: negocio } = await sb.from("businesses").select("owner_id").eq("id", reel.business_id).maybeSingle();
  if (!negocio || negocio.owner_id !== user.id) {
    return NextResponse.json({ error: "Este reel no es tuyo" }, { status: 403 });
  }

  if (product_id) {
    const { data: p } = await sb.from("products").select("id, business_id").eq("id", product_id).maybeSingle();
    if (!p || p.business_id !== reel.business_id) {
      return NextResponse.json({ error: "El producto debe ser de tu mismo negocio" }, { status: 400 });
    }
  }
  if (offer_id) {
    const { data: o } = await sb.from("offers").select("id, business_id").eq("id", offer_id).maybeSingle();
    if (!o || o.business_id !== reel.business_id) {
      return NextResponse.json({ error: "La oferta debe ser de tu mismo negocio" }, { status: 400 });
    }
  }

  const { data: creado, error: insertError } = await sb.from("reel_products").insert({
    reel_id,
    reel_table: "reels",
    product_id: product_id || null,
    offer_id: offer_id || null,
    label: label || null,
    timecode_seconds,
  }).select().single();
  if (insertError) return NextResponse.json({ error: "No se pudo crear la etiqueta" }, { status: 500 });

  return NextResponse.json(creado, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const { id } = await request.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  // RLS (reelp_owner) ya impide borrar una etiqueta de un reel ajeno --
  // si el delete no afecta filas, o bien no existía o bien no era tuya.
  const { data, error: deleteError } = await sb.from("reel_products").delete().eq("id", id).select("id");
  if (deleteError) return NextResponse.json({ error: "No se pudo eliminar la etiqueta" }, { status: 500 });
  if (!data || data.length === 0) return NextResponse.json({ error: "Etiqueta no encontrada o no es tuya" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
