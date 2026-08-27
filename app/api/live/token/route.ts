import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { crearTokenLive, livekitUrl } from "@/lib/livekit";
import { checkRateLimit, getRateLimitHeader, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(getRateLimitHeader(request), 10, 60);
  if (!limit.ok) return rateLimitResponse(limit.retryAfter);

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { live_stream_id } = await request.json();
  if (!live_stream_id) return NextResponse.json({ error: "live_stream_id requerido" }, { status: 400 });

  // El SELECT ya respeta RLS (stream_is_public OR dueño/admin) -- si esto
  // no encuentra nada, o el vivo no es público o no es tuyo.
  const { data: stream } = await sb.from("live_streams").select("*, businesses(owner_id)").eq("id", live_stream_id).maybeSingle();
  if (!stream) return NextResponse.json({ error: "Transmisión no encontrada" }, { status: 404 });
  if (stream.status === "cancelled") return NextResponse.json({ error: "Esta transmisión fue cancelada" }, { status: 409 });

  const { data: prof } = await sb.from("user_profiles").select("role, display_name").eq("user_id", user.id).maybeSingle();
  const esDueno = (stream as any).businesses?.owner_id === user.id;
  const esAdmin = prof?.role === "admin";
  const canPublish = esDueno || esAdmin;

  if (!canPublish && stream.status !== "live") {
    return NextResponse.json({ error: "Esta transmisión todavía no empezó" }, { status: 409 });
  }

  try {
    const token = await crearTokenLive({
      roomName: stream.room_name,
      identity: user.id,
      name: prof?.display_name || (user.email || "").split("@")[0] || "Vecino",
      canPublish,
    });
    return NextResponse.json({ token, url: livekitUrl(), canPublish });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "No se pudo generar el token de video" }, { status: 500 });
  }
}
