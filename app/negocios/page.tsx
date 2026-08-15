import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import NegociosClient from "@/components/negocios-client";

export const metadata: Metadata = {
  title: "Todos los negocios de San Lorenzo | La Gran Barata Digital",
  description: "Directorio completo de negocios de San Lorenzo: comercios, servicios, industria y más.",
  alternates: { canonical: "https://sanlorenzodigital.vercel.app/negocios" },
};

export default async function Page() {
  const sb = await createClient();
  const { data } = await sb
    .from("businesses")
    .select("id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios")
    .order("name")
    .limit(200);

  return <NegociosClient initial={data || []} />;
}
