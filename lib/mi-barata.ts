"use client";
// Mi Barata: lista de compras del vecino con ofertas de varios negocios.
// Persistida en Supabase (user_lists + list_items, RLS propia del dueño):
// a diferencia del changuito (localStorage, checkout), esta lista sobrevive
// cambios de dispositivo y es la base del ahorro combinado.
import { supabase } from "@/lib/supabase";

const LIST_NAME = "Mi barata";

export type ItemBarata = {
  item_id: string;
  offer_id: string;
  added_at: string;
  title: string;
  offer_price: number | null;
  old_price: number | null;
  valid_until: string | null;
  active: boolean;
  image_url: string | null;
  negocio: string;
  slug: string;
  whatsapp: string | null;
};

async function getListId(userId: string): Promise<string | null> {
  const { data } = await supabase()
    .from("user_lists")
    .select("id")
    .eq("user_id", userId)
    .eq("name", LIST_NAME)
    .maybeSingle();
  return data?.id ?? null;
}

async function ensureList(userId: string): Promise<string> {
  const existing = await getListId(userId);
  if (existing) return existing;
  const { data, error } = await supabase()
    .from("user_lists")
    .insert({ user_id: userId, name: LIST_NAME })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

/** Suma una oferta a Mi Barata. Idempotente: ya estaba → no duplica. */
export async function sumarAMiBarata(userId: string, offerId: string): Promise<"agregada" | "ya-estaba" | "error"> {
  try {
    const listId = await ensureList(userId);
    const { data: existing } = await supabase()
      .from("list_items")
      .select("id")
      .eq("list_id", listId)
      .eq("offer_id", offerId)
      .maybeSingle();
    if (existing) return "ya-estaba";
    const { error } = await supabase()
      .from("list_items")
      .insert({ list_id: listId, offer_id: offerId });
    return error ? "error" : "agregada";
  } catch {
    return "error";
  }
}

export async function sacarDeMiBarata(itemId: string): Promise<boolean> {
  const { error } = await supabase().from("list_items").delete().eq("id", itemId);
  return !error;
}

/** Trae la barata con la oferta y su negocio embebidos. Los ítems cuya
 * oferta se borró desaparecen solos (FK on delete cascade). */
export async function getMiBarata(userId: string): Promise<ItemBarata[]> {
  const listId = await getListId(userId);
  if (!listId) return [];
  const { data } = await supabase()
    .from("list_items")
    .select(`
      id, offer_id, added_at,
      offers!inner(
        id, title, offer_price, old_price, valid_until, active, image_url,
        businesses(name, slug, whatsapp)
      )
    `)
    .eq("list_id", listId)
    .order("added_at", { ascending: true });
  return (data || []).map((row: any) => ({
    item_id: row.id,
    offer_id: row.offers.id,
    added_at: row.added_at,
    title: row.offers.title,
    offer_price: row.offers.offer_price ? Number(row.offers.offer_price) : null,
    old_price: row.offers.old_price ? Number(row.offers.old_price) : null,
    valid_until: row.offers.valid_until,
    active: row.offers.active === true,
    image_url: row.offers.image_url,
    negocio: row.offers.businesses?.name || "Negocio",
    slug: row.offers.businesses?.slug || "",
    whatsapp: row.offers.businesses?.whatsapp || null,
  }));
}
