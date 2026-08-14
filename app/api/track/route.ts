import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const body = await req.json().catch(() => ({}));
    const sb = await createClient();
    await sb.from("page_views").insert({
      business_id: body.business_id || null,
      path: body.path || "/",
      ip,
    });
  } catch (e) {
    // silencioso: nunca rompe la navegación
  }
  return NextResponse.json({ ok: true });
}
