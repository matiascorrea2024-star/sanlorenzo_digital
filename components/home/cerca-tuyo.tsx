"use client";
import { useState } from "react";
import Link from "next/link";
import { useAllBusinesses, FullBusiness } from "@/lib/use-businesses";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=900&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function fmtDist(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function CercaTuyo() {
  const todos = useAllBusinesses();
  const [cerca, setCerca] = useState<(FullBusiness & { distancia: number })[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pedir = () => {
    setLoading(true);
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Tu navegador no soporta geolocalización.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const lista = todos
          .filter((b) => b.latitude && b.longitude)
          .map((b) => ({ ...b, distancia: dist(latitude, longitude, b.latitude!, b.longitude!) }))
          .sort((a, b) => a.distancia - b.distancia)
          .slice(0, 4);
        setCerca(lista);
        setLoading(false);
      },
      () => {
        setError("No pudimos obtener tu ubicación. Fijate si diste permiso de ubicación.");
        setLoading(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-4 pb-14">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">📍 Geolocalización</p>
        <h2 className="mt-1 text-2xl font-black md:text-3xl">¿Qué hay cerca tuyo?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
          Activá tu ubicación y te mostramos los negocios más cercanos de San Lorenzo.
        </p>
        <button
          onClick={pedir}
          disabled={loading}
          className="mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Buscando..." : "📍 Ver negocios cerca mío"}
        </button>
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </div>

      {cerca && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cerca.map((b) => (
            <Link
              key={b.id}
              href={"/negocio/" + b.slug}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60"
            >
              <div className="relative h-28">
                <img
                  src={b.portada_url || CATEGORY_IMAGES[b.category] || FALLBACK_IMAGE}
                  alt={b.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <span className="absolute right-2 top-2 rounded-lg bg-black/80 px-2 py-1 text-xs font-black text-orange-300">
                  📍 {fmtDist(b.distancia)}
                </span>
              </div>
              <div className="p-3">
                <p className="font-bold text-sm">{b.name}</p>
                <p className="text-xs capitalize text-white/50">{b.category}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
