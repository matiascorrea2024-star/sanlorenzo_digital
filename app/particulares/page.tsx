import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import ParticularesClient from "@/components/particulares-client";

export const metadata: Metadata = {
  title: "Venta entre vecinos | La Gran Barata Digital",
  description: "Lo que venden los vecinos de San Lorenzo por su cuenta: cosas sueltas, sin local ni negocio.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/particulares" },
};

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("businesses")
    .select("id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios")
    .eq("type", "particular")
    .order("name")
    .limit(200);

  return <ParticularesClient initial={data || []} />;
}
