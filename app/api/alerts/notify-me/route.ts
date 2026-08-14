import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { business_id, offer_id, product_name, original_price } = await request.json();

    if (!business_id && !offer_id) {
      return NextResponse.json({ error: "business_id u offer_id requerido" }, { status: 400 });
    }

    // Verificar si ya existe una alerta activa igual
    let query = supabase.from("user_alerts")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (business_id) query = query.eq("business_id", business_id);
    if (offer_id) query = query.eq("offer_id", offer_id);

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({
        message: "Ya tenés una alerta activa para esta oferta",
        alert: existing
      }, { status: 200 });
    }

    // Crear nueva alerta
    const { data: alert, error } = await supabase.from("user_alerts").insert({
      user_id: user.id,
      business_id: business_id || null,
      offer_id: offer_id || null,
      alert_type: "offer_back",
      product_name: product_name || null,
      original_price: original_price || null,
      status: "active",
    }).select().single();

    if (error) throw error;

    return NextResponse.json({
      message: "¡Listo! Te vamos a avisar cuando vuelva esta oferta",
      alert
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Endpoint para cancelar alerta
export async function DELETE(request: NextRequest) {
  try {
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
