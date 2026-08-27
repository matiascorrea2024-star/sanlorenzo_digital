import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

// Registro fire-and-forget de un click real sobre un aviso ya servido.
// Mismo criterio que /api/ads/impression: pública, cliente de servicio,
// cost_cents en su default 0 (tarifa plana, no auction real todavía).
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 60, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { campaign_id } = await request.json().catch(() => ({}));
  if (typeof campaign_id !== "string") {
    return NextResponse.json({ error: "campaign_id requerido" }, { status: 400 });
  }

  const sb = supabaseCron();
  const { data: campana } = await sb.from("ad_campaigns").select("id").eq("id", campaign_id).eq("active", true).maybeSingle();
  if (!campana) return NextResponse.json({ ok: true, counted: false });

  const { error } = await sb.from("ad_clicks").insert({ campaign_id });
  return NextResponse.json({ ok: true, counted: !error });
}
