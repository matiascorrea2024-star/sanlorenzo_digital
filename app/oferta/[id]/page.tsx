import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { safeJsonLd } from "@/lib/json-ld";
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
  const image = offer.image_url || (offer as any).businesses?.portada_url || "https://sanlorenzodigital.vercel.app/banner.jpg";

  return {
    title, description,
    openGraph: { title, description, siteName: "La Gran Barata Digital", images: [{ url: image }], type: "website", locale: "es_AR" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/oferta/${id}` },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const sb = await createClient();
  const { data: offer } = await sb.from("offers").select("*, businesses(name, slug, category, portada_url, address, whatsapp, instagram)").eq("id", id).maybeSingle();
  if (!offer) notFound();

  let jsonLd = null;
  if (offer) {
    const o = offer as any;
    const biz = o.businesses || {};
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Offer",
      name: o.title,
      description: o.description || o.title,
      url: `https://sanlorenzodigital.vercel.app/oferta/${o.id}`,
      image: o.image_url || biz.portada_url,
      ...(o.old_price && o.offer_price && {
        price: o.offer_price,
        priceCurrency: "ARS",
        priceSpecification: {
          "@type": "PriceSpecification",
          price: o.offer_price,
          priceCurrency: "ARS",
        },
      }),
      ...(o.valid_until && { validThrough: o.valid_until }),
      itemOffered: {
        "@type": "Product",
        name: o.title,
      },
      offeredBy: {
        "@type": "LocalBusiness",
        name: biz.name,
        url: `https://sanlorenzodigital.vercel.app/negocio/${biz.slug}`,
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
        />
      )}
      <OfertaPage />
    </>
  );
}
