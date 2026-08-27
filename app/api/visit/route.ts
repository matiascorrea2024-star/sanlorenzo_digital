import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(req), 120, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconocida";
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  let path = "";
  try {
    path = ((await req.json()) as any).path || "";
  } catch {}

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await sb.from("visits").insert({ ip, ua, path });
  return NextResponse.json({ ok: true });
}
