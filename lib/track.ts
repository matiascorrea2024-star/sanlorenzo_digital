import { supabase } from "./supabase";

export async function track(businessId: string, type: "view" | "whatsapp" | "share") {
  try {
    await supabase()
      .from("metrics")
      .insert({ business_id: businessId, type });
  } catch {}
}
