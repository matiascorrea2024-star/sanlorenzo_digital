import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const EVENT_TYPES = new Set([
  "view_business", "view_offer", "click_whatsapp", "click_map", "favorite",
  "follow", "search", "coupon_generated", "coupon_redeemed", "share_business",
  "share_offer", "checkout_started", "payment_confirmed", "tracked_link_click",
  "interest_offer",
]);

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const body = await req.json().catch(() => ({}));
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();

    // page_views: se mantiene para /admin (últimas visitas con IP).
    // analytics_events: lo que de verdad lee el dashboard del comerciante
    // (app/dashboard/analytics) -- antes este endpoint recibía event_type/
    // offer_id/product_id/metadata y los descartaba sin guardarlos en
    // ningún lado, por eso las estadísticas siempre mostraban 0.
    if (body.event_type && !EVENT_TYPES.has(body.event_type)) {
      return NextResponse.json({ error: "event_type inválido" }, { status: 400 });
    }
    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};
    await Promise.all([
      sb.from("page_views").insert({
        business_id: body.business_id || null,
        path: body.path || "/",
        ip,
      }),
      body.event_type
        ? sb.from("analytics_events").insert({
            event_type: body.event_type,
            event_name: body.event_type,
            business_id: body.business_id || null,
            offer_id: body.offer_id || null,
            product_id: body.product_id || null,
            user_id: user?.id || null,
            path: body.path || null,
            metadata,
            source: typeof body.source === "string" ? body.source.slice(0, 40) : null,
            source_code: typeof body.source_code === "string" ? body.source_code.slice(0, 40) : null,
            ip,
          })
        : Promise.resolve(),
    ]);
  } catch {
    // silencioso: nunca rompe la navegación
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const offerId = req.nextUrl.searchParams.get("offer_id");
  if (!offerId) return NextResponse.json({ count: null });
  try {
    const sb = await createClient();
    // count "exact" con head:true = solo el número, sin traer filas.
    // Si RLS bloquea o la tabla no existe, Supabase devuelve count null
    // (o lanza) -- en ambos casos el front recibe { count: null } y no
    // muestra ningún número.
    const { count, error } = await sb
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "interest_offer")
      .eq("offer_id", offerId);
    if (error) return NextResponse.json({ count: null });
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: null });
  }
}
