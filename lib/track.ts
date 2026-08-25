import { supabase } from "./supabase";

// Evento para Google Analytics (GA4). Es no-op si GA no cargó -- por
// ejemplo cuando el usuario no aceptó cookies de métricas -- y nunca
// tira error: el flujo de compra no puede romperse por analítica.
export function gaEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { trackEvent?: (n: string, p?: Record<string, unknown>) => void };
  try {
    w.trackEvent?.(name, params);
  } catch {}
}

export async function track(businessId: string, type: "view" | "whatsapp" | "share") {
  const sb = supabase();
  try {
    await sb.from("metrics").insert({ business_id: businessId, type });
  } catch {}
  try {
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      await sb
        .from("user_activity")
        .insert({ business_id: businessId, type, user_id: user.id });
    }
  } catch {}
}
