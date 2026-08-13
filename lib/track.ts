import { supabase } from "./supabase";

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
