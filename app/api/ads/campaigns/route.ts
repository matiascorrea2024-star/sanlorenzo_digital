import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { validarBody } from "@/lib/validate";
import { z } from "zod";
import { AD_PLACEMENTS, calcularPrecioCampana } from "@/lib/ads-plans";

// Crea el borrador de una campaña de La Gran Barata Ads. Todavía no cobra
// (eso es /api/ads/checkout) ni la deja visible (RLS de ad_campaigns solo
// sirve las que tienen active=true, y acá siempre nace en false) -- solo
// dejar la fila lista con el precio ya calculado server-side, nunca
// confiando en un precio que mande el cliente.
const schema = z.object({
  business_id: z.string().uuid(),
  placement: z.enum(Object.keys(AD_PLACEMENTS) as [string, ...string[]]),
  name: z.string().trim().min(3).max(120),
  creative_url: z.string().url(),
  cta_label: z.string().trim().min(2).max(30).default("Ver más"),
  target_url: z.string().trim().min(1).max(300),
  location_id: z.string().uuid().nullable().optional(),
  starts_at: z.string().datetime().or(z.string().date()),
  dias: z.number().int().min(1).max(60),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 10, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const parsed = validarBody(schema, await request.json().catch(() => ({})));
  if (parsed instanceof NextResponse) return parsed;
  const { business_id, placement, name, creative_url, cta_label, target_url, location_id, starts_at, dias } = parsed;

  const { data: negocio } = await sb.from("businesses").select("id, owner_id").eq("id", business_id).maybeSingle();
  if (!negocio || negocio.owner_id !== user.id) {
    return NextResponse.json({ error: "No sos el dueño de este negocio" }, { status: 403 });
  }

  const precioARS = calcularPrecioCampana(placement, dias);
  if (precioARS == null) {
    const p = AD_PLACEMENTS[placement];
    return NextResponse.json({ error: `La duración debe ser entre ${p.minDias} y ${p.maxDias} días para este placement` }, { status: 400 });
  }

  const inicio = new Date(starts_at);
  if (Number.isNaN(inicio.getTime()) || inicio.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: "La fecha de inicio no es válida" }, { status: 400 });
  }
  const fin = new Date(inicio.getTime() + dias * 24 * 60 * 60 * 1000);

  const { data: creada, error: insertError } = await sb.from("ad_campaigns").insert({
    business_id,
    name,
    placement,
    status: "pending_payment",
    active: false,
    creative_url,
    creative_type: "image",
    cta_label,
    target_ref: { url: target_url },
    targeting: location_id ? { location_id } : {},
    budget_cents: Math.round(precioARS * 100),
    starts_at: inicio.toISOString(),
    ends_at: fin.toISOString(),
  }).select("id, budget_cents").single();
  if (insertError) return NextResponse.json({ error: "No se pudo crear la campaña" }, { status: 500 });

  return NextResponse.json({ id: creada.id, precioARS }, { status: 201 });
}
