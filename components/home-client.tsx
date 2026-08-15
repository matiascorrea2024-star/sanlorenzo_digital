"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Anchor, ArrowRight, Factory, Flame, MapPin, X } from "lucide-react";
import Hero from "@/components/home/hero";
import OffersTicker from "@/components/home/offers-ticker";
import Featured from "@/components/home/featured";
import OfertaBomba from "@/components/home/oferta-bomba";
import WallOfFame from "@/components/home/wall-of-fame";
import TipRotativo from "@/components/home/tip-rotativo";
import OfferCard from "@/components/ui/offer-card";
import { CATEGORIES } from "@/lib/data";
import { calcDistanceKm } from "@/lib/geo";

type Oferta = {
  id: string;
  negocio: string;
  slug: string;
  producto: string;
  cat: string;
  vence?: string;
  descuento?: number;
  antes?: number;
  ahora?: number;
  real?: boolean;
  portada_url?: string;
  logo_url?: string;
  creado?: string;
  lat?: number;
  lon?: number;
  destacado?: boolean;
  rating?: number;
  verificado?: boolean;
};

const daysTo = (date: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(date + "T00:00:00").getTime() - hoy.getTime()) / 86400000);
};

const chip = (active: boolean) =>
  `shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
    active
      ? "border-orange-400/60 bg-gradient-to-r from-orange-500/25 to-pink-500/25 text-white shadow-[0_0_20px_rgba(249,115,22,.2)]"
      : "border-white/10 bg-white/[.03] text-white/60 hover:border-white/25 hover:text-white"
  }`;

