"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageCircle, Search, Store } from "lucide-react";
import Hero from "@/components/home/hero";
import OffersTicker from "@/components/home/offers-ticker";
import LiveNow from "@/components/home/live-now";
import Stories from "@/components/home/stories";
import ReelsStrip from "@/components/home/reels-strip";
import NewThisWeek from "@/components/home/new-this-week";
import NegocioDelMes from "@/components/home/negocio-del-mes";
import OfertaBomba from "@/components/home/oferta-bomba";
import TipRotativo from "@/components/home/tip-rotativo";
import Featured from "@/components/home/featured";
import OfferCard from "@/components/ui/offer-card";
import SectionTitle from "@/components/ui/section-title";
import { CATEGORIES } from "@/lib/data";

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
  `shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? "border-orange-400/50 bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-white"
      : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:text-white"
  }`;

const PASOS = [
  { icon: Search, titulo: "Buscá", texto: "Escribí lo que necesitás y mirá qué hay cerca tuyo.", grad: "from-orange-500 to-amber-400", glow: "shadow-orange-500/40" },
  { icon: Store, titulo: "Elegí", texto: "Mirá fotos, precios y datos reales de cada negocio.", grad: "from-pink-500 to-rose-400", glow: "shadow-pink-500/40" },
  { icon: MessageCircle, titulo: "Contactá", texto: "Hablá directo por WhatsApp con el comercio.", grad: "from-cyan-500 to-sky-400", glow: "shadow-cyan-500/40" },
];

