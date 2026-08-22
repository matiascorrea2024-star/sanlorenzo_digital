import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { safeJsonLd } from "@/lib/json-ld";
import OfertaPage from "./client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const sb = await createClient();
  const { data: offer } = await sb.from("offers")
    .select("*, businesses!inner(name, slug, category, portada_url, logo_url, address, status, activo)")
    .eq("id", id).eq("active", true).eq("businesses.status", "verificado").neq("businesses.activo", false).maybeSingle();

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
  const { data: offer } = await sb.from("offers")
    .select("*, businesses!inner(name, slug, category, portada_url, address, whatsapp, instagram, status, activo)")
    .eq("id", id).eq("active", true).eq("businesses.status", "verificado").neq("businesses.activo", false).maybeSingle();
  if (!offer) notFound();

  // Google espera Product > offers > Offer (Product como raíz) para
  // mostrar precio/disponibilidad en resultados de búsqueda -- antes
  // esto tenía Offer como raíz con el producto adentro (itemOffered),
  // al revés de lo que documenta Google Rich Results, así que aunque
  // el JSON-LD fuera válido, probablemente nunca se mostraba el precio.
  let jsonLd = null;
  if (offer) {
    const o = offer as any;
    const biz = o.businesses || {};
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: o.title,
      description: o.description || o.title,
      image: o.image_url || biz.portada_url,
      brand: { "@type": "Brand", name: biz.name },
      // offers requiere price+priceCurrency -- si la oferta no tiene un
      // precio final cargado, no se emite (mejor omitirlo que mandar un
      // Offer incompleto que Google va a rechazar igual).
      ...(o.offer_price && {
        offers: {
          "@type": "Offer",
          url: `https://sanlorenzodigital.vercel.app/oferta/${o.id}`,
          price: o.offer_price,
          priceCurrency: "ARS",
          availability: "https://schema.org/InStock",
          ...(o.valid_until && { priceValidUntil: o.valid_until }),
          seller: {
            "@type": "LocalBusiness",
            name: biz.name,
            url: `https://sanlorenzodigital.vercel.app/negocio/${biz.slug}`,
          },
        },
      }),
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
