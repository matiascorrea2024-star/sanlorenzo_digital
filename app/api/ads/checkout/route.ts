import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { requireUser } from "@/lib/api-auth";
import { mercadoPagoConfig } from "@/lib/mercadopago";
import { getRateLimitHeader, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { AD_PLACEMENTS } from "@/lib/ads-plans";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sanlorenzodigital.vercel.app";

// Mismo patrón que /api/mercadopago/checkout (planes), pero para una
// campaña de ads en estado "pending_payment". El webhook (que ya existe)
// se extiende para reconocer este external_reference y activar la
// revisión en vez de un plan -- ver app/api/mercadopago/webhook.
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 5, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const config = mercadoPagoConfig();
  if (!config) return NextResponse.json({ error: "El pago con Mercado Pago todavía no está disponible." }, { status: 503 });
  if (!process.env.MP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "El cobro online está pendiente de configuración segura." }, { status: 503 });
  }

  const { campaignId } = await request.json().catch(() => ({}));
  if (!campaignId) return NextResponse.json({ error: "campaignId requerido" }, { status: 400 });

  const { data: campana } = await sb.from("ad_campaigns")
    .select("id, name, placement, status, budget_cents, businesses(owner_id, name)")
    .eq("id", campaignId).maybeSingle();
  const negocio = campana?.businesses as unknown as { owner_id: string; name: string } | null;
  if (!campana || !negocio || negocio.owner_id !== user.id) {
    return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
  }
  if (campana.status !== "pending_payment") {
    return NextResponse.json({ error: "Esta campaña ya fue pagada o ya no acepta pago" }, { status: 409 });
  }

  const placementInfo = AD_PLACEMENTS[campana.placement];
  const montoARS = campana.budget_cents / 100;

  try {
    const preference = new Preference(config);
    const result = await preference.create({
      body: {
        items: [{
          id: campana.id,
          title: `Publicidad "${campana.name}" -- ${placementInfo?.label || campana.placement}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: montoARS,
        }],
        external_reference: `ad:${campana.id}`,
        notification_url: `${SITE}/api/mercadopago/webhook?secret=${process.env.MP_WEBHOOK_SECRET}`,
        back_urls: {
          success: `${SITE}/dashboard/publicidad?pago=exito`,
          failure: `${SITE}/dashboard/publicidad?pago=error`,
          pending: `${SITE}/dashboard/publicidad?pago=pendiente`,
        },
        auto_return: "approved",
      },
    });
    return NextResponse.json({ init_point: result.init_point });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo iniciar el pago" }, { status: 500 });
  }
}
