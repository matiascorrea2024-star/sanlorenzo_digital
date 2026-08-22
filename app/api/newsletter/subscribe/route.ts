import { NextRequest, NextResponse } from "next/server";
import { supabaseCron } from "@/lib/supabase-cron";
import { getRateLimitHeader, checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // Rate limiting: máx 5 intentos por hora por IP
  const ip = getRateLimitHeader(request);
  const { ok, retryAfter } = checkRateLimit(ip, 5, 3600);
  if (!ok) return rateLimitResponse(retryAfter);

  try {
    const { email } = await request.json();

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    const sb = supabaseCron();

    // Verificar si ya existe
    const { data: existing } = await sb
      .from("newsletter_subscribers")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya estás suscrito" },
        { status: 409 }
      );
    }

    // Agregar a newsletter
    const { error } = await sb
      .from("newsletter_subscribers")
      .insert({
        email: email.toLowerCase(),
        subscribed_at: new Date().toISOString(),
        status: "active",
      });

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Error al suscribirse" },
      { status: 500 }
    );
  }
}
