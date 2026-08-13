"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAllBusinesses } from "@/lib/use-businesses";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });

export default function MapaPage() {
  const todos = useAllBusinesses();
  const conUbicacion = todos.filter((b) => b.latitude && b.longitude);

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300 mb-4 inline-block">
          ← Volver al inicio
        </Link>
        <h1 className="text-3xl font-black md:text-4xl">🗺️ Mapa comercial de San Lorenzo</h1>
        <p className="text-white/60 mt-1">
          {conUbicacion.length} negocios con ubicación · tocá un pin para ver el negocio
        </p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="h-[70vh] overflow-hidden rounded-3xl border border-white/10">
          <MapContainer
            center={[-32.7467179, -60.7345072]}
            zoom={14}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {conUbicacion.map((b) => (
              <Marker key={b.id} position={[b.latitude!, b.longitude!]}>
                <Popup>
                  <div style={{ fontFamily: "sans-serif" }}>
                    <strong>{b.name}</strong>
                    <br />
                    <span style={{ textTransform: "capitalize" }}>{b.category}</span>
                    <br />
                    <a href={"/negocio/" + b.slug} style={{ color: "#ea580c", fontWeight: 700 }}>
                      Ver negocio →
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <p className="mt-4 text-xs text-white/40">
          🟢 Los pines provienen de las coordenadas confirmadas o geocodificadas de cada negocio.
        </p>
      </div>
    </main>
  );
}
