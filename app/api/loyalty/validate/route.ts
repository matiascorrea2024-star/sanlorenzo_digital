import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";
import { validarBody } from "@/lib/validate";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 60, 60);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const parsed = validarBody(
      z.object({ business_id: z.string().uuid(), code: z.string().min(1).max(20) }),
      await request.json().catch(() => ({}))
    );
    if (parsed instanceof NextResponse) return parsed;
    const { business_id, code } = parsed;

    const { data: business } = await supabase.from("businesses").select("owner_id").eq("id", business_id).single();
    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para dar sellos en este negocio" }, { status: 403 });
    }

    const { data: codigo } = await supabase.from("loyalty_codes")
      .select("*").eq("business_id", business_id).eq("code", code.toUpperCase().trim()).eq("used", false).maybeSingle();
    if (!codigo) return NextResponse.json({ error: "Código inválido o ya usado" }, { status: 404 });
    if (new Date(codigo.expires_at) < new Date()) {
      return NextResponse.json({ error: "Este código venció, pedile uno nuevo al cliente" }, { status: 400 });
    }

    const { data: programa } = await supabase.from("loyalty_programs")
      .select("*").eq("business_id", business_id).single();
    if (!programa) return NextResponse.json({ error: "Este negocio no tiene sellitos configurados" }, { status: 404 });

    const { error: errUpdateCode } = await supabase.from("loyalty_codes")
      .update({ used: true }).eq("id", codigo.id);
    if (errUpdateCode) throw errUpdateCode;

    const { error: errStamp } = await supabase.from("loyalty_stamps")
      .insert({ business_id, user_id: codigo.user_id });
    if (errStamp) throw errStamp;

    const { count } = await supabase.from("loyalty_stamps")
      .select("*", { count: "exact", head: true })
      .eq("business_id", business_id).eq("user_id", codigo.user_id).eq("redeemed", false);

    const progreso = count || 0;
    if (progreso >= programa.meta) {
      // Se completó la tarjeta: se marcan todos los sellos de este ciclo
      // como canjeados y arranca una tarjeta nueva de cero.
      await supabase.from("loyalty_stamps")
        .update({ redeemed: true })
        .eq("business_id", business_id).eq("user_id", codigo.user_id).eq("redeemed", false);
      return NextResponse.json({ ganado: true, premio: programa.premio, progreso, meta: programa.meta }, { status: 200 });
    }

    return NextResponse.json({ ganado: false, progreso, meta: programa.meta }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
