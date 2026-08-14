import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import OfertaPage from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sb = await createClient();
  const { data: offer } = await sb.from("offers").select("*, businesses(name, slug, category, portada_url, logo_url, address)").eq("id", id).maybeSingle();

  if (!offer) {
    return { title: "Oferta no encontrada | La Gran Barata Digital" };
  }

  const bizName = (offer as any).businesses?.name || "San Lorenzo";
  const descuento = offer.discount_percent ? `-${offer.discount_percent}%` : "OFERTA";
  const title = `${offer.title} ${descuento} en ${bizName} | La Gran Barata Digital`;
  const description = `${descuento} en ${bizName}. ${offer.description || "Oferta exclusiva en San Lorenzo, Santa Fe."}`;
  const image = offer.image_url || (offer as any).businesses?.portada_url || "https://sanlorenzodigital.vercel.app/banner.png";

  return {
    title,
    description,
    openGraph: {
      title, description,
      siteName: "La Gran Barata Digital",
      images: [{ url: image }],
      type: "website", locale: "es_AR",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/oferta/${id}` },
  };
}

export default function Page() {
  return <OfertaPage />;
}