export default function HomeClient({ initial, initialOfertas, initialTop }: { initial: any[]; initialOfertas: any[]; initialTop: any[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [offerFilter, setOfferFilter] = useState<"todas" | "hoy" | "50" | "nuevas" | "cerca" | "verificados">("todas");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const ofertasRef = useRef<HTMLElement>(null);

  // Las ofertas ya llegan resueltas del servidor (app/page.tsx) -- se
  // mapean una sola vez con useMemo en vez de re-pedirlas al cliente
  // (antes esto era un useEffect + fetch propio, un round-trip extra
  // en el camino crítico de la home).
  const ofertas = useMemo<Oferta[]>(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return (initialOfertas || [])
      .filter((o: any) => o.active && (!o.valid_until || o.valid_until >= hoy))
      .map((o: any) => ({
        id: o.id,
        negocio: o.business_name,
        slug: o.business_slug,
        producto: o.title,
        cat: o.business_category || "",
        vence: o.valid_until,
        descuento: o.discount_percent ? Number(o.discount_percent) : undefined,
        antes: o.old_price ? Number(o.old_price) : undefined,
        ahora: o.offer_price ? Number(o.offer_price) : undefined,
        real: true,
        portada_url: o.business_portada,
        logo_url: o.business_logo,
        creado: o.created_at,
        precio_prometido: !!o.precio_prometido,
        lat: o.business_latitude ? Number(o.business_latitude) : undefined,
        lon: o.business_longitude ? Number(o.business_longitude) : undefined,
        destacado: !!o.business_destacado,
        rating: o.business_rating ? Number(o.business_rating) : undefined,
        verificado: o.business_status === "verificado",
      }));
  }, [initialOfertas]);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // "Apretás y lo tenés ahí": scroll suave hasta los resultados
  const irAOfertas = () => {
    requestAnimationFrame(() => {
      ofertasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const aplicarCat = (id: string | null) => {
    setCat(id);
    irAOfertas();
  };

  const aplicarFiltro = (f: "todas" | "hoy" | "50" | "nuevas" | "cerca" | "verificados") => {
    setOfferFilter(f);
    irAOfertas();
  };

  // Snapshot de "ahora" tomado una sola vez al montar (lazy initializer
  // de useState, no dentro de un useMemo -- Date.now() ahí no es puro).
  const [ahora] = useState(() => Date.now());

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of initial as any[]) m.set(b.category, (m.get(b.category) || 0) + 1);
    return m;
  }, [initial]);

  const verificados = useMemo(
    () => new Set(initial.filter((b: any) => b.status === "verificado").map((b: any) => b.slug)),
    [initial]
  );

  const filteredOffers = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ofertas.filter((o) => {
      const okCat = !cat || o.cat === cat;
      const hay = `${o.producto} ${o.negocio} ${o.cat}`.toLowerCase();
      const okQ = !t || hay.includes(t);
      let okF = true;
      if (offerFilter === "hoy") okF = !!o.vence && daysTo(o.vence) <= 0;
      if (offerFilter === "50") okF = (o.descuento || 0) >= 50;
      if (offerFilter === "nuevas") okF = !!o.creado && (ahora - new Date(o.creado).getTime()) / 86400000 <= 7;
      if (offerFilter === "verificados") okF = verificados.has(o.slug);
      if (offerFilter === "cerca") okF = !!(coords && o.lat && o.lon && calcDistanceKm(coords.lat, coords.lon, o.lat, o.lon) <= 3);
      return okCat && okQ && okF;
    });
  }, [ofertas, cat, q, offerFilter, ahora, verificados, coords]);

  const filteredBusinesses = useMemo(() => {
    const t = q.trim().toLowerCase();
    return initial.filter((b: any) => {
      const okCat = !cat || b.category === cat;
      const hay = [b.name, b.category, b.description, ...(b.tags || []), ...(b.items || []).map((i: any) => i.name)].join(" ").toLowerCase();
      return okCat && (!t || hay.includes(t));
    });
  }, [initial, cat, q]);

  const catName = CATEGORIES.find((c) => c.id === cat)?.name;
  const buscando = !!q.trim() || !!cat;
  const porVencer = ofertas.filter((o) => o.vence && daysTo(o.vence) <= 3).length;
  const nuevasHoy = ofertas.filter((o) => o.creado && (ahora - new Date(o.creado).getTime()) / 86400000 <= 1).length;

  // Jerarquía visual: cuando no hay búsqueda/filtro activo, separamos
  // las ofertas de negocios Destacado Semanal en su propia fila -- no
  // todas las cards deben pesar lo mismo.
  const destacadasIds = useMemo(() => {
    if (buscando || offerFilter !== "todas") return new Set<string>();
    return new Set(filteredOffers.filter((o) => o.destacado).slice(0, 4).map((o) => o.id));
  }, [filteredOffers, buscando, offerFilter]);
  const ofertasDestacadas = useMemo(() => filteredOffers.filter((o) => destacadasIds.has(o.id)), [filteredOffers, destacadasIds]);
  const ofertasResto = useMemo(() => filteredOffers.filter((o) => !destacadasIds.has(o.id)), [filteredOffers, destacadasIds]);

  return (
    <main>
      <Hero
        onSearch={(v: string) => { setQ(v); setCat(null); irAOfertas(); }}
        stats={{ promos: ofertas.length, negocios: initial.length, pronto: porVencer }}
        seedNegocios={initial}
      />
      <OffersTicker />
      <OfertaBomba />

      {/* ===== BARRA STICKY: TODO A MANO ===== */}
      <div className="sticky top-14 z-40 border-b border-white/5 bg-[#120d09]/90 backdrop-blur-xl md:top-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="sld-no-scrollbar flex items-center gap-2 overflow-x-auto py-3">
            <button onClick={() => aplicarCat(null)} className={chip(!cat)}>🛍️ Todo</button>
            {CATEGORIES.map((c) => {
              const n = categoryCounts.get(c.id) || 0;
              return (
                <button key={c.id} onClick={() => aplicarCat(c.id)} className={chip(cat === c.id)}>
                  {c.icon} {c.name}
                  {n > 0 && <span className="ml-1.5 opacity-60">{n}</span>}
                </button>
              );
            })}
            <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
            <button onClick={() => aplicarFiltro("todas")} className={chip(offerFilter === "todas")}>✨ Todas</button>
            <button onClick={() => aplicarFiltro("hoy")} className={chip(offerFilter === "hoy")}>🔥 Terminan hoy</button>
            <button onClick={() => aplicarFiltro("50")} className={chip(offerFilter === "50")}>💸 50%+ OFF</button>
            <button onClick={() => aplicarFiltro("nuevas")} className={chip(offerFilter === "nuevas")}>🆕 Nuevas</button>
            {coords && <button onClick={() => aplicarFiltro("cerca")} className={chip(offerFilter === "cerca")}>📍 Cerca tuyo</button>}
            <button onClick={() => aplicarFiltro("verificados")} className={chip(offerFilter === "verificados")}>⭐ Verificados</button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <TipRotativo />
      </div>

      {/* ===== LA GRAN BARATA (protagonista) ===== */}
      <section ref={ofertasRef} id="ofertas" className="mx-auto max-w-7xl scroll-mt-32 px-4 pt-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">🔥 La Gran Barata</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-space)" }}>
              {buscando
                ? `Ofertas${catName ? ` de ${catName}` : ""}${q ? ` para “${q}”` : ""}`
                : "Ofertas reales, ahora mismo."}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--muted)]">
              <span>{filteredOffers.length} {filteredOffers.length === 1 ? "oferta activa" : "ofertas activas"} · publicadas por comercios de San Lorenzo</span>
              {nuevasHoy > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> {nuevasHoy} nueva{nuevasHoy === 1 ? "" : "s"} hoy
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {buscando && (
              <button
                onClick={() => { setQ(""); setCat(null); setOfferFilter("todas"); }}
                className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/60 hover:border-white/25 hover:text-white"
              >
                <X className="h-3 w-3" /> Limpiar
              </button>
            )}
            <Link href="/promociones" className="flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/10 px-3.5 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/20">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {filteredOffers.length > 0 ? (
          <>
            {ofertasDestacadas.length > 0 && (
              <div className="mb-6">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                  ⭐ Destacadas de la semana
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ofertasDestacadas.map((o) => (
                    <div key={o.id} className="rounded-2xl ring-2 ring-amber-400/40 ring-offset-2 ring-offset-[#120d09]">
                      <OfferCard o={o} userCoords={coords} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertasResto.slice(0, 12).map((o) => (
                <OfferCard key={o.id} o={o} userCoords={coords} />
              ))}
            </div>
          </>
        ) : (
          <div className="sld-card rounded-3xl p-10 text-center">
            <Flame className="mx-auto h-8 w-8 text-orange-400" />
            <p className="mt-3 text-lg font-bold">No hay ofertas con este filtro</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Los comercios publican promos todo el tiempo. Probá otro filtro o volvé en un rato.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => { setQ(""); setCat(null); setOfferFilter("todas"); }} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">
                Ver todas las ofertas
              </button>
              <Link href="/dashboard/ofertas/nueva" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/[.04]">
                Soy comercio: publicar oferta
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ===== NEGOCIOS (filtrados por el mismo rubro) ===== */}
      <div className="pt-10">
        <Featured
          list={filteredBusinesses}
          title={buscando ? `Negocios${catName ? ` de ${catName}` : ""}${q ? ` para “${q}”` : ""}` : "Negocios destacados"}
          userCoords={coords}
        />
      </div>

      {/* ===== BANDA COMPACTA: mapa + industria + puerto ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/mapa" className="sld-card group rounded-3xl p-6 transition hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15">
                <MapPin className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-black">Mapa de la ciudad</h3>
                <p className="text-xs text-[var(--muted)]">Negocios cerca tuyo, en tiempo real.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/b2b" className="sld-card group rounded-3xl p-6 transition hover:border-indigo-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/15">
                <Factory className="h-5 w-5 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-black">Industria y B2B</h3>
                <p className="text-xs text-[var(--muted)]">El cordón industrial, en un solo lugar.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-indigo-300 transition group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/portuario" className="sld-card group rounded-3xl p-6 transition hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15">
                <Anchor className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-black">Corredor portuario</h3>
                <p className="text-xs text-[var(--muted)]">Terminales, logística y comercio exterior.</p>
              </div>
              <ArrowRight className="h-4 w-4 text-cyan-300 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      <WallOfFame initialTop={initialTop} />

      {/* ===== CTA COMERCIOS ===== */}
      <section id="sumate" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-[#12111d] to-orange-500/10 p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-amber-500/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">Para comercios</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>
              Publicá tu oferta y aparecé en La Gran Barata.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Los vecinos entran todos los días a cazar ofertas. Publicá la tuya en 2 minutos, sin saber programar, y medí cuántos la ven.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/dashboard/nuevo" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Crear mi negocio</a>
              <a href="/para-negocios" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/[.04]">Conocer beneficios</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
