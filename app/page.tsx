import { createClient } from "@/lib/supabase-server";
import HomeClient from "@/components/home-client";

export const revalidate = 60;

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("businesses")
    .select("id, name, slug, category, description, tags, items, latitude, longitude, address, whatsapp, instagram, portada_url, logo_url, plan, status, open, promotions, destacado, rating, reviews, favorites_count")
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .limit(200);
  return <HomeClient initial={data || []} />;
}
