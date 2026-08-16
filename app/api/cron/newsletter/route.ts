import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseCron } from "@/lib/supabase-cron";

const SITE = "https://sanlorenzodigital.vercel.app";

function fmt(n: number) {
  return "$" + Number(n).toLocaleString("es-AR");
}

function armarHtml({ ofertas, negocios }: { ofertas: any[]; negocios: any[] }) {
  const filasOfertas = ofertas.slice(0, 6).map((o) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2015;">
        <a href="${SITE}/oferta/${o.id}" style="color:#f97316;font-weight:700;text-decoration:none;">${o.title}</a>
        <div style="color:#a99b86;font-size:13px;">${o.businesses?.name || ""}${o.discount_percent ? ` · -${o.discount_percent}%` : ""}${o.offer_price ? ` · ${fmt(o.offer_price)}` : ""}</div>
      </td>
    </tr>`).join("");

  const filasNegocios = negocios.slice(0, 6).map((b) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2015;">
        <a href="${SITE}/negocio/${b.slug}" style="color:#f97316;font-weight:700;text-decoration:none;">${b.name}</a>
        <div style="color:#a99b86;font-size:13px;text-transform:capitalize;">${b.category || ""}</div>
      </td>
    </tr>`).join("");

  return `
  <div style="background:#120d09;padding:24px 0;font-family:system-ui,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#1c150e;border-radius:16px;overflow:hidden;">
      <div style="padding:20px 24px;background:linear-gradient(135deg,#f97316,#ec4899);">
        <p style="margin:0;color:#fff;font-weight:900;font-size:18px;">La Gran Barata Digital</p>
        <p style="margin:4px 0 0;color:#fff;opacity:.9;font-size:13px;">Esta semana en San Lorenzo</p>
      </div>
      <div style="padding:24px;color:#f7f3ec;">
        ${ofertas.length > 0 ? `
        <p style="font-weight:900;font-size:15px;margin:0 0 8px;">🔥 Ofertas nuevas (${ofertas.length})</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${filasOfertas}</table>` : ""}
        ${negocios.length > 0 ? `
        <p style="font-weight:900;font-size:15px;margin:0 0 8px;">🏪 Negocios nuevos (${negocios.length})</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${filasNegocios}</table>` : ""}
        ${ofertas.length === 0 && negocios.length === 0 ? `<p style="color:#a99b86;">Esta semana no hubo novedades para mostrar todavía.</p>` : ""}
        <a href="${SITE}" style="display:inline-block;margin-top:8px;background:linear-gradient(135deg,#f97316,#ec4899);color:#fff;font-weight:900;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:14px;">Ver todo →</a>
      </div>
      <div style="padding:16px 24px;border-top:1px solid #2a2015;color:#7d6f5c;font-size:11px;">
        Recibís esto porque activaste "Novedades por mail" en tu perfil.
        <a href="${SITE}/perfil#cuenta" style="color:#7d6f5c;">Desactivar</a>
      </div>
    </div>
  </div>`;
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const sb = supabaseCron();
  const desde = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ data: ofertas }, { data: negocios }, { data: perfiles }] = await Promise.all([
    sb.from("offers").select("id, title, discount_percent, offer_price, businesses(name)")
      .eq("active", true).gte("created_at", desde).order("created_at", { ascending: false }).limit(20),
    sb.from("businesses").select("name, slug, category")
      .eq("status", "verificado").gte("created_at", desde).order("created_at", { ascending: false }).limit(20),
    sb.from("user_profiles").select("user_id").eq("newsletter_opt_in", true),
  ]);

  if (!ofertas?.length && !negocios?.length) {
    return NextResponse.json({ ok: true, skipped: "sin novedades esta semana, no se envió nada" });
  }

  const userIds = (perfiles || []).map((p) => p.user_id);
  if (userIds.length === 0) {
    return NextResponse.json({ ok: true, skipped: "nadie con newsletter_opt_in activo" });
  }

  const { data: emails } = await sb.from("user_emails").select("email").in("user_id", userIds);
  const destinatarios = (emails || []).map((e) => e.email).filter(Boolean);
  if (destinatarios.length === 0) {
    return NextResponse.json({ ok: true, skipped: "sin emails disponibles" });
  }

  const html = armarHtml({ ofertas: ofertas || [], negocios: negocios || [] });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.NEWSLETTER_FROM || "La Gran Barata Digital <onboarding@resend.dev>";

  const resultados = await Promise.allSettled(
    destinatarios.map((to) => resend.emails.send({ from, to, subject: "Esta semana en San Lorenzo 🔥", html }))
  );
  const enviados = resultados.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ ok: true, enviados, total: destinatarios.length });
}
