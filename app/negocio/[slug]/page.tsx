import { getAllBusinesses } from '@/lib/directory';
import { notFound } from 'next/navigation';
import BusinessMap from '@/components/business/map';

export const dynamic = 'force-dynamic';

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const businesses = await getAllBusinesses();
  const business = businesses.find((b) => b.slug === slug);

  if (!business) {
    notFound();
  }

  const locationStatus = business.location_source === 'manual' && business.location_verified
    ? '🟢 Confirmada por el negocio'
    : business.location_source === 'auto' && business.location_verified
    ? '🟢 Verificada'
    : business.location_source === 'auto'
    ? '🟡 Aproximada'
    : '🔴 No disponible';

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">{business.name}</h1>
          <p className="text-text-2 text-lg mb-2">{business.category}</p>
          <p className="text-text-2">{business.description}</p>
        </div>

        {/* Info principal */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Contacto */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold">Contacto</h2>
            
            {business.address && (
              <div>
                <p className="text-text-2 text-sm mb-1">Dirección</p>
                <p className="font-medium">{business.address}</p>
                <p className="text-sm mt-2">
                  <span className="inline-block px-2 py-1 rounded bg-surface-2 text-text-2">
                    {locationStatus}
                  </span>
                </p>
              </div>
            )}

            {business.whatsapp && (
              <div>
                <p className="text-text-2 text-sm mb-1">WhatsApp</p>
                <a
                  href={`https://wa.me/${business.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {business.whatsapp}
                </a>
              </div>
            )}

            {business.instagram && (
              <div>
                <p className="text-text-2 text-sm mb-1">Instagram</p>
                <a
                  href={`https://instagram.com/${business.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  @{business.instagram}
                </a>
              </div>
            )}
          </div>

          {/* Mapa */}
          {business.latitude && business.longitude && (
            <div>
              <h2 className="font-serif text-2xl font-semibold mb-4">Ubicación</h2>
              <BusinessMap
                latitude={business.latitude}
                longitude={business.longitude}
                address={business.address}
              />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Cómo llegar →
              </a>
            </div>
          )}
        </div>

        {/* Tags */}
        {business.tags && business.tags.length > 0 && (
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">Etiquetas</h2>
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-surface-2 text-text-2 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Horarios */}
        {business.schedule && (
          <div className="mb-8">
            <h2 className="font-serif text-2xl font-semibold mb-4">Horarios</h2>
            <p className="text-text-2">{business.schedule}</p>
          </div>
        )}
      </div>
    </div>
  );
}
