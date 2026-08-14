import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import CiudadView from "./client";

type Props = { params: Promise<{ ciudad: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad } = await params;
  const sb = await createClient();
  const { data: loc } = await sb.from("locations")
    .select("*, parent:locations!locations_parent_id_fkey(name)")
    .eq("slug", ciudad)
    .eq("type", "city")
    .maybeSingle();

  if (!loc) {
    return { title: "Ciudad no encontrada | La Gran Barata Digital" };
  }

  const title = `${loc.name} — Negocios y ofertas en ${loc.name}`;
  const description = `Descubrí negocios, ofertas y servicios en ${loc.name}. Encontrá lo que necesitás cerca tuyo.`;

  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "es_AR" },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/${ciudad}` },
  };
}

export default function Page() {
  return <CiudadView />;
}
