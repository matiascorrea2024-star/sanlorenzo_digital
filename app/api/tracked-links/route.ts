import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getRateLimitHeader, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const SOURCES = new Set(["share", "whatsapp", "instagram", "facebook", "qr", "invite"]);

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 20, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const body = await request.json().catch(() => ({}));
  const businessId = typeof body.business_id === "string" ? body.business_id : null;
  const offerId = typeof body.offer_id === "string" ? body.offer_id : null;
  const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : "share";
  if (!businessId && !offerId) {
    return NextResponse.json({ error: "business_id u offer_id requerido" }, { status: 400 });
  }

  const sb = await createClient();
  const { data, error } = await sb.rpc("create_tracked_link", {
    p_business_id: businessId,
    p_offer_id: offerId,
    p_source: source,
  });
  if (error || !data?.[0]?.short_code) {
    // El RPC devuelve códigos de error propios (ver supabase/migrations/*_fix_tracked_link_reuse.sql)
    // como mensaje de la excepción. "business_not_public" es una regla de negocio (negocio no
    // verificado/reclamado), no una falla técnica -- el cliente lo usa para no invitar a
    // "reintentar" algo que reintentar no arregla.
    const code = error?.message?.includes("business_not_public") ? "business_not_public" : "unknown";
    const message = code === "business_not_public"
      ? "Tu negocio todavía no está verificado"
      : "No se pudo crear el link rastreable";
    return NextResponse.json({ error: message, code }, { status: 400 });
  }

  return NextResponse.json({
    short_code: data[0].short_code,
    short_url: `${request.nextUrl.origin}/r/${data[0].short_code}`,
  });
}
