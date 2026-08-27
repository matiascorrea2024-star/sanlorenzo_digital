import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { validarBody } from "@/lib/validate";
import { z } from "zod";

// "¿Sos el dueño de este negocio?" -- business_claims ya tenía el schema
// completo (nombre, email, teléfono, método de prueba, estado, revisión)
// desde antes, pero 0 pantallas lo usaban y la tabla no tenía ni una
// política de RLS (nadie podía ni leerla ni escribirla). Esta ruta es la
// mitad "pública" del flujo; la revisión vive en /api/admin/business-claims.
const schema = z.object({
  business_id: z.string().uuid(),
  claimer_name: z.string().trim().min(2).max(120),
  claimer_email: z.string().trim().email().max(160),
  claimer_phone: z.string().trim().min(6).max(40),
  proof_method: z.string().trim().min(10).max(500),
});

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 5, 3600);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const { sb, user, error } = await requireUser();
  if (!user) return NextResponse.json({ error }, { status: 401 });

  const parsed = validarBody(schema, await request.json().catch(() => ({})));
  if (parsed instanceof NextResponse) return parsed;
  const { business_id, claimer_name, claimer_email, claimer_phone, proof_method } = parsed;

  const { data: negocio, error: negocioError } = await sb.from("businesses")
    .select("id, name, owner_id").eq("id", business_id).maybeSingle();
  if (negocioError || !negocio) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (negocio.owner_id) {
    return NextResponse.json({ error: "Este negocio ya tiene un dueño asignado" }, { status: 409 });
  }
  if (negocio.owner_id === user.id) {
    return NextResponse.json({ error: "Ya sos el dueño de este negocio" }, { status: 409 });
  }

  const { data: propia } = await sb.from("business_claims")
    .select("id, status").eq("business_id", business_id).eq("claimer_id", user.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (propia?.status === "pending") {
    return NextResponse.json({ error: "Ya tenés una solicitud en revisión para este negocio" }, { status: 409 });
  }

  const { error: insertError } = await sb.from("business_claims").insert({
    business_id,
    claimer_id: user.id,
    claimer_name,
    claimer_email,
    claimer_phone,
    proof_method,
    status: "pending",
  });
  if (insertError) {
    // El índice único parcial (un solo "pending" por negocio) puede
    // rechazar una carrera entre dos personas reclamando a la vez.
    if (insertError.message.toLowerCase().includes("duplicate") || insertError.code === "23505") {
      return NextResponse.json({ error: "Ya hay una solicitud en revisión para este negocio" }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo enviar la solicitud" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
