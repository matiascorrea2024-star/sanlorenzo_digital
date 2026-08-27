import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

// Registro fire-and-forget de una impresión real de un aviso ya servido
// por /api/ads/serve. Pública (con o sin sesión), como /api/track --
// usa el cliente de servicio porque no depende de RLS de usuario.
// cost_cents queda en su default (0): el modelo de cobro de La Gran
// Barata Ads es tarifa plana pagada por adelantado, no hay costo real
// por impresión individual para inventar acá.
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 120, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { campaign_id, placement } = await request.json().catch(() => ({}));
  if (typeof campaign_id !== "string") {
    return NextResponse.json({ error: "campaign_id requerido" }, { status: 400 });
  }

  const sb = supabaseCron();
  const { data: campana } = await sb.from("ad_campaigns").select("id").eq("id", campaign_id).eq("active", true).maybeSingle();
  if (!campana) return NextResponse.json({ ok: true, counted: false });

  const { error } = await sb.from("ad_impressions").insert({
    campaign_id,
    placement: typeof placement === "string" ? placement.slice(0, 40) : null,
  });
  return NextResponse.json({ ok: true, counted: !error });
}
