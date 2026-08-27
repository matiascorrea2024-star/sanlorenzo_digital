import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

function generarCodigo(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 10, 60);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { business_id } = await request.json();
    if (!business_id) return NextResponse.json({ error: "business_id requerido" }, { status: 400 });

    const { data: programa } = await supabase.from("loyalty_programs")
      .select("*").eq("business_id", business_id).eq("active", true).maybeSingle();
    if (!programa) return NextResponse.json({ error: "Este negocio no tiene sellitos activos" }, { status: 404 });

    // Un código nuevo por pedido, corto y de vida corta (10 min) -- se
    // muestra en pantalla y listo, el dueño lo tipea a mano en el local.
    const code = generarCodigo();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: creado, error } = await supabase.from("loyalty_codes")
      .insert({ business_id, user_id: user.id, code, expires_at })
      .select().single();
    if (error) throw error;

    return NextResponse.json({ code: creado.code, expires_at: creado.expires_at }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
