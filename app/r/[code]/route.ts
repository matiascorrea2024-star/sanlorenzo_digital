import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkRateLimit, getRateLimitHeader } from "@/lib/rate-limit";

type Props = { params: Promise<{ code: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  const limit = checkRateLimit(getRateLimitHeader(request), 30, 60);
  if (!limit.ok) return new NextResponse("Demasiadas solicitudes", { status: 429 });

  const { code } = await params;
  if (!/^[a-zA-Z0-9_-]{6,32}$/.test(code)) return new NextResponse("Link inválido", { status: 400 });

  const sb = await createClient();
  const { data, error } = await sb.rpc("resolve_tracked_link", { p_code: code });
  const path = data?.[0]?.target_path;
  if (error || typeof path !== "string" || !/^\/(negocio|oferta)\/[a-zA-Z0-9_-]+\?src=[a-zA-Z0-9_-]{6,32}$/.test(path)) {
    return new NextResponse("Link no disponible", { status: 404 });
  }
  return NextResponse.redirect(new URL(path, request.url), 302);
}
