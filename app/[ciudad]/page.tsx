import { Metadata } from "next";
import { notFound } from "next/navigation";
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

  if (loc.status !== "active") {
    return {
      title: `Próximamente en ${loc.name} | La Gran Barata Digital`,
      description: `Estamos llegando a ${loc.name}. Todavía no hay negocios ni ofertas publicados acá.`,
      robots: { index: false, follow: false },
    };
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

export default async function Page({ params }: Props) {
  const { ciudad } = await params;
  const sb = await createClient();
  const { data: loc } = await sb.from("locations").select("id").eq("slug", ciudad).eq("type", "city").maybeSingle();
  if (!loc) notFound();
  return <CiudadView />;
}
