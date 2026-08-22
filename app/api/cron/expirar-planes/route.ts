import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";
import { aplicarLimiteCatalogo } from "@/lib/catalogo-limite";

// Baja a "gratis" los negocios cuyo plan pago venció (plan_expira < ahora).
// Sin esto, un "Destacado Semanal" de 7 días o una campaña temporal se
// quedaban con el plan pago y el badge de destacado para siempre, porque
// nada revisaba esa fecha después de otorgarla.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const dry = request.nextUrl.searchParams.get("dry") === "1";
  const sb = supabaseCron();
  const ahora = new Date().toISOString();

  const { data: vencidos, error: selError } = await sb.from("businesses")
    .select("id, name, plan, plan_expira")
    .not("plan_expira", "is", null)
    .lt("plan_expira", ahora)
    .neq("plan", "gratis");

  if (selError) return NextResponse.json({ error: selError.message }, { status: 500 });

  if (!dry && vencidos && vencidos.length > 0) {
    const ids = vencidos.map((b) => b.id);
    const { error: updError } = await sb.from("businesses")
      .update({ plan: "gratis", destacado: false, plan_expira: null })
      .in("id", ids);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

    // El catálogo nunca se borra -- pero al bajar a "gratis" el excedente
    // sobre el nuevo límite se oculta del público (ver lib/catalogo-limite).
    for (const b of vencidos) {
      await aplicarLimiteCatalogo(sb, b.id, "gratis");
    }
  }

  return NextResponse.json({ ok: true, dry, bajados: vencidos?.length || 0, negocios: vencidos?.map((b) => b.name) || [] });
}
