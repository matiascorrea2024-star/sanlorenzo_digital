import { createClient } from "@/lib/supabase-server";
import HomeClient from "@/components/home-client";

export const revalidate = 60;

export default async function Page() {
  const sb = await createClient();
  // El ranking (business_leagues) ya no se muestra en la Home -- se
  // sacó esa consulta de acá, /ranking sigue calculando lo suyo aparte.
  const [{ data: negocios }, { data: ofertas }] = await Promise.all([
    sb
      .from("businesses")
      .select("id, name, slug, category, description, tags, items, latitude, longitude, address, whatsapp, instagram, portada_url, logo_url, plan, status, open, promotions, destacado, rating, reviews, favorites_count, type, hace_envios")
      .in("status", ["verificado", "reclamado"])
      .eq("activo", true)
      .order("destacado", { ascending: false })
      .limit(200),
    sb.from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  return <HomeClient initial={negocios || []} initialOfertas={ofertas || []} />;
}
