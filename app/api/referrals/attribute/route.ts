import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 10, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const referrerId = typeof body.referrer_id === "string" ? body.referrer_id : "";
  if (!UUID.test(referrerId) || referrerId === user.id) {
    return NextResponse.json({ error: "Código de invitación inválido" }, { status: 400 });
  }

  const { data: referrer } = await sb.from("user_profiles").select("user_id").eq("user_id", referrerId).maybeSingle();
  if (!referrer) return NextResponse.json({ error: "Invitación no disponible" }, { status: 400 });

  const { error: insertError } = await sb.from("referrals").insert({
    referrer_id: referrerId,
    referred_id: user.id,
    source: "invite",
    source_code: referrerId,
  });
  if (insertError && !insertError.message.toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: "No se pudo registrar la invitación" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
