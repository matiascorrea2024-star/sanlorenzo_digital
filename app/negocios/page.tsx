import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import NegociosClient, { NEGOCIOS_PAGE_SIZE } from "@/components/negocios-client";

export const metadata: Metadata = {
  title: "Todos los negocios de San Lorenzo | La Gran Barata Digital",
  description: "Directorio completo de negocios de San Lorenzo: comercios, servicios, industria y más.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/negocios" },
};

export default async function Page() {
  const sb = await createClient();
  // Antes: .limit(200) sin paginación real -- con más negocios que eso,
  // el resto quedaba invisible para siempre (ni el buscador ni el filtro
  // de categoría volvían a pedirle más a la base). Ahora la primera
  // página es solo el punto de partida; NegociosClient pide el resto
  // con "cargar más"/filtros reales contra Supabase.
  const [{ data, count }] = await Promise.all([
    sb
      .from("businesses")
      .select("id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios, destacado", { count: "exact" })
      .in("status", ["verificado", "reclamado"])
      .eq("activo", true)
      .or("type.is.null,type.in.(comercio,servicio,profesional)")
      .order("destacado", { ascending: false })
      .order("name")
      .range(0, NEGOCIOS_PAGE_SIZE - 1),
  ]);

  return <NegociosClient initial={data || []} initialTotal={count ?? (data || []).length} />;
}
