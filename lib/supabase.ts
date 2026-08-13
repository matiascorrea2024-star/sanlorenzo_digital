import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
export const supabase = (): SupabaseClient =>
  (_client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

export const createClient = supabase;

export type NewBusiness = {
  name: string;
  category: string;
  type: string;
  description: string;
  address: string;
  whatsapp?: string;
  instagram?: string;
  accent: string;
  schedule: string;
  first_item: string;
};

export async function createBusiness(data: NewBusiness, userId: string) {
  const sb = supabase();
  const baseSlug = data.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
  const { data: business, error } = await sb
    .from("businesses")
    .insert({
      owner_id: userId,
      name: data.name,
      slug: uniqueSlug,
      category: data.category,
      type: data.type,
      description: data.description,
      address: data.address,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      accent: data.accent,
      schedule: data.schedule,
      status: "reclamado",
      demo: false,
      open: true,
      items: data.first_item ? [{ name: data.first_item }] : [],
      tags: [],
      rating: 0,
      reviews: 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return business;
}
