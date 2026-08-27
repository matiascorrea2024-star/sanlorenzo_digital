import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";

// Ciclo de vida automático de La Gran Barata Ads, mismo patrón que
// expirar-ofertas/expirar-planes: activa las campañas aprobadas
// ("scheduled") cuya fecha de inicio ya llegó, y da de baja las que ya
// terminaron -- sin esto, "scheduled" se quedaría para siempre esperando
// que alguien la prenda a mano, y "active" nunca se apagaría sola.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const sb = supabaseCron();
  const ahora = new Date().toISOString();

  const { data: aActivar, error: selActivarError } = await sb.from("ad_campaigns")
    .select("id, name").eq("status", "scheduled").lte("starts_at", ahora);
  if (selActivarError) return NextResponse.json({ error: selActivarError.message }, { status: 500 });

  const { data: aCompletar, error: selCompletarError } = await sb.from("ad_campaigns")
    .select("id, name").eq("status", "active").not("ends_at", "is", null).lt("ends_at", ahora);
  if (selCompletarError) return NextResponse.json({ error: selCompletarError.message }, { status: 500 });

  if (!dry) {
    if (aActivar && aActivar.length > 0) {
      await sb.from("ad_campaigns").update({ status: "active", active: true })
        .in("id", aActivar.map((c) => c.id));
    }
    if (aCompletar && aCompletar.length > 0) {
      await sb.from("ad_campaigns").update({ status: "completed", active: false })
        .in("id", aCompletar.map((c) => c.id));
    }
  }

  return NextResponse.json({
    ok: true, dry,
    activadas: aActivar?.length || 0,
    completadas: aCompletar?.length || 0,
  });
}
