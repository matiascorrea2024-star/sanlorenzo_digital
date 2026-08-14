import { supabase } from "./supabase";

export async function postActivity(e: {
  type: string;
  businessId?: string;
  title: string;
  description?: string;
  link?: string;
  metadata?: any;
}) {
  try {
    await supabase().from("activity_feed").insert({
      type: e.type,
      business_id: e.businessId || null,
      title: e.title,
      description: e.description || null,
      link: e.link || null,
      metadata: e.metadata || {},
    });
  } catch (err) {
    console.error("Error registrando actividad:", err);
  }
}
