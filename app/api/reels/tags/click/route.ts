import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

// Click real en una etiqueta de producto/oferta dentro de un reel --
// cualquier persona viendo el reel puede tocarla, con o sin sesión, así
// que usa el cliente de servicio (como /api/track y /api/visit) en vez de
// RLS de usuario. Solo incrementa un contador; nunca cambia otra cosa.
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 60, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { tag_id } = await request.json().catch(() => ({}));
  if (typeof tag_id !== "string") return NextResponse.json({ error: "tag_id requerido" }, { status: 400 });

  const sb = supabaseCron();
  const { error } = await sb.rpc("increment_reel_tag_click", { p_tag_id: tag_id });
  if (error) return NextResponse.json({ ok: true, counted: false });
  return NextResponse.json({ ok: true, counted: true });
}
