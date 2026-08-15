import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import NegocioPage from "./client";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sb = await createClient();
  const { data } = await sb.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Negocio no encontrado | La Gran Barata Digital" };
  const image = (data as any).portada_url || (data as any).logo_url || "https://sanlorenzodigital.vercel.app/banner.png";
  return {
    title: `${data.name} — ${data.category} en San Lorenzo`,
    description: data.description || `${data.name} en San Lorenzo, Santa Fe.`,
    openGraph: {
      title: `${data.name} — San Lorenzo`,
      description: data.description || "",
      type: "website",
      locale: "es_AR",
      images: [{ url: image }],
    },
    twitter: { card: "summary_large_image", images: [image] },
    alternates: { canonical: `https://sanlorenzodigital.vercel.app/negocio/${slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const sb = await createClient();
  const { data: negocio } = await sb.from("businesses").select("*").eq("slug", slug).maybeSingle();
  if (!negocio) notFound();
  const { data: ofertas } = await sb.from("offers")
    .select("*").eq("business_id", negocio?.id).eq("active", true).limit(20);
  const { data: productos } = await sb.from("products")
    .select("*").eq("business_id", negocio?.id).eq("active", true)
    .order("featured", { ascending: false }).order("created_at", { ascending: false }).limit(20);
  const { data: resenas } = await sb.from("business_reviews")
    .select("*").eq("business_id", negocio?.id).order("created_at", { ascending: false }).limit(10);

  // JSON-LD: LocalBusiness schema (Google indexa mejor)
  let jsonLd = null;
  if (negocio) {
    const b = negocio as any;
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: b.name,
      description: b.description || "",
      url: `https://sanlorenzodigital.vercel.app/negocio/${b.slug}`,
      image: b.portada_url || b.logo_url,
      telephone: b.phone || b.whatsapp,
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address,
        addressLocality: b.city || "San Lorenzo",
        addressRegion: b.province || "Santa Fe",
        addressCountry: b.country || "AR",
      },
      ...(b.latitude && b.longitude && {
        geo: { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude },
      }),
      ...(b.rating && { aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.reviews || 0 } }),
      ...(b.instagram && { sameAs: [`https://instagram.com/${b.instagram}`] }),
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <NegocioPage initialNegocio={negocio} initialOfertas={ofertas || []} initialProductos={productos || []} initialResenas={resenas || []} />
    </>
  );
}
