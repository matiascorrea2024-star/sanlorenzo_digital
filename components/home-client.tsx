"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Anchor, ArrowRight, Factory, Flame, MapPin } from "lucide-react";
import Hero from "@/components/home/hero";
import OffersTicker from "@/components/home/offers-ticker";
import Categories from "@/components/home/categories";
import Featured from "@/components/home/featured";
import OfferCard from "@/components/ui/offer-card";
import { CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";

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
};

export default function HomeClient({ initial }: { initial: any[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [cargandoOfertas, setCargandoOfertas] = useState(true);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Geolocalización para mostrar distancias en las tarjetas
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // LA GRAN BARATA: ofertas reales desde Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase()
          .from("offers_with_business")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);
        if (data) {
          const hoy = new Date().toISOString().slice(0, 10);
          const reales: Oferta[] = (data as any[])
            .filter((o) => o.active && (!o.valid_until || o.valid_until >= hoy))
            .map((o) => ({
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
            }));
          setOfertas(reales);
        }
      } catch (e) {
        console.error("No se pudieron cargar ofertas:", e);
      } finally {
        setCargandoOfertas(false);
      }
    })();
  }, []);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return initial.filter((b: any) => {
      const okCat = !cat || b.category === cat;
      const hay = [
        b.name,
        b.category,
        b.description,
        ...(b.tags || []),
        ...(b.items || []).map((i: any) => i.name),
      ]
        .join(" ")
        .toLowerCase();
      return okCat && (!t || hay.includes(t));
    });
  }, [q, cat]);

  const searching = !!q.trim() || !!cat;
  const catName = CATEGORIES.find((c) => c.id === cat)?.name;

  const porVencer = ofertas.filter((o) => {
    if (!o.vence) return false;
    const d = Math.round((new Date(o.vence + "T23:59:59").getTime() - Date.now()) / 86400000);
    return d <= 3;
  }).length;

  const heroStats = {
    promos: ofertas.length,
    negocios: initial.length,
    pronto: porVencer,
  };

  return (
    <main>
      <Hero
        onSearch={(v: string) => {
          setQ(v);
          setCat(null);
        }}
        stats={heroStats}
      />
      <OffersTicker />
      <Categories
        active={cat}
        onSelect={(id: string) => {
          setCat(id);
          setQ("");
        }}
      />

      {/* ===== LA GRAN BARATA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-orange-300">🔥 La Gran Barata</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>
              Ofertas reales, comercios reales.
            </h2>
          </div>
          <Link href="/promociones" className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:border-orange-300/40">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {cargandoOfertas ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : ofertas.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ofertas.slice(0, 8).map((o) => (
              <OfferCard key={o.id} o={o} userCoords={coords} />
            ))}
          </div>
        ) : (
          <div className="sld-card rounded-3xl p-10 text-center">
            <Flame className="mx-auto h-8 w-8 text-orange-400" />
            <p className="mt-3 text-lg font-bold">Por ahora no hay ofertas activas</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cuando los comercios publiquen promos en la Gran Barata, aparecen acá al instante.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/promociones" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">
                Ver promociones
              </Link>
              <Link href="/dashboard/ofertas/nueva" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/[.04]">
                Soy comercio: publicar oferta
              </Link>
            </div>
          </div>
        )}
      </section>

      <Featured
        list={list}
        title={
          searching
            ? "Resultados" + (catName ? " · " + catName : "") + (q ? " · “" + q + "”" : "")
            : "Negocios destacados"
        }
      />

      {/* ===== ECOSISTEMA INDUSTRIAL Y PORTUARIO ===== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/b2b" className="sld-card group rounded-3xl p-7 transition hover:border-indigo-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15">
                <Factory className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black">Industria y B2B</h3>
                <p className="text-sm text-[var(--muted)]">Proveedores, servicios y empresas del cordón industrial.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-indigo-300 transition group-hover:translate-x-1" />
            </div>
          </Link>
          <Link href="/portuario" className="sld-card group rounded-3xl p-7 transition hover:border-cyan-300/40">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15">
                <Anchor className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black">Corredor portuario</h3>
                <p className="text-sm text-[var(--muted)]">Terminales, logística fluvial y comercio exterior.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-cyan-300 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      {/* ===== CIUDADES ===== */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">🏙️ Ciudades</p>
          <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Explorá por ciudad</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/san-lorenzo" className="sld-card rounded-2xl p-5 transition hover:border-orange-300/60">
            <p className="flex items-center gap-2 font-black">
              <MapPin className="h-4 w-4 text-orange-300" /> San Lorenzo
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{initial.length} negocios activos</p>
          </Link>
          <div className="sld-card rounded-2xl p-5 opacity-50">
            <p className="font-bold">Puerto San Martín</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Próximamente</p>
          </div>
          <div className="sld-card rounded-2xl p-5 opacity-50">
            <p className="font-bold">Rosario</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Próximamente</p>
          </div>
        </div>
      </section>

      {/* ===== LO QUE ESTÁ PASANDO + CERCA TUYO ===== */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
          <div className="sld-card overflow-hidden rounded-3xl p-7 sm:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-300">🔥 Lo que está pasando</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>
                Promos, novedades y oportunidades locales.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)]">
                La plataforma está pensada para que el comercio local tenga presencia digital real y para que vos encuentres opciones cerca sin perder tiempo.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="/negocios" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Explorar negocios</a>
                <a href="/mapa" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold hover:bg-white/[.04]">Ver mapa</a>
              </div>
            </div>
          </div>
          <div className="sld-card rounded-3xl p-7">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">📍 Cerca tuyo</p>
            <h3 className="mt-2 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Todo conectado al mapa.</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Ubicaciones, cómo llegar y negocios de tu zona en una experiencia simple.
            </p>
            <a href="/mapa" className="mt-6 inline-flex rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:border-cyan-300/30">
              Abrir mapa →
            </a>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section id="como" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">Simple</p>
          <h2 className="mt-2 text-3xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Encontrar. Comparar. Contactar.</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Buscás", "Escribís qué necesitás y filtrás por categoría."],
            ["02", "Descubrís", "Mirás perfiles, horarios, productos, ubicación y reseñas."],
            ["03", "Contactás", "WhatsApp, Instagram, llamada o cómo llegar, directo."],
          ].map(([n, t, d]) => (
            <div key={n} className="sld-card rounded-2xl p-6">
              <span className="text-xs font-black text-violet-300">{n}</span>
              <h3 className="mt-8 text-xl font-bold">{t}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA COMERCIOS ===== */}
      <section id="sumate" className="mx-auto max-w-7xl pb-20 sm:px-6 px-4">
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-600/20 via-[#12111d] to-cyan-400/10 p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-violet-300">Para comercios</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl" style={{ fontFamily: "var(--font-space)" }}>
              Tu negocio también merece una presencia digital de verdad.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              Miniweb, catálogo, promociones, ubicación, contacto y estadísticas. Todo en un mismo lugar y sin tener que saber programar.
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