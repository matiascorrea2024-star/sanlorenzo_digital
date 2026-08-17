"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, MapPin, Clock, ArrowRight } from "lucide-react";
import { parseIntent, intentSummary } from "@/lib/intent-parser";
import { useAllBusinesses } from "@/lib/use-businesses";
import { useGeoLocation } from "@/lib/hooks/use-geo";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge";
import OfferCard from "@/components/ui/offer-card";

type Oferta = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; antes?: number; ahora?: number;
  portada_url?: string; latitude?: number; longitude?: number;
  rating?: number; verificado?: boolean;
};

export default function AsistentePage() {
  const [q, setQ] = useState("");
  const negocios = useAllBusinesses();
  const { coords } = useGeoLocation();

  const intent = useMemo(() => parseIntent(q), [q]);
  const chips = q.trim().length > 2 ? intentSummary(intent) : [];

  // Ofertas reales activas (Supabase)
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  useEffect(() => {
    (async () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const { data } = await supabase()
        .from("offers_with_business")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(200);
      const reales: Oferta[] = (data || [])
        .filter((o: any) => !o.valid_until || o.valid_until >= hoy)
        .map((o: any) => ({
          id: o.id, negocio: o.business_name, slug: o.business_slug,
          producto: o.title, cat: o.business_category || "",
          vence: o.valid_until, descuento: o.discount_percent,
          antes: o.old_price ? Number(o.old_price) : undefined,
          ahora: o.offer_price ? Number(o.offer_price) : undefined,
          portada_url: o.business_portada,
          latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
          longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
          rating: o.business_rating ? Number(o.business_rating) : undefined,
          verificado: o.business_status === "verificado",
        }));
      setOfertas(reales);
    })();
  }, []);

  // Filtrar negocios por intención
  const negociosFiltrados = useMemo(() => {
    if (!q.trim()) return [];
    let list = [...negocios];

    if (intent.categoriaDetectada) {
      list = list.filter(b => b.category === intent.categoriaDetectada);
    }
    if (intent.termino) {
      list = list.filter(b =>
        b.name.toLowerCase().includes(intent.termino) ||
        (b.description || "").toLowerCase().includes(intent.termino) ||
        b.category.includes(intent.termino)
      );
    }
    if (intent.abiertoAhora) list = list.filter(b => b.open);
    if (intent.cercaMio && coords) {
      list = list
        .filter(b => b.latitude && b.longitude)
        .map(b => ({ ...b, _dist: calcDistanceKm(coords.lat, coords.lon, Number(b.latitude), Number(b.longitude)) }))
        .sort((a: any, b: any) => a._dist - b._dist)
        .slice(0, 6);
    }
    return list.slice(0, 6);
  }, [q, negocios, intent, coords]);

  // Filtrar ofertas por intención
  const ofertasFiltradas = useMemo(() => {
    if (!q.trim()) return [];
    let list = [...ofertas];

    if (intent.categoriaDetectada) list = list.filter(o => o.cat === intent.categoriaDetectada);
    if (intent.termino) list = list.filter(o => o.producto.toLowerCase().includes(intent.termino));
    if (intent.precioMax) list = list.filter(o => o.ahora && o.ahora <= intent.precioMax!);
    if (intent.precioMin) list = list.filter(o => o.ahora && o.ahora >= intent.precioMin!);
    if (intent.descuentoMin) list = list.filter(o => (o.descuento || 0) >= intent.descuentoMin!);
    if (intent.barato) list = list.sort((a, b) => (a.ahora || 0) - (b.ahora || 0));
    if (intent.cercaMio && coords) {
      list = list
        .filter(o => o.latitude && o.longitude)
        .sort((a, b) =>
          calcDistanceKm(coords.lat, coords.lon, a.latitude!, a.longitude!) -
          calcDistanceKm(coords.lat, coords.lon, b.latitude!, b.longitude!)
        );
    }
    return list.slice(0, 8);
  }, [q, ofertas, intent, coords]);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--ov-05)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.18), transparent 55%), radial-gradient(circle at 90% 30%, rgba(34,211,238,.12), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 py-14 text-center md:py-20">
          <Badge variant="warning" size="sm"><Sparkles className="h-3 w-3" /> Asistente local</Badge>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>¿Qué estás buscando?</h1>
          <p className="mt-2 text-[var(--muted)]">
            Escribí como se lo dirías a un amigo: &quot;zapatillas menos de 50000 cerca mío&quot;
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: pizza barata abierta ahora..."
            className="w-full rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] px-6 py-4 text-lg text-[var(--text)] outline-none placeholder:text-[var(--muted2)] focus:border-orange-400/50"
          />
        </div>
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--muted)]">Entendimos:</span>
            {chips.map(c => (
              <span key={c} className="rounded-full bg-orange-500/15 border border-orange-400/30 px-3 py-1 text-xs font-bold text-orange-300">
                {c}
              </span>
            ))}
          </div>
        )}

        {q.trim().length > 2 && (
          <>
            {ofertasFiltradas.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-black mb-4">Ofertas que coinciden ({ofertasFiltradas.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ofertasFiltradas.map(o => <OfferCard key={o.id} o={o} userCoords={coords} />)}
                </div>
              </section>
            )}

            {negociosFiltrados.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-black mb-4">Negocios que coinciden ({negociosFiltrados.length})</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {negociosFiltrados.map((b: any) => (
                    <Link key={b.id} href={`/negocio/${b.slug}`}
                      className="group rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-300 hover:-translate-y-0.5">
                      <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] transition-colors group-hover:border-orange-400/30">
                        <div className="flex-1">
                          <p className="font-bold">{b.name}</p>
                          <p className="text-xs capitalize text-[var(--muted)]">{b.category} · ⭐ {(b.rating || 0).toFixed(1)}</p>
                          <div className="mt-1 flex gap-2">
                            {b.open && <span className="text-[10px] text-green-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Abierto</span>}
                            {b._dist !== undefined && <span className="text-[10px] text-sky-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {fmtDistance(b._dist)}</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-orange-400 transition duration-300 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {ofertasFiltradas.length === 0 && negociosFiltrados.length === 0 && (
              <div className="mt-10 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-10 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <p className="text-lg font-bold">😕 No encontramos resultados exactos</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Probá con menos filtros, o mirá todas las ofertas en La Gran Barata.
                  </p>
                  <Link href="/promociones" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90">
                    Ver todas las ofertas
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
