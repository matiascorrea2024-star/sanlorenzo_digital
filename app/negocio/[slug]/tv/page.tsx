import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { hoyArgentina } from "@/lib/fecha-ar";
import TvEscaparate from "./client";

type Props = { params: Promise<{ slug: string }> };

// Mismo criterio que la ficha pública (app/negocio/[slug]/page.tsx):
// si la ficha no es visible, el escaparate tampoco existe.
function esPublico(b: { status?: string | null; activo?: boolean | null }) {
  return ["verificado", "reclamado"].includes(b.status || "") && b.activo !== false;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("businesses").select("name").eq("slug", slug).maybeSingle();
  return {
    title: data ? `Modo TV · ${data.name} | La Gran Barata` : "Modo TV | La Gran Barata",
    robots: { index: false, follow: false },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: negocio } = await sb.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!negocio || !esPublico(negocio)) notFound();
  const { data: ofertas } = await sb.from("offers")
    .select("*").eq("business_id", negocio.id).eq("active", true)
    .gte("valid_until", hoyArgentina())
    .order("created_at", { ascending: false }).limit(20);
  return <TvEscaparate negocio={negocio} ofertas={ofertas || []} />;
}
