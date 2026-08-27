import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { aplicarLimiteCatalogo } from "@/lib/catalogo-limite";

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 5, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { campaign_id, business_id } = await request.json();
  if (!campaign_id || !business_id) return NextResponse.json({ error: "campaign_id y business_id requeridos" }, { status: 400 });

  const { data: biz } = await sb.from("businesses").select("id, owner_id").eq("id", business_id).maybeSingle();
  if (!biz || biz.owner_id !== user.id) return NextResponse.json({ error: "Ese negocio no te pertenece" }, { status: 403 });

  const { data: camp } = await sb.from("campaigns").select("*").eq("id", campaign_id).maybeSingle();
  if (!camp) return NextResponse.json({ error: "Beneficio no encontrado" }, { status: 404 });
  if (!camp.active) return NextResponse.json({ error: "Este beneficio ya no está activo" }, { status: 409 });
  if (camp.ends_at && new Date(camp.ends_at) < new Date()) return NextResponse.json({ error: "Este beneficio ya venció" }, { status: 409 });

  const { count: yaLoTiene } = await sb.from("campaign_claims").select("id", { count: "exact", head: true })
    .eq("campaign_id", campaign_id).eq("business_id", business_id);
  if ((yaLoTiene || 0) > 0) return NextResponse.json({ error: "Ya reclamaste este beneficio con este negocio" }, { status: 409 });

  if (camp.max_cupos != null) {
    const { count } = await sb.from("campaign_claims").select("id", { count: "exact", head: true }).eq("campaign_id", campaign_id);
    if ((count || 0) >= camp.max_cupos) return NextResponse.json({ error: "Ya no quedan cupos para este beneficio" }, { status: 409 });
  }

  const { error: claimError } = await sb.from("campaign_claims").insert({ campaign_id, business_id });
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });

  const expira = new Date(Date.now() + camp.grants_dias * 24 * 60 * 60 * 1000).toISOString();
  const { error: bizError } = await sb.from("businesses")
    .update({ plan: camp.grants_plan, plan_expira: expira, destacado: camp.grants_plan === "premium" })
    .eq("id", business_id);
  if (bizError) return NextResponse.json({ error: bizError.message }, { status: 500 });

  await aplicarLimiteCatalogo(sb, business_id, camp.grants_plan);

  return NextResponse.json({ ok: true, expira });
}
