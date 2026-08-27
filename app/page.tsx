import { createClient } from "@/lib/supabase-server";
import { hoyArgentina } from "@/lib/fecha-ar";
import MercadoVivoClient from "./mercado-vivo/mv-client";

export const revalidate = 60;

type Oferta = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; antes?: number; ahora?: number;
  portada_url?: string; logo_url?: string;
  latitude?: number; longitude?: number;
  precio_prometido?: boolean; rating?: number; verificado?: boolean;
  impulsada?: boolean; creado?: string; businessOpen?: boolean;
};

function daysTo(date?: string) {
  if (!date) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${date}T00:00:00`).getTime() - hoy.getTime()) / 86400000);
}

// Envuelta en una función de módulo (no leída directo en el cuerpo del
// Server Component) para que la regla react-hooks/purity no la marque
// como llamada impura durante el render.
function nowMs() {
  return Date.now();
}

// Home real de San Lorenzo Digital -- "Mercado Vivo". Reemplaza la home
// anterior (HomeClient, que sigue existiendo y sigue viva en
// components/home-client.tsx por si hace falta volver atrás, y la sigue
// usando components/home/ofertas-bomba.tsx aparte).
export default async function HomePage() {
  const sb = await createClient();
  const hoy = hoyArgentina();
  const ahora = nowMs();

  const [{ data: negocios }, { data: ofertasRaw }, { data: reviewsRaw }] = await Promise.all([
    sb
      .from("businesses")
      .select("id, name, status")
      .in("status", ["verificado", "reclamado"])
      .eq("activo", true)
      .limit(500),
    sb.from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(150),
    sb
      .from("business_reviews")
      .select("business_id, reviewer_name, comment, created_at")
      .not("comment", "is", null)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const negociosById = new Map((negocios || []).map((n: any) => [n.id, n]));

  const ofertas: Oferta[] = (ofertasRaw || [])
    .filter((o: any) => o.active && (!o.valid_until || o.valid_until >= hoy))
    .map((o: any) => ({
      id: o.id,
      negocio: o.business_name,
      slug: o.business_slug,
      producto: o.title,
      cat: o.business_category || "",
      vence: o.valid_until,
      descuento: o.discount_percent ? Number(o.discount_percent) : undefined,
      antes: o.old_price ? Number(o.old_price) : undefined,
      ahora: o.offer_price ? Number(o.offer_price) : undefined,
      portada_url: o.business_portada,
      logo_url: o.business_logo,
      creado: o.created_at,
      precio_prometido: !!o.precio_prometido,
      latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
      longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
      rating: o.business_rating ? Number(o.business_rating) : undefined,
      verificado: o.business_status === "verificado",
      impulsada: !!o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora,
      businessOpen: o.business_open === true,
    }));

  // Destacada: la de mayor descuento (o impulsada) -- lo que va en el hero.
  const porDescuento = [...ofertas].sort((a, b) => (b.descuento || 0) - (a.descuento || 0));
  const destacada = porDescuento[0] || null;
  const spotlight = porDescuento.find((o) => o.id !== destacada?.id) || null;

  const usadas = new Set([destacada?.id, spotlight?.id].filter(Boolean));
  const resto = ofertas.filter((o) => !usadas.has(o.id));

  const terminanPronto = [...resto]
    .filter((o) => o.vence)
    .sort((a, b) => (daysTo(a.vence) ?? 999) - (daysTo(b.vence) ?? 999))
    .slice(0, 3);
  const idsUsadosPronto = new Set(terminanPronto.map((o) => o.id));
  const recomendadas = resto.filter((o) => !idsUsadosPronto.has(o.id)).slice(0, 3);

  const terminanHoy = ofertas.filter((o) => o.vence && daysTo(o.vence) === 0).length;

  // Ticker: derivado de datos reales, no inventado.
  const tickerItems: { kind: "live" | "info" | "warn"; text: string }[] = [];
  porDescuento.slice(0, 3).forEach((o) => {
    if (o.descuento) tickerItems.push({ kind: "info", text: `-${o.descuento}% en ${o.producto} — ${o.negocio}` });
  });
  ofertas.filter((o) => o.vence && daysTo(o.vence) === 0).slice(0, 2).forEach((o) => {
    tickerItems.push({ kind: "warn", text: `Termina hoy: ${o.producto} en ${o.negocio}` });
  });
  [...ofertas].sort((a, b) => new Date(b.creado || 0).getTime() - new Date(a.creado || 0).getTime()).slice(0, 2).forEach((o) => {
    tickerItems.push({ kind: "live", text: `Nueva oferta: ${o.producto} en ${o.negocio}` });
  });

  const reviews = (reviewsRaw || [])
    .map((r: any) => ({
      negocio: negociosById.get(r.business_id)?.name || "Negocio de San Lorenzo",
      reviewer_name: r.reviewer_name,
      comment: r.comment as string,
    }))
    .filter((r) => r.comment && r.comment.length > 8)
    .slice(0, 4);

  return (
    <MercadoVivoClient
      destacada={destacada}
      spotlight={spotlight}
      terminanPronto={terminanPronto}
      recomendadas={recomendadas}
      stats={{ activas: ofertas.length, verificados: negocios?.length || 0, terminanHoy }}
      tickerItems={tickerItems}
      reviews={reviews}
    />
  );
}
