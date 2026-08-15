import { createClient } from "@/lib/supabase-server";
import HomeClient from "@/components/home-client";

export const revalidate = 60;

export default async function Page() {
  const sb = await createClient();
  const [{ data: negocios }, { data: ofertas }, { data: top }] = await Promise.all([
    sb
      .from("businesses")
      .select("id, name, slug, category, description, tags, items, latitude, longitude, address, whatsapp, instagram, portada_url, logo_url, plan, status, open, promotions, destacado, rating, reviews, favorites_count")
      .in("status", ["verificado", "reclamado"])
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .limit(200),
    sb.from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(100),
    sb.from("business_leagues").select("id, name, slug, category, logo_url, puntos")
      .eq("status", "verificado").order("puntos", { ascending: false }).limit(10),
  ]);
  const initialTop = (top || []).filter((b: any) => b.puntos > 0);
  return <HomeClient initial={negocios || []} initialOfertas={ofertas || []} initialTop={initialTop} />;
}
