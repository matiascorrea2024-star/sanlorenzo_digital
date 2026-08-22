// JSON.stringify no escapa "</script>" -- si un campo de usuario (nombre,
// descripción de negocio/oferta) contiene ese string, corta el <script>
// y permite inyectar JS arbitrario para cualquier visitante de la ficha.
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function createLocalBusinessSchema(business: any) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    image: business.portada_url || business.logo_url,
    url: `https://sanlorenzodigital.vercel.app/negocio/${business.slug}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: "San Lorenzo",
      addressRegion: "Santa Fe",
      addressCountry: "AR",
    },
    telephone: business.whatsapp ? `+549${business.whatsapp.replace(/\D/g, "")}` : undefined,
    aggregateRating: business.rating ? {
      "@type": "AggregateRating",
      ratingValue: business.rating,
      reviewCount: business.reviews || 0,
    } : undefined,
    geo: business.latitude && business.longitude ? {
      "@type": "GeoCoordinates",
      latitude: business.latitude,
      longitude: business.longitude,
    } : undefined,
    sameAs: business.instagram ? `https://instagram.com/${business.instagram}` : undefined,
  };
}

export function createOfferSchema(offer: any, business: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: offer.title,
    description: offer.description,
    image: offer.image_url,
    url: `https://sanlorenzodigital.vercel.app/oferta/${offer.id}`,
    offeredBy: {
      "@type": "LocalBusiness",
      name: business.name,
      url: `https://sanlorenzodigital.vercel.app/negocio/${business.slug}`,
    },
    price: offer.price || "Consultar",
    priceCurrency: "ARS",
    availability: "https://schema.org/InStock",
    validFrom: offer.created_at,
    validUntil: offer.expires_at,
  };
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "San Lorenzo Digital",
    description: "Todo San Lorenzo en un solo lugar - Ofertas, negocios, servicios y lugares",
    url: "https://sanlorenzodigital.vercel.app",
    logo: "https://sanlorenzodigital.vercel.app/logo.png",
    image: "https://sanlorenzodigital.vercel.app/banner.jpg",
    address: {
      "@type": "PostalAddress",
      addressLocality: "San Lorenzo",
      addressRegion: "Santa Fe",
      addressCountry: "AR",
    },
    sameAs: [
      "https://instagram.com/sanlorenzodigital",
      "https://facebook.com/sanlorenzodigital",
    ],
  };
}
