import { NextRequest, NextResponse } from "next/server";
import { Preference } from "mercadopago";
import { requireUser } from "@/lib/api-auth";
import { mercadoPagoConfig } from "@/lib/mercadopago";
import { PLANES } from "@/lib/plans";
import { getRateLimitHeader, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const SITE = "https://sanlorenzodigital.vercel.app";

// Crea una preferencia de Checkout Pro para que un comerciante pague un
// plan directo desde /dashboard/planes, en vez de transferir y esperar
// que un admin revise el comprobante a mano.
export async function POST(request: NextRequest) {
  // Rate limiting: máx 3 intentos por minuto
  const ip = getRateLimitHeader(request);
  const { ok, retryAfter } = checkRateLimit(ip, 3, 60);
  if (!ok) return rateLimitResponse(retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const config = mercadoPagoConfig();
  if (!config) return NextResponse.json({ error: "El pago con Mercado Pago todavía no está disponible. Usá la transferencia por ahora." }, { status: 503 });

  const { businessId, plan } = await request.json();
  if (!businessId || !plan) return NextResponse.json({ error: "businessId y plan son requeridos" }, { status: 400 });

  const planInfo = PLANES[plan];
  if (!planInfo || !planInfo.precioARS) return NextResponse.json({ error: "Ese plan no está disponible para pago online." }, { status: 400 });

  // Re-verificar dueño server-side -- no confiar en el businessId que
  // mande el cliente, aunque RLS ya lo bloquee, para dar un mensaje claro.
  const { data: negocio } = await sb.from("businesses").select("id, owner_id, name").eq("id", businessId).maybeSingle();
  if (!negocio || negocio.owner_id !== user.id) {
    return NextResponse.json({ error: "No sos el dueño de este negocio" }, { status: 403 });
  }

  const { data: sub, error: subErr } = await sb.from("subscriptions")
    .insert({ business_id: businessId, plan, status: "pending_mp" })
    .select().single();
  if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 });

  try {
    const preference = new Preference(config);
    const result = await preference.create({
      body: {
        items: [{
          id: plan,
          title: `${planInfo.name} -- ${negocio.name}`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: planInfo.precioARS,
        }],
        external_reference: sub.id,
        notification_url: `${SITE}/api/mercadopago/webhook?secret=${process.env.MP_WEBHOOK_SECRET}`,
        back_urls: {
          success: `${SITE}/dashboard/planes?pago=exito`,
          failure: `${SITE}/dashboard/planes?pago=error`,
          pending: `${SITE}/dashboard/planes?pago=pendiente`,
        },
        auto_return: "approved",
      },
    });
    return NextResponse.json({ init_point: result.init_point });
  } catch (e) {
    // La preferencia no se pudo crear -- no dejamos la solicitud "pending_mp"
    // huérfana en la tabla, se hubiera visto como un pago fantasma sin final.
    await sb.from("subscriptions").delete().eq("id", sub.id);
    return NextResponse.json({ error: e instanceof Error ? e.message : "No se pudo iniciar el pago" }, { status: 500 });
  }
}
