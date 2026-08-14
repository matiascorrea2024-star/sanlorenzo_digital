import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// Rate limiting simple en memoria (por IP)
const rateMap = new Map<string, number[]>();
const MAX_PER_MIN = 60;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const hits = (rateMap.get(ip) || []).filter(t => now - t < 60000);
  hits.push(now);
  rateMap.set(ip, hits);
  // Limpieza periódica
  if (rateMap.size > 1000) {
    for (const [key, val] of rateMap) {
      if (val.length === 0 || now - val[val.length - 1] > 120000) rateMap.delete(key);
    }
  }
  return hits.length <= MAX_PER_MIN;
}

const VALID_EVENTS = new Set([
  "search", "view_business", "view_offer", "click_whatsapp", "click_map",
  "favorite", "follow", "coupon_generated", "coupon_redeemed",
  "signup", "merchant_signup", "subscription_started", "search_intent",
]);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    if (!checkRate(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { event_type, business_id, offer_id, product_id, metadata } = body;

    // Validación server-side
    if (!event_type || typeof event_type !== "string") {
      return NextResponse.json({ error: "event_type required" }, { status: 400 });
    }
    if (!VALID_EVENTS.has(event_type)) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
    }
    if (business_id && typeof business_id !== "string") {
      return NextResponse.json({ error: "Invalid business_id" }, { status: 400 });
    }

    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();

    const { error } = await sb.from("analytics_events").insert({
      event_type,
      event_name: event_type,
      path: (metadata && typeof metadata === "object" && typeof metadata.path === "string") ? metadata.path : "/" + event_type,
      user_id: user?.id || null,
      business_id: business_id || null,
      offer_id: offer_id || null,
      product_id: product_id || null,
      metadata: metadata && typeof metadata === "object" ? metadata : {},
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
