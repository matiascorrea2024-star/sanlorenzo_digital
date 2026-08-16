import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import MapaClient from "./client";

export const metadata: Metadata = {
  title: "Mapa de negocios de San Lorenzo | La Gran Barata Digital",
  description: "Descubrí negocios, ofertas y oportunidades de San Lorenzo, Santa Fe.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/mapa" },
};

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("businesses")
    .select("id, name, slug, category, rating, open, latitude, longitude, address, portada_url, whatsapp, plan, status")
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .not("latitude", "is", null)
    .limit(200);
  const initial = data || [];

  return <MapaClient initial={initial} />;
}
