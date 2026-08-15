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

import PageHero from "@/components/ui/page-hero";

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
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <PageHero title="🤖 Asistente IA" subtitle="Preguntale lo que quieras de San Lorenzo" />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="text-center">
          <Badge variant="warning" size="sm"><Sparkles className="h-3 w-3" /> Asistente local</Badge>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">¿Qué estás buscando?</h1>
          <p className="mt-2 text-white/60">
            Escribí como se lo dirías a un amigo: &quot;zapatillas menos de 50000 cerca mío&quot;
          </p>
        </div>

        <div className="mt-8">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ej: pizza barata abierta ahora..."
            className="w-full rounded-2xl border border-white/15 bg-black/70 px-6 py-4 text-lg outline-none focus:border-orange-400"
          />
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-white/50">Entendimos:</span>
              {chips.map(c => (
                <span key={c} className="rounded-full bg-orange-500/15 border border-orange-400/30 px-3 py-1 text-xs font-bold text-orange-300">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {q.trim().length > 2 && (
          <>
            {ofertasFiltradas.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-black mb-4">🔥 Ofertas que coinciden ({ofertasFiltradas.length})</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ofertasFiltradas.map(o => <OfferCard key={o.id} o={o} userCoords={coords} />)}
                </div>
              </section>
            )}

            {negociosFiltrados.length > 0 && (
              <section className="mt-10">
                <h2 className="text-xl font-black mb-4">🏪 Negocios que coinciden ({negociosFiltrados.length})</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {negociosFiltrados.map((b: any) => (
                    <Link key={b.id} href={`/negocio/${b.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-orange-400/50 transition">
                      <div className="flex-1">
                        <p className="font-bold">{b.name}</p>
                        <p className="text-xs capitalize text-white/50">{b.category} · ⭐ {(b.rating || 0).toFixed(1)}</p>
                        <div className="mt-1 flex gap-2">
                          {b.open && <span className="text-[10px] text-green-400 flex items-center gap-1"><Clock className="h-3 w-3" /> Abierto</span>}
                          {b._dist !== undefined && <span className="text-[10px] text-sky-400 flex items-center gap-1"><MapPin className="h-3 w-3" /> {fmtDistance(b._dist)}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-orange-400" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {ofertasFiltradas.length === 0 && negociosFiltrados.length === 0 && (
              <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                <p className="text-lg font-bold">😕 No encontramos resultados exactos</p>
                <p className="mt-2 text-sm text-white/50">
                  Probá con menos filtros, o mirá todas las ofertas en La Gran Barata.
                </p>
                <Link href="/promociones" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black">
                  Ver todas las ofertas
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
