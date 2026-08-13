import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconocida";
  const ua = (req.headers.get("user-agent") || "").slice(0, 200);
  let path = "";
  try {
    path = ((await req.json()) as any).path || "";
  } catch {}

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await sb.from("visits").insert({ ip, ua, path });
  return NextResponse.json({ ok: true });
}
