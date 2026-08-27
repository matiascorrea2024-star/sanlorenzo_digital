import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { AD_PLACEMENTS } from "@/lib/ads-plans";

// Sirve UNA campaña activa para un placement dado -- pensado para
// llamarse desde un <AdSlot> público, con o sin sesión. Nunca devuelve
// datos internos (budget/payment/admin_notes), solo lo necesario para
// pintar la tarjeta y navegar al hacer click.
//
// location_id es opcional: hoy SLD opera en una sola ciudad activa, así
// que en la práctica casi todas las campañas nacen sin targeting de
// ciudad (visibles en todos lados). El filtro queda funcionando de una
// cuando exista más de una ciudad activa y algún placement empiece a
// mandar su location_id real.
export async function GET(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 120, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") || "";
  const locationId = searchParams.get("location_id");

  if (!Object.keys(AD_PLACEMENTS).includes(placement)) {
    return NextResponse.json({ error: "Placement inválido" }, { status: 400 });
  }

  const sb = await createClient();
  const nowIso = new Date().toISOString();

  let query = sb.from("ad_campaigns")
    .select("id, business_id, name, creative_url, creative_type, cta_label, target_ref, businesses(name, slug)")
    .eq("active", true)
    .eq("placement", placement)
    .lte("starts_at", nowIso)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .limit(20);

  // Elegible si no tiene ciudad asignada (nacional) o coincide con la
  // ciudad pedida -- nunca al revés (una campaña con ciudad no se muestra
  // si no se pasa location_id, para no filtrar fuera de su segmento).
  query = locationId
    ? query.or(`targeting->>location_id.is.null,targeting->>location_id.eq.${locationId}`)
    : query.filter("targeting->>location_id", "is", null);

  const { data: candidatas } = await query;
  if (!candidatas || candidatas.length === 0) {
    return NextResponse.json({ ad: null });
  }

  const elegida = candidatas[Math.floor(Math.random() * candidatas.length)] as unknown as {
    id: string;
    creative_url: string;
    creative_type: string;
    cta_label: string;
    target_ref: { url?: string } | null;
    name: string;
    businesses: { name: string; slug: string } | null;
  };
  const negocio = elegida.businesses;

  return NextResponse.json({
    ad: {
      campaign_id: elegida.id,
      business_name: negocio?.name || elegida.name,
      creative_url: elegida.creative_url,
      creative_type: elegida.creative_type,
      cta_label: elegida.cta_label,
      target_url: elegida.target_ref?.url || (negocio?.slug ? `/negocio/${negocio.slug}` : "/"),
    },
  });
}