export default function HomeClient({ initial, initialOfertas }: { initial: any[]; initialOfertas: any[] }) {
  const router = useRouter();
  const [cat, setCat] = useState<string | null>(null);
  const [coords] = useState<{ lat: number; lon: number } | null>(null);

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

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of initial as any[]) m.set(b.category, (m.get(b.category) || 0) + 1);
    return m;
  }, [initial]);

  const filteredBusinesses = useMemo(() => {
    // Destacado Semanal (plan pago) manda al frente -- si no, pagar por
    // posición destacada no cambiaba nada en la práctica.
    const base = cat ? initial.filter((b: any) => b.category === cat) : initial;
    return [...base].sort((a: any, b: any) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
  }, [initial, cat]);

  // El buscador y las sugerencias del hero no filtran esta misma
  // página -- van al buscador dedicado, que ya tiene los filtros
  // completos (distancia, envíos, abierto ahora, etc.).
  const irABuscar = (term: string) => router.push(`/buscar?q=${encodeURIComponent(term)}`);

  const plataformaVacia = initial.length === 0 && ofertas.length === 0;
  const porVencer = ofertas.filter((o) => o.vence && daysTo(o.vence) <= 3).length;
  // Snapshot de "ahora" tomado una sola vez (lazy initializer, no en
  // cada render) para el resumen diario -- solo cuenta lo que es real.
  const [ahora] = useState(() => Date.now());
  const nuevasHoy = ofertas.filter((o) => o.creado && (ahora - new Date(o.creado).getTime()) / 86400000 <= 1).length;
  const terminanHoy = ofertas.filter((o) => o.vence && daysTo(o.vence) === 0).length;

  return (
    <main>
      <Hero
        onSearch={irABuscar}
        stats={{ promos: ofertas.length, negocios: initial.length, pronto: porVencer }}
        seedNegocios={initial}
      />
      <OffersTicker />
      <Stories />

      {/* Color que respira debajo del hero: aurora muy sutil en loop
          lento (solo opacity), detrás de todas las secciones nuevas. */}
      <div className="relative">
        <div className="aurora-bg" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="relative z-10">
      <OfertaBomba />
      <LiveNow />
      <ReelsStrip />
      <NewThisWeek />

      {/* CTA compacta al chat comunitario -- sin fetch propio, no suma
          peso a la home. */}
      <div className="mx-auto max-w-4xl px-4">
        <Link href="/comunidad"
          className="group flex items-center justify-between gap-3 rounded-full border border-cyan-400/20 bg-cyan-500/[.05] px-5 py-3 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-500/10">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 shrink-0 text-cyan-300" />
            <span className="font-bold text-cyan-100">Chat de tu ciudad</span>
            <span className="hidden text-white/50 sm:inline">-- preguntas, avisos, conectá con tus vecinos</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300 transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <NegocioDelMes />

      {/* ===== HOY EN SAN LORENZO ===== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <SectionTitle
          eyebrow="Hoy en San Lorenzo"
          title="Ofertas activas"
          subtitle={
            ofertas.length > 0
              ? [
                  `${ofertas.length} ${ofertas.length === 1 ? "oferta activa" : "ofertas activas"}`,
                  nuevasHoy > 0 && `${nuevasHoy} ${nuevasHoy === 1 ? "nueva" : "nuevas"} hoy`,
                  terminanHoy > 0 && `${terminanHoy} ${terminanHoy === 1 ? "termina" : "terminan"} hoy`,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : undefined
          }
          action={
            ofertas.length > 0 ? (
              <Link href="/promociones" className="flex items-center gap-1 text-sm text-[var(--muted)] hover:text-white">
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : undefined
          }
        />
        {ofertas.length > 0 ? (
          <div
            role="region"
            aria-label="Ofertas activas, scroll horizontal"
            tabIndex={0}
            className="sld-no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
          >
            {ofertas.slice(0, 10).map((o) => (
              <div key={o.id} className="stagger-item w-72 shrink-0">
                <OfferCard o={o} userCoords={coords} />
              </div>
            ))}
          </div>
        ) : (
          <div className="sld-card flex flex-col items-center gap-3 rounded-2xl px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <p className="font-semibold">Estamos llegando: sé de los primeros.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Todavía no hay ofertas publicadas -- las primeras van a aparecer acá.</p>
            </div>
            <Link
              href="/dashboard/ofertas/nueva"
              className="shrink-0 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              Publicar la primera oferta
            </Link>
          </div>
        )}
        {ofertas.length === 0 && (
          <div
            role="region"
            aria-label="Rubros próximamente"
            tabIndex={0}
            className="sld-no-scrollbar mt-3 flex gap-2 overflow-x-auto"
          >
            {CATEGORIES.slice(0, 8).map((c) => (
              <span key={c.id} className="shrink-0 rounded-full border border-white/10 bg-white/[.03] px-3 py-1 text-xs text-[var(--muted)]">
                {c.icon} {c.name} · próximamente
              </span>
            ))}
          </div>
        )}
      </section>

      {/* ===== NEGOCIOS DESTACADOS ===== */}
      {!plataformaVacia && (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div role="region" aria-label="Filtrar por rubro, scroll horizontal" tabIndex={0} className="sld-no-scrollbar flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setCat(null)} className={chip(!cat)}>Todo</button>
              {CATEGORIES.filter((c) => categoryCounts.has(c.id)).map((c) => (
                <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)} className={chip(cat === c.id)}>
                  {c.icon} {c.name} <span className="opacity-60">{categoryCounts.get(c.id)}</span>
                </button>
              ))}
            </div>
          </div>
          <Featured list={filteredBusinesses} title="Negocios destacados" userCoords={coords} />
        </>
      )}

      <TipRotativo />

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
        <SectionTitle eyebrow="Cómo funciona" title="Así de simple" />
        <div className="grid gap-4 sm:grid-cols-3">
          {PASOS.map(({ icon: Icon, titulo, texto, grad, glow }, i) => (
            <div key={titulo} className="stagger-item sld-card relative overflow-hidden rounded-2xl p-5">
              <span className="pointer-events-none absolute -right-6 -top-6 text-7xl font-black text-white/[.04]">{i + 1}</span>
              <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} shadow-lg ${glow}`}>
                <Icon className="h-6 w-6 text-white" strokeWidth={2.4} />
              </div>
              <h3 className="relative mt-3 text-lg font-black">{titulo}</h3>
              <p className="relative mt-1.5 text-sm text-[var(--muted)]">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PARA COMERCIOS Y PARTICULARES ===== */}
      <section id="sumate" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="rounded-[1.75rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/[.06] to-pink-500/[.03] p-1.5">
          <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] sm:p-10">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">Para comercios</p>
            <h2 className="mt-2 max-w-xl text-2xl font-bold tracking-tight sm:text-3xl" style={{ fontFamily: "var(--font-space)" }}>
              Publicá tu negocio gratis y aparecé en San Lorenzo Digital.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Sin saber programar, en 2 minutos. Los vecinos te encuentran buscando por rubro, producto o nombre.
            </p>
            <Link
              href="/dashboard/nuevo"
              className="mt-6 inline-block rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90"
            >
              Crear mi negocio
            </Link>

            <div className="mt-8 flex items-start gap-3 border-t border-white/10 pt-6">
              <span className="text-2xl">🙋</span>
              <div>
                <p className="font-bold text-white">¿Vendés algo pero no tenés local?</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[var(--muted)]">
                  También podés sumarte, gratis. Ropa, comida casera, changas, lo que sea -- sin necesidad de un
                  comercio físico.
                </p>
                <Link href="/dashboard/nuevo?type=particular" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-cyan-300 hover:text-cyan-200">
                  Sumarme como particular →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
        </div>
      </div>
    </main>
  );
}
