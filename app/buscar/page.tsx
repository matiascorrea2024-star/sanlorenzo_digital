"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import { useAllBusinesses } from "@/lib/use-businesses";

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
const FALLBACK = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const fmtDist = (m: number) => (m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`);

export default function BuscarPage() {
  const todos = useAllBusinesses();
  const [q, setQ] = useState("");
  const [conOfertas, setConOfertas] = useState(false);
  const [abiertos, setAbiertos] = useState(false);
  const [conEnvios, setConEnvios] = useState(false);
  const [cerca, setCerca] = useState<{ lat: number; lng: number } | null>(null);
  const [distancias, setDistancias] = useState<Record<string, number>>({});

  const hoy = new Date().toISOString().slice(0, 10);
  const tieneOfertas = (b: any) =>
    (b.promotions || []).some(
      (p: any) =>
        p.title &&
        (!p.expires || p.expires >= hoy) &&
        (!p.expires_at || new Date(p.expires_at).getTime() > Date.now())
    );

  useEffect(() => {
    if (!cerca) return;
    const d: Record<string, number> = {};
    todos.forEach((b: any) => {
      if (b.latitude && b.longitude) d[b.id] = dist(cerca.lat, cerca.lng, b.latitude, b.longitude);
    });
    setDistancias(d);
  }, [cerca, todos]);

  const pedirUbicacion = () => {
    if (cerca) {
      setCerca(null);
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCerca({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("No pudimos obtener tu ubicación. Fijate si diste permiso.")
    );
  };

  const resultados = todos
    .filter((b: any) => {
      if (q) {
        const t = q.toLowerCase();
        const enItems = (b.items || []).some((i: any) => (i.name || "").toLowerCase().includes(t));
        const enTags = (b.tags || []).some((x: string) => x.toLowerCase().includes(t));
        if (
          !b.name.toLowerCase().includes(t) &&
          !enItems &&
          !enTags &&
          !(b.description || "").toLowerCase().includes(t)
        )
          return false;
      }
      if (conOfertas && !tieneOfertas(b)) return false;
      if (abiertos && !b.open) return false;
      if (conEnvios && !b.hace_envios) return false;
      if (cerca && distancias[b.id] == null) return false;
      return true;
    })
    .sort((a: any, b: any) => (cerca ? (distancias[a.id] ?? 9e9) - (distancias[b.id] ?? 9e9) : 0));

  return (
    <main className="bg-[#0a0710] text-white min-h-screen pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PageHero title="🔍 Buscador inteligente" subtitle="Buscá por nombre, producto o rubro, y filtrá como quieras" />

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Probá: zapatillas, pizza, peluquería…"
          className="mt-5 w-full rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-base outline-none focus:border-orange-400"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setConOfertas(!conOfertas)} className={`rounded-full px-4 py-2 text-xs font-black transition ${conOfertas ? "bg-orange-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
            🔥 Con ofertas ahora
          </button>
          <button onClick={() => setAbiertos(!abiertos)} className={`rounded-full px-4 py-2 text-xs font-black transition ${abiertos ? "bg-green-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
            🟢 Abierto ahora
          </button>
          <button onClick={pedirUbicacion} className={`rounded-full px-4 py-2 text-xs font-black transition ${cerca ? "bg-sky-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
            📍 {cerca ? "Ordenando por cercanía ✓" : "Cerca mío"}
          </button>
          <button onClick={() => setConEnvios(!conEnvios)} className={`rounded-full px-4 py-2 text-xs font-black transition ${conEnvios ? "bg-sky-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
            🚚 Hace envíos
          </button>
        </div>

        <p className="mt-6 text-sm text-white/50">{resultados.length} resultados</p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((b: any) => (
            <Link key={b.id} href={"/negocio/" + b.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60">
              <div className="relative h-32">
                <img src={b.portada_url || CATEGORY_IMAGES[b.category] || FALLBACK} alt={b.name} loading="lazy" className="h-56 w-full object-cover md:h-72" />
                <div className="absolute left-2 top-2 flex gap-1">
                  {b.open && <span className="rounded-md bg-green-500/90 px-2 py-0.5 text-[10px] font-black">🟢 Abierto</span>}
                  {tieneOfertas(b) && <span className="rounded-md bg-orange-500/90 px-2 py-0.5 text-[10px] font-black">🔥 Ofertas</span>}
                </div>
                {cerca && distancias[b.id] != null && (
                  <span className="absolute right-2 top-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-black text-sky-300">📍 {fmtDist(distancias[b.id])}</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-bold text-sm">{b.name}</p>
                <p className="text-xs capitalize text-white/50">{b.category}</p>
              </div>
            </Link>
          ))}
          {resultados.length === 0 && (
            <p className="col-span-full text-center text-white/50 py-16">No encontramos nada con esos filtros. Probá con menos filtros o otra palabra.</p>
          )}
        </div>
      </div>
    </main>
  );
}
