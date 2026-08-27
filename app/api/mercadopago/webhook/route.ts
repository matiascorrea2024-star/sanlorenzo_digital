import { NextRequest, NextResponse } from "next/server";
import { Payment } from "mercadopago";
import { mercadoPagoConfig } from "@/lib/mercadopago";
import { supabaseCron } from "@/lib/supabase-cron";
import { PLANES } from "@/lib/plans";
import { aplicarLimiteCatalogo } from "@/lib/catalogo-limite";
import { resend } from "@/lib/resend";

// Webhook de Mercado Pago -- sin sesión de usuario detrás (lo llama el
// propio Mercado Pago), protegido por un secreto propio en la query string
// (mismo criterio ya usado en /api/push/send: extensión puntual y acotada
// de la excepción de service role para rutas de sistema sin usuario).
// Nunca se confía en el body del webhook para decidir nada -- siempre se
// vuelve a pedir el pago real a la API de Mercado Pago con nuestro propio
// access token antes de activar un plan.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (!webhookSecret || request.nextUrl.searchParams.get("secret") !== webhookSecret) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const config = mercadoPagoConfig();
  if (!config) return NextResponse.json({ error: "Mercado Pago no configurado" }, { status: 503 });

  let body: { type?: string; data?: { id?: string | number } };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const paymentId = body?.data?.id;
  if (!paymentId || body?.type !== "payment") return NextResponse.json({ ok: true });

  let payment;
  try {
    payment = await new Payment(config).get({ id: paymentId });
  } catch {
    return NextResponse.json({ error: "No se pudo verificar el pago" }, { status: 502 });
  }
  const externalReference = payment.external_reference;
  if (!externalReference) return NextResponse.json({ ok: true });

  const sb = supabaseCron();

  // Campaña de La Gran Barata Ads: external_reference viene con el
  // prefijo "ad:" (ver /api/ads/checkout) para no confundirla nunca con
  // un id de subscriptions -- ramifica antes de tocar nada de planes.
  if (externalReference.startsWith("ad:")) {
    const campaignId = externalReference.slice(3);
    const { data: campana } = await sb.from("ad_campaigns")
      .select("id, business_id, name, budget_cents, status").eq("id", campaignId).maybeSingle();
    if (!campana || campana.status !== "pending_payment") return NextResponse.json({ ok: true });

    if (payment.status === "approved") {
      if (payment.currency_id !== "ARS" || Number(payment.transaction_amount) !== campana.budget_cents / 100) {
        return NextResponse.json({ error: "Importe del pago no coincide con la campaña" }, { status: 422 });
      }
      await sb.from("ad_campaigns").update({
        status: "pending_review",
        payment_ref: String(paymentId),
      }).eq("id", campaignId).eq("status", "pending_payment");
      await sb.from("analytics_events").insert({
        business_id: campana.business_id,
        event_name: "ad_payment_confirmed",
        event_type: "ad_payment_confirmed",
        metadata: { campaign_id: campaignId, amount_ars: Number(payment.transaction_amount), provider: "mercadopago" },
      });
    }
    // Pago rechazado/cancelado: la campaña queda en pending_payment tal
    // cual -- el comercio puede reintentar el pago desde su panel, no
    // hace falta crear una campaña nueva por cada intento fallido.
    return NextResponse.json({ ok: true });
  }

  const subscriptionId = externalReference;
  const { data: sub } = await sb.from("subscriptions").select("*").eq("id", subscriptionId).maybeSingle();
  if (!sub) return NextResponse.json({ ok: true });

  if (payment.status === "approved" && sub.status !== "active") {
    const planInfo = PLANES[sub.plan];
    if (!planInfo) {
      await sb.from("subscriptions").update({
        status: "rechazado",
        payment_ref: String(paymentId),
      }).eq("id", subscriptionId);
      return NextResponse.json({ error: "Plan de suscripción inválido" }, { status: 422 });
    }
    if (payment.currency_id !== "ARS" || Number(payment.transaction_amount) !== Number(planInfo.precioARS)) {
      await sb.from("subscriptions").update({
        status: "rechazado",
        payment_ref: String(paymentId),
      }).eq("id", subscriptionId).eq("status", "pending");
      return NextResponse.json({ error: "Importe del pago no coincide con el plan" }, { status: 422 });
    }

    const dias = planInfo.duracionDias || 30;
    const expira = new Date(Date.now() + dias * 86400000).toISOString();
    
    // Actualizar suscripción
    const { data: activatedSubscription, error: subscriptionError } = await sb.from("subscriptions").update({
      status: "active",
      payment_ref: String(paymentId),
      started_at: new Date().toISOString(),
      expires_at: expira,
    }).eq("id", subscriptionId).eq("status", "pending").select("id").maybeSingle();
    if (subscriptionError) {
      return NextResponse.json({ error: "No se pudo activar la suscripción" }, { status: 500 });
    }
    if (!activatedSubscription) return NextResponse.json({ ok: true });
    
    // Actualizar negocio con nuevo plan
    const { error: businessError } = await sb.from("businesses").update({
      plan: sub.plan,
      plan_expira: expira,
      destacado: sub.plan === "premium",
    }).eq("id", sub.business_id);
    if (businessError) {
      return NextResponse.json({ error: "No se pudo actualizar el negocio" }, { status: 500 });
    }
    
    // Aplicar límites de catálogo si es necesario
    await aplicarLimiteCatalogo(sb, sub.business_id, sub.plan);
    await sb.from("analytics_events").insert({
      business_id: sub.business_id,
      event_name: "payment_confirmed",
      event_type: "payment_confirmed",
      metadata: {
        plan: sub.plan,
        amount_ars: Number(payment.transaction_amount),
        provider: "mercadopago",
        payment_id: String(paymentId),
      },
    });
    
    // Obtener datos de negocio y owner para email
    const { data: negocio } = await sb.from("businesses").select("id, name, owner_id").eq("id", sub.business_id).maybeSingle();
    if (negocio?.owner_id) {
      const { data: ownerData } = await sb.auth.admin.getUserById(negocio.owner_id);
      if (ownerData.user?.email) {
        try {
          await resend().emails.send({
            from: "San Lorenzo Digital <noreply@sanlorenzodigital.vercel.app>",
            to: ownerData.user.email,
            subject: `¡Éxito! Tu plan ${planInfo?.name || "Premium"} está activo`,
            html: `<h2>¡Bienvenido a ${planInfo.name}!</h2>
                   <p>Tu negocio ya está en el plan ${planInfo.name}.</p>
                   <p>Válido hasta el: <strong>${new Date(expira).toLocaleDateString("es-AR")}</strong></p>
                   <a href="https://sanlorenzodigital.vercel.app/dashboard/mis-negocios">Ver mis negocios</a>`,
          });
        } catch (e) {
          console.log("Email error (no crítico):", e);
        }
      }
    }
  } else if (payment.status === "rejected" || payment.status === "cancelled") {
    await sb.from("subscriptions").update({ 
      status: payment.status === "rejected" ? "rechazado" : "cancelled",
      payment_ref: String(paymentId) 
    }).eq("id", subscriptionId).eq("status", "pending");
  }

  return NextResponse.json({ ok: true });
}
