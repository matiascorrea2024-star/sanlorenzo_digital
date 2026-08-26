"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Megaphone, Search, Store } from "lucide-react";
import Hero from "@/components/home/hero";
import Featured from "@/components/home/featured";
import OfertasBomba from "@/components/home/ofertas-bomba";
import Colecciones from "@/components/home/colecciones";
import VotoDelDia from "@/components/home/voto-del-dia";
import OfferCard from "@/components/ui/offer-card";
import { CATEGORIES } from "@/lib/data";
import { hoyArgentina } from "@/lib/fecha-ar";
import { PLANES } from "@/lib/plans";

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
  portada_url?: string;
  logo_url?: string;
  creado?: string;
  latitude?: number;
  longitude?: number;
  precio_prometido?: boolean;
  destacado?: boolean;
  rating?: number;
  verificado?: boolean;
  impulsada?: boolean;
  businessOpen?: boolean;
};

const daysTo = (date: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${date}T00:00:00`).getTime() - today.getTime()) / 86400000);
};

const planFeatures: Record<string, string[]> = {
  gratis: ["Perfil de negocio", "Hasta 3 ofertas activas"],
  profesional: ["Ofertas ilimitadas", "Estadísticas y campañas"],
  premium: ["Posición destacada", "Más visibilidad durante 7 días"],
};

// Encabezado de sección del lenguaje LA GRAN BARATA: eyebrow técnico
// magenta + título display condensado uppercase.
function SectionHead({ eyebrow, title, sub, action }: { eyebrow: string; title: React.ReactNode; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{eyebrow}</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl leading-[0.9] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl">{title}</h2>
        {sub && <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export default function HomeClient({ initial, initialOfertas }: { initial: any[]; initialOfertas: any[] }) {
  const router = useRouter();
  const [cat, setCat] = useState<string | null>(null);
  const [coords] = useState<{ lat: number; lon: number } | null>(null);
  const [hoy] = useState(() => hoyArgentina());
  const [ahora] = useState(() => Date.now());
  const [modo, setModo] = useState<"todo" | "ahora" | "esta-noche">("todo");

  const ofertas = useMemo<Oferta[]>(() => (
    (initialOfertas || [])
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
        portada_url: o.business_portada,
        logo_url: o.business_logo,
        creado: o.created_at,
        precio_prometido: !!o.precio_prometido,
        latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
        longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
        destacado: !!o.business_destacado,
        rating: o.business_rating ? Number(o.business_rating) : undefined,
        verificado: o.business_status === "verificado",
        impulsada: !!o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora,
        businessOpen: o.business_open === true,
      }))
      .sort((a, b) => Number(!!b.impulsada) - Number(!!a.impulsada))
  ), [initialOfertas, hoy, ahora]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    initial.forEach((business: any) => counts.set(business.category, (counts.get(business.category) || 0) + 1));
    return counts;
  }, [initial]);

  const filteredBusinesses = useMemo(() => {
    const list = cat ? initial.filter((business: any) => business.category === cat) : initial;
    return [...list].sort((a: any, b: any) => Number(!!b.destacado) - Number(!!a.destacado));
  }, [initial, cat]);

  const urgentOffers = ofertas.filter((offer) => offer.vence && daysTo(offer.vence) <= 1);
  const ofertasVisibles = ofertas.filter((offer) => {
    if (modo === "ahora") return offer.businessOpen === true;
    if (modo === "esta-noche") return !offer.vence || daysTo(offer.vence) >= 0;
    return true;
  });
  // Las más urgentes primero: vencen antes y, a igualdad, mayor descuento.
  const ofertasBomba = useMemo(() =>
    ofertasVisibles
      .filter((o): o is Oferta & { vence: string } => !!o.vence)
      .sort((a, b) => daysTo(a.vence) - daysTo(b.vence) || (b.descuento || 0) - (a.descuento || 0))
      .slice(0, 5),
  [ofertasVisibles]);
  const verifiedBusinesses = initial.filter((business: any) => business.status === "verificado").length;
  const irABuscar = (term: string) => router.push(`/buscar?q=${encodeURIComponent(term)}`);

  return (
    <main className="bg-[var(--bg)] text-[var(--text)]">
      <Hero
        onSearch={irABuscar}
        stats={{ promos: ofertasVisibles.length, negocios: initial.length, pronto: urgentOffers.length }}
      />

      <OfertasBomba ofertas={ofertasBomba} />

      {/* ── Voto del día: competencia diaria real entre ofertas (ya
          existía en el código, nunca se había montado en ninguna página).
          Un voto por vecino por día, ranking en vivo, la oferta líder
          avisa al comercio. Esto SÍ es la competitividad que pediste,
          con datos reales de punta a punta. ── */}
      <VotoDelDia />

      {/* ── Rubros ── */}
      <section className="border-b border-[var(--line)] px-4 py-14 sm:px-6 md:py-20" aria-labelledby="categorias-title">
        <div className="mx-auto max-w-[1700px]">
          <SectionHead
            eyebrow="Explorá por rubro"
            title={<>Lo que buscás,<br /><span className="text-[var(--accent)]">cerca.</span></>}
            action={
              <Link href="/negocios" className="hidden items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)] sm:inline-flex" style={{ fontFamily: "var(--font-display)" }}>
                Ver directorio <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/negocios?cat=${category.id}`}
                className="card-lift group flex min-h-32 flex-col justify-between rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-4 hover:border-[var(--accent)]"
              >
                <span className="text-3xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" aria-hidden="true">{category.icon}</span>
                <span className="mt-6 text-sm font-black uppercase tracking-wide text-[var(--text)]" style={{ fontFamily: "var(--font-display)" }}>{category.name}</span>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>
                  {categoryCounts.get(category.id) || 0} {categoryCounts.get(category.id) === 1 ? "negocio" : "negocios"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Colecciones counts={categoryCounts} />

      {/* ── Ofertas ── */}
      <section id="ofertas" className="px-4 py-14 sm:px-6 md:py-20" aria-labelledby="ofertas-title">
        <div className="mx-auto max-w-[1700px]">
          <SectionHead
            eyebrow="Promociones vigentes"
            title={
              modo === "ahora" ? <>Abierto <span className="text-[var(--accent)]">ahora.</span></>
              : modo === "esta-noche" ? <>Para <span className="text-[var(--accent)]">esta noche.</span></>
              : <>Ofertas <span className="text-[var(--accent)]">de hoy.</span></>
            }
            sub="Precios publicados por comercios locales. Revisá la vigencia antes de acercarte."
            action={
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/para-vos" className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Para vos ✨
                </Link>
                <Link href="/promociones" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
                  Ver todas <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            }
          />
          <div className="mb-6 flex gap-2 overflow-x-auto pb-1 custom-scrollbar" role="group" aria-label="Filtrar ofertas por momento">
            {([
              ["todo", "Todo"],
              ["ahora", "Ahora"],
              ["esta-noche", "Esta noche"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setModo(value)}
                className={`rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                  modo === value
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line-strong)] bg-transparent text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
                }`}
                style={{ fontFamily: "var(--font-display)" }}>
                {label}
              </button>
            ))}
          </div>
          {ofertasVisibles.length > 0 ? (
            <div className="sld-no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {ofertasVisibles.slice(0, 8).map((offer) => (
                <div key={offer.id} className="w-[19rem] shrink-0 sm:w-auto">
                  <OfferCard o={offer} userCoords={coords} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8">
              <p className="font-display text-xl uppercase tracking-wide text-[var(--text)]">{modo === "ahora" ? "No hay ofertas de negocios abiertos ahora." : "Todavía no hay ofertas activas para este momento."}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Probá otro momento o revisá todas las ofertas vigentes.</p>
              <Link href="/para-negocios" className="btn-hard mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                Publicar una oferta <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Directorio ── */}
      <section className="border-y border-[var(--line)] bg-[#121011] px-4 py-14 sm:px-6 md:py-20" aria-labelledby="comercios-title">
        <div className="mx-auto max-w-[1700px]">
          <SectionHead
            eyebrow="Directorio local"
            title={<>Comercios <span className="text-[var(--accent)]">destacados.</span></>}
            sub="Negocios con información pública para que elijas dónde comprar."
            action={
              <Link href="/negocios" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 transition hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
                Explorar directorio <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {initial.length > 0 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              <button type="button" onClick={() => setCat(null)}
                className={`shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                  !cat ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                }`} style={{ fontFamily: "var(--font-display)" }}>Todos</button>
              {CATEGORIES.filter((category) => categoryCounts.has(category.id)).slice(0, 8).map((category) => (
                <button key={category.id} type="button" onClick={() => setCat(cat === category.id ? null : category.id)}
                  className={`shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                    cat === category.id ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                  }`} style={{ fontFamily: "var(--font-display)" }}>
                  {category.name}
                </button>
              ))}
            </div>
          )}
          <Featured list={filteredBusinesses} title="" userCoords={coords} />
        </div>
      </section>

      {/* ── Espacio publicitario ── */}
      <section className="bg-[#121011] px-4 pb-14 sm:px-6 md:pb-20" aria-label="Promoción para comercios">
        <div className="mx-auto max-w-[1700px]">
          <div className="sld-sponsored grid gap-6 rounded-[2.5rem] p-7 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
                <Megaphone className="h-4 w-4" /> Espacio publicitario · disponible
              </div>
              <h2 className="mt-4 max-w-2xl font-display text-3xl uppercase leading-[0.92] tracking-tight text-[var(--text)] sm:text-5xl">Hacé que tu negocio aparezca donde tus vecinos buscan.</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#c7b8a4]">Publicá tu negocio gratis o conocé opciones de promoción. Las campañas pagas se identifican claramente.</p>
            </div>
            <Link href="/planes" className="btn-hard inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-4 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Ver planes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sumate ── */}
      <section className="px-4 py-14 sm:px-6 md:py-24" aria-labelledby="sumate-title">
        <div className="mx-auto grid max-w-[1700px] gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Una ciudad que se encuentra</p>
            <h2 id="sumate-title" className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight text-[var(--text)] sm:text-6xl md:text-7xl">La guía local se construye <span className="knockout-text magenta-glow">entre todos.</span></h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)]">La cantidad que ves acá refleja los datos disponibles hoy. No usamos testimonios ni métricas inventadas: descubrí, contactá y compartí negocios reales.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/registro" className="btn-hard inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}><Search className="h-4 w-4" /> Crear cuenta</Link>
              <Link href="/para-negocios" className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}><Store className="h-4 w-4" /> Publicar negocio</Link>
            </div>
          </div>
          <div className="lg:border-l lg:border-[var(--line-strong)] lg:pl-12">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Datos de esta página</p>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-10">
              {[
                { v: initial.length, l: "negocios publicados" },
                { v: ofertas.length, l: "ofertas activas" },
                { v: categoryCounts.size, l: "rubros con presencia" },
                { v: verifiedBusinesses, l: "negocios verificados" },
              ].map((s) => (
                <div key={s.l}>
                  <strong className="magenta-glow block font-display text-4xl leading-none tabular-nums text-[var(--text)] md:text-5xl">{s.v}</strong>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Planes ── */}
      <section className="border-t border-[var(--line)] bg-[#121011] px-4 py-14 sm:px-6 md:py-20" aria-labelledby="planes-title">
        <div className="mx-auto max-w-[1700px]">
          <SectionHead
            eyebrow="Para comercios"
            title={<>Empezá simple. <span className="text-[var(--accent)]">Crecé cuando quieras.</span></>}
            action={
              <Link href="/planes" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 transition hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
                Comparar planes <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
            {(["gratis", "profesional", "premium"] as const).map((key) => {
              const plan = PLANES[key];
              const featured = key === "premium";
              return (
                <Link key={key} href="/planes"
                  className={`card-lift relative overflow-hidden rounded-[2rem] border p-7 ${featured ? "pricing-card border-[var(--accent)]/60 bg-gradient-to-br from-[var(--accent)]/[.12] to-transparent" : "border-[var(--line)] bg-[var(--surface)]"}`}>
                  {featured && (
                    <span className="absolute right-5 top-5 animate-pulse rounded-lg bg-[var(--accent)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>Top</span>
                  )}
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>{key === "gratis" ? "Para empezar" : key === "premium" ? "Mayor exposición" : "Para crecer"}</p>
                  <h3 className="mt-3 font-display text-2xl uppercase tracking-tight text-[var(--text)]">{plan.name}</h3>
                  <p className="mt-6 font-display text-5xl leading-none text-[var(--accent)]">{plan.precioARS ? `$${plan.precioARS.toLocaleString("es-AR")}` : "Gratis"}{plan.precioARS > 0 && <span className="ml-1 text-sm font-bold text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>/mes</span>}</p>
                  <ul className="mt-6 space-y-2.5 border-t border-[var(--line)] pt-5 text-sm font-semibold text-[var(--muted)]">
                    {planFeatures[key].map((feature) => <li key={feature} className="flex items-center gap-2"><span className="text-[var(--ok)]">✓</span> {feature}</li>)}
                  </ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
