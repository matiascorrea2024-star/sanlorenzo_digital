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
    return NextResponse.json({ error: "No se pudo crear el link rastreable" }, { status: 400 });
  }

  return NextResponse.json({
    short_code: data[0].short_code,
    short_url: `${request.nextUrl.origin}/r/${data[0].short_code}`,
  });
}
