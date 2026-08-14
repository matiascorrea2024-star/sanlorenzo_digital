import { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import NegocioPage from "./client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Negocio no encontrado | La Gran Barata Digital" };
  return {
    title: `${data.name} — ${data.category} en San Lorenzo`,
    description: data.description || `${data.name} en San Lorenzo, Santa Fe.`,
    openGraph: {
      title: `${data.name} — San Lorenzo`,
      description: data.description || "",
      type: "website",
      locale: "es_AR",
    },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/negocio/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: negocio } = await sb.from("businesses").select("*").eq("slug", slug).maybeSingle();
  const { data: ofertas } = await sb.from("offers")
    .select("*").eq("business_id", negocio?.id).eq("active", true).limit(20);
  const { data: productos } = await sb.from("products")
    .select("*").eq("business_id", negocio?.id).eq("active", true).limit(20);
  const { data: resenas } = await sb.from("business_reviews")
    .select("*").eq("business_id", negocio?.id).order("created_at", { ascending: false }).limit(10);

  return <NegocioPage initialNegocio={negocio} initialOfertas={ofertas || []} initialProductos={productos || []} initialResenas={resenas || []} />;
}
