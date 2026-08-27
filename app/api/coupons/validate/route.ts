import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "code requerido" }, { status: 400 });
    }

    // Buscar cupón
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .single();

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario sea el dueño del negocio
    const { data: business } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", coupon.business_id)
      .single();

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: "No autorizado para validar este cupón" }, { status: 403 });
    }

    // Verificar estado del cupón
    if (coupon.status === "redeemed") {
      return NextResponse.json({ error: "Este cupón ya fue canjeado" }, { status: 400 });
    }

    if (coupon.status === "expired") {
      return NextResponse.json({ error: "Este cupón está vencido" }, { status: 400 });
    }

    if (coupon.status === "cancelled") {
      return NextResponse.json({ error: "Este cupón fue cancelado" }, { status: 400 });
    }

    // Validar cupón
    const { data: updatedCoupon, error } = await supabase
      .from("coupons")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
      })
      .eq("id", coupon.id)
      .select()
      .single();

    if (error) throw error;

    // Completa el funnel de conversión: coupon_generated ya se loguea al
    // generar el cupón (components/offers/coupon-button.tsx), pero el canje
    // -- la parte que de verdad prueba una venta -- nunca se registraba en
    // analytics_events, así que no se podía armar el embudo completo.
    const { error: eventError } = await supabase.from("analytics_events").insert({
      event_type: "coupon_redeemed",
      event_name: "coupon_redeemed",
      business_id: coupon.business_id,
      offer_id: coupon.offer_id || null,
      user_id: user.id,
      metadata: { coupon_id: coupon.id },
    });
    if (eventError) console.error("No se pudo registrar el evento de canje:", eventError);

    return NextResponse.json({ 
      coupon: updatedCoupon,
      message: "Cupón validado exitosamente"
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
