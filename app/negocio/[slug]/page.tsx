import { notFound } from "next/navigation";
import { getAllBusinesses } from "@/lib/directory";
import BusinessView from "@/components/business/business-view";

type Params = Promise<{ slug: string }>;


const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=1200&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=85",
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=85";

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const b: any = (await getAllBusinesses()).find((x: any) => x.slug === slug);
  if (!b) return { title: "Negocio no encontrado | La Gran Barata Digital" };

  const desc =
    b.description ||
    `${b.name} en San Lorenzo: ofertas, ubicación y contacto en La Gran Barata Digital.`;

  return {
    title: `${b.name} | La Gran Barata Digital`,
    description: desc,
    openGraph: {
      title: `${b.name} · San Lorenzo`,
      description: desc,
      siteName: "La Gran Barata Digital",
      images: [{ url: b.portada_url || CATEGORY_IMAGES[b.category] || FALLBACK_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: b.name,
      description: desc,
    },
  };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  const b: any = (await getAllBusinesses()).find((x: any) => x.slug === slug);
  if (!b) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: b.name,
    description: b.description || "",
    address: {
      "@type": "PostalAddress",
      streetAddress: b.address || "",
      addressLocality: "San Lorenzo",
      addressRegion: "Santa Fe",
      addressCountry: "AR",
    },
    geo: b.latitude
      ? { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude }
      : undefined,
    telephone: b.whatsapp || undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BusinessView b={b} />
    </>
  );
}
