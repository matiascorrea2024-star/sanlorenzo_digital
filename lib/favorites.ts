import { supabase } from "./supabase";

export async function toggleFavorite(userId: string, itemType: "offer" | "business", itemId: string): Promise<boolean> {
  const sb = supabase();
  const { data: existing } = await sb.from("favorites").select("id")
    .eq("user_id", userId).eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
  
  if (existing) {
    await sb.from("favorites").delete().eq("id", existing.id);
    return false;
  } else {
    await sb.from("favorites").insert({ user_id: userId, item_type: itemType, item_id: itemId });
    return true;
  }
}

export async function getFavorites(userId: string): Promise<{ offers: string[]; businesses: string[] }> {
  const { data } = await supabase().from("favorites").select("*").eq("user_id", userId);
  const offers = (data || []).filter(f => f.item_type === "offer").map(f => f.item_id);
  const businesses = (data || []).filter(f => f.item_type === "business").map(f => f.item_id);
  return { offers, businesses };
}
