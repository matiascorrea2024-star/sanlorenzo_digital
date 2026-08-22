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
  if (request.nextUrl.searchParams.get("secret") !== process.env.MP_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const config = mercadoPagoConfig();
  if (!config) return NextResponse.json({ ok: true });

  const body = await request.json().catch(() => ({}));
  const paymentId = body?.data?.id;
  if (!paymentId || body?.type !== "payment") return NextResponse.json({ ok: true });

  const payment = await new Payment(config).get({ id: paymentId });
  const subscriptionId = payment.external_reference;
  if (!subscriptionId) return NextResponse.json({ ok: true });

  const sb = supabaseCron();
  const { data: sub } = await sb.from("subscriptions").select("*").eq("id", subscriptionId).maybeSingle();
  if (!sub) return NextResponse.json({ ok: true });

  if (payment.status === "approved" && sub.status !== "approved") {
    const planInfo = PLANES[sub.plan];
    const dias = planInfo?.duracionDias || 30;
    const expira = new Date(Date.now() + dias * 86400000).toISOString();
    
    // Actualizar suscripción
    await sb.from("subscriptions").update({
      status: "approved",
      payment_ref: String(paymentId),
      started_at: new Date().toISOString(),
      expires_at: expira,
    }).eq("id", subscriptionId);
    
    // Actualizar negocio con nuevo plan
    await sb.from("businesses").update({
      plan: sub.plan,
      plan_expira: expira,
      destacado: sub.plan === "premium",
    }).eq("id", sub.business_id);
    
    // Aplicar límites de catálogo si es necesario
    await aplicarLimiteCatalogo(sb, sub.business_id, sub.plan);
    
    // Obtener datos de negocio y owner para email
    const { data: negocio } = await sb.from("businesses").select("id, name, owner_id").eq("id", sub.business_id).maybeSingle();
    if (negocio?.owner_id) {
      const { data: { users: [owner] } } = await sb.auth.admin.listUsers();
      if (owner?.email) {
        try {
          await resend().emails.send({
            from: "San Lorenzo Digital <noreply@sanlorenzodigital.vercel.app>",
            to: owner.email,
            subject: `¡Éxito! Tu plan ${planInfo?.name || "Premium"} está activo`,
            html: `<h2>¡Bienvenido a ${planInfo?.name || "Premium"}!</h2>
                   <p>Tu negocio <strong>${negocio.name}</strong> ya está en el plan ${planInfo?.name || "Premium"}.</p>
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
      status: payment.status, 
      payment_ref: String(paymentId) 
    }).eq("id", subscriptionId);
  }

  return NextResponse.json({ ok: true });
}
