import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { planDe } from "@/lib/plans";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const limit = checkRateLimit(getRateLimitHeader(request), 10, 60);
    if (!limit.ok) return rateLimitResponse(limit.retryAfter);

    const supabase = await createClient();
    
    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { offer_id } = await request.json();

    if (!offer_id) {
      return NextResponse.json({ error: "offer_id requerido" }, { status: 400 });
    }

    // Verificar que la oferta existe y está activa
    const { data: offer } = await supabase
      .from("offers")
      .select("*")
      .eq("id", offer_id)
      .eq("active", true)
      .single();

    if (!offer) {
      return NextResponse.json({ error: "Oferta no encontrada o inactiva" }, { status: 404 });
    }

    // Los cupones con código son una herramienta de Plan PRO -- el negocio
    // dueño de la oferta tiene que tener el plan habilitado.
    const { data: business } = await supabase.from("businesses").select("plan").eq("id", offer.business_id).maybeSingle();
    if (!planDe(business).cupones) {
      return NextResponse.json({ error: "Este negocio no tiene cupones habilitados (es una herramienta de Plan PRO)." }, { status: 403 });
    }

    // Verificar si el usuario ya tiene un cupón para esta oferta
    const { data: existingCoupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("offer_id", offer_id)
      .eq("user_id", user.id)
      .in("status", ["generated", "redeemed"])
      .single();

    if (existingCoupon) {
      return NextResponse.json(
        { 
          error: "Ya tenés un cupón para esta oferta",
          coupon: existingCoupon 
        },
        { status: 200 }
      );
    }

    // Generar código único
    const code = `SLD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Insertar cupón
    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        business_id: offer.business_id,
        offer_id: offer_id,
        user_id: user.id,
        code: code,
        status: "generated",
        expires_at: offer.valid_until ? new Date(offer.valid_until).toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
