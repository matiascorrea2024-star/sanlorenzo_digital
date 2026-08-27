import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 10, 3600);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { business_id, offer_id, search_query, product_name, original_price } = await request.json();
    const searchTerm = typeof search_query === "string" ? search_query.trim().slice(0, 120) : "";

    if (!business_id && !offer_id && !searchTerm) {
      return NextResponse.json({ error: "business_id, offer_id o search_query requerido" }, { status: 400 });
    }

    // "Demanda invisible": alguien buscó algo que hoy no existe en el
    // catálogo (ej. "playstation 5", 0 resultados). Guardamos la señal
    // real -- ni inventamos un match ni corremos ningún algoritmo todavía,
    // eso queda para cuando haya volumen real de búsquedas para analizar.
    const esBusquedaSinResultado = !business_id && !offer_id && !!searchTerm;

    // Verificar si ya existe una alerta activa igual
    let query = supabase.from("user_alerts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (business_id) query = query.eq("business_id", business_id);
    if (offer_id) query = query.eq("offer_id", offer_id);
    if (esBusquedaSinResultado) query = query.ilike("search_query", searchTerm);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({
        message: esBusquedaSinResultado ? "Ya te anotamos para esta búsqueda" : "Ya tenés una alerta activa para esta oferta",
        alert: existing
      }, { status: 200 });
    }

    // Crear nueva alerta
    const { data: alert, error } = await supabase.from("user_alerts").insert({
      user_id: user.id,
      business_id: business_id || null,
      offer_id: offer_id || null,
      alert_type: esBusquedaSinResultado ? "search_demand" : "offer_back",
      search_query: esBusquedaSinResultado ? searchTerm : null,
      product_name: product_name || null,
      original_price: original_price || null,
      status: "active",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({
      message: esBusquedaSinResultado
        ? "¡Anotado! Si algún comercio publica algo así, te avisamos"
        : "¡Listo! Te vamos a avisar cuando vuelva esta oferta",
      alert
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint para cancelar alerta
export async function DELETE(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 20, 3600);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { alert_id } = await request.json();
    await supabase.from("user_alerts").update({ status: "dismissed" }).eq("id", alert_id).eq("user_id", user.id);
    return NextResponse.json({ message: "Alerta cancelada" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
