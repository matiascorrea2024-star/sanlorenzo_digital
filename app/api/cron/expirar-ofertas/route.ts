import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";

// Baja active=false en las ofertas cuya fecha de vencimiento ya pasó.
// Sin esto, "active" quedaba en true para siempre y solo el filtro por
// valid_until en cada pantalla ocultaba la oferta -- el dato de fondo
// (dashboard del comercio, admin, conteos, SDL Score) seguía contándola
// como activa aunque hubiera vencido hace semanas.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const sb = supabaseCron();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: vencidas, error: selError } = await sb.from("offers")
    .select("id, title, business_id, valid_until")
    .eq("active", true)
    .not("valid_until", "is", null)
    .lt("valid_until", hoy);

  if (selError) return NextResponse.json({ error: selError.message }, { status: 500 });

  if (!dry && vencidas && vencidas.length > 0) {
    const ids = vencidas.map((o) => o.id);
    const { error: updError } = await sb.from("offers")
      .update({ active: false })
      .in("id", ids);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, dry, desactivadas: vencidas?.length || 0, ofertas: vencidas?.map((o) => o.title) || [] });
}
