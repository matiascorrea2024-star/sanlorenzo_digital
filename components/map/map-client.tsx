"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix de iconos de Leaflet (problema conocido con bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SAN_LORENZO: [number, number] = [-32.7475, -60.7285];

export default function MapClient({ businesses }: { businesses: any[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <main className="px-4 py-20 text-center text-sm text-[var(--muted)]">Cargando mapa…</main>;

  return (
    <main>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>🗺️ Explorá el mapa</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{businesses.length} negocios de San Lorenzo</p>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="h-[70vh] overflow-hidden rounded-2xl border border-[var(--line)]">
          <MapContainer center={SAN_LORENZO} zoom={15} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {businesses.map((b) => (
              <Marker key={b.id} position={[b.latitude, b.longitude]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">{b.name}</p>
                    <p className="text-xs capitalize text-gray-600">{b.category}</p>
                    <p className="mt-1 text-xs">⭐ {Number(b.rating || 0).toFixed(1)} ({b.reviews || 0})</p>
                    <a href={`/negocio/${b.slug}`} className="mt-2 inline-block rounded bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                      Ver miniweb →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </main>
  );
}
