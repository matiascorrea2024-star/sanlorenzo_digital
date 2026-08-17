"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageHero from "@/components/ui/page-hero";
import BusinessCard from "@/components/business/card";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { hoyArgentina } from "@/lib/fecha-ar";

const COLUMNS = "id, name, slug, category, description, address, latitude, longitude, open, hace_envios, portada_url, logo_url, rating, reviews, status, type, promotions";
const RESULT_LIMIT = 60;

function dist(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function BuscarPage() {
  return (
    <Suspense fallback={null}>
      <BuscarContent />
    </Suspense>
  );
}

function BuscarContent() {
  const searchParams = useSearchParams();
  // El buscador del hero navega acá con "?q=..." -- lo tomamos como
  // valor inicial una sola vez (lazy initializer), no se vuelve a leer
  // en cada render para no pisar lo que el usuario tipee después.
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [conOfertas, setConOfertas] = useState(false);
  const [abiertos, setAbiertos] = useState(false);
  const [conEnvios, setConEnvios] = useState(false);
  const [cerca, setCerca] = useState<{ lat: number; lng: number } | null>(null);
  const [distancias, setDistancias] = useState<Record<string, number>>({});
  const [todos, setTodos] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(true);
  const { trackSearch } = useAnalytics();

  // Antes: bajaba TODOS los negocios activos al navegador y filtraba en
  // el celular del usuario -- con muchos negocios eso tarda y consume
  // datos en cada búsqueda. Ahora consulta la base directamente (con o
  // sin término -- sin término trae los destacados/mejor rankeados como
  // punto de partida, no la tabla entera).
  useEffect(() => {
    setBuscando(true);
    const t = setTimeout(async () => {
      let query = supabase().from("businesses").select(COLUMNS)
        .in("status", ["verificado", "reclamado"]).eq("activo", true);
      const term = q.trim();
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`);
      if (abiertos) query = query.eq("open", true);
      if (conEnvios) query = query.eq("hace_envios", true);
      const { data } = await query.order("destacado", { ascending: false }).order("rating", { ascending: false }).limit(RESULT_LIMIT);
      setTodos(data || []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, abiertos, conEnvios]);

  // Búsquedas reales, con debounce -- alimenta "oportunidades de hoy" y el
  // futuro "pulso comercial" (categoría más buscada). Antes de esto no se
  // guardaba ningún término de búsqueda en ningún lado.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => trackSearch(term), 800);
    return () => clearTimeout(t);
  }, [q]);

  const [hoy] = useState(() => hoyArgentina());
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

  // q/abiertos/conEnvios ya se aplicaron en la consulta a Supabase --
  // acá solo quedan los filtros que necesitan datos calculados en el
  // cliente (distancia real al usuario) o que no viven en una columna
  // simple (ofertas activas, adentro de promotions).
  const resultados = todos
    .filter((b: any) => {
      if (conOfertas && !tieneOfertas(b)) return false;
      if (cerca && distancias[b.id] == null) return false;
      return true;
    })
    .sort((a: any, b: any) => (cerca ? (distancias[a.id] ?? 9e9) - (distancias[b.id] ?? 9e9) : 0));

  return (
    <main className="bg-[#0c0a0b] text-white min-h-screen pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PageHero title="Buscador inteligente" subtitle="Buscá por nombre, producto o rubro, y filtrá como quieras" />

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

        <p className="mt-6 text-sm text-white/50">
          {resultados.length} resultados{buscando && <span className="ml-2 text-white/30">buscando...</span>}
        </p>

        {/* Misma card que Home/Negocios (marco de rango, badges, hover) --
            antes el buscador tenía su propia versión más pobre, sin logo
            ni rango, que se sentía como una pantalla distinta del resto. */}
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resultados.map((b: any) => (
            <BusinessCard key={b.id} b={b} userCoords={cerca ? { lat: cerca.lat, lon: cerca.lng } : null} />
          ))}
          {!buscando && resultados.length === 0 && (
            <p className="col-span-full text-center text-white/50 py-16">No encontramos nada con esos filtros. Probá con menos filtros o otra palabra.</p>
          )}
        </div>
      </div>
    </main>
  );
}
