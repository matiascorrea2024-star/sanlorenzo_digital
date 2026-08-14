import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import BarrioView from "./client";

type Props = { params: Promise<{ ciudad: string; barrio: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ciudad, barrio } = await params;
  const sb = await createClient();
  const { data: city } = await sb.from("locations").select("*").eq("slug", ciudad).eq("type", "city").maybeSingle();
  const { data: neigh } = await sb.from("locations").select("*").eq("slug", barrio).eq("type", "neighborhood").maybeSingle();

  if (!city || !neigh) {
    return { title: "Barrio no encontrado | La Gran Barata Digital" };
  }

  const title = `${neigh.name} — Negocios en ${neigh.name}, ${city.name}`;
  const description = `Negocios, ofertas y servicios en ${neigh.name}, ${city.name}.`;

  return {
    title,
    description,
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/${ciudad}/${barrio}` },
  };
}

export default function Page() {
  return <BarrioView />;
}
