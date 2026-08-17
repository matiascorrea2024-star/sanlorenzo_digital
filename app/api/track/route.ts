import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

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
            metadata: body.metadata || null,
            ip,
          })
        : Promise.resolve(),
    ]);
  } catch (e) {
    // silencioso: nunca rompe la navegación
  }
  return NextResponse.json({ ok: true });
}
