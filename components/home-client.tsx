"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Megaphone, Search, Store, Tag } from "lucide-react";
import Hero from "@/components/home/hero";
import Featured from "@/components/home/featured";
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

export default function HomeClient({ initial, initialOfertas }: { initial: Business[]; initialOfertas: Business[] }) {
  const router = useRouter();
  const [cat, setCat] = useState<string | null>(null);
  const [coords] = useState<{ lat: number; lon: number } | null>(null);
  const [hoy] = useState(() => hoyArgentina());
  const [ahora] = useState(() => Date.now());
  const [modo, setModo] = useState<"todo" | "ahora" | "esta-noche">("todo");

  const ofertas = useMemo<Oferta[]>(() => (
    (initialOfertas || [])
      .filter((o: Offer) => o.active && (!o.valid_until || o.valid_until >= hoy))
      .map((o: Offer) => ({
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
  const verifiedBusinesses = initial.filter((business: any) => business.status === "verificado").length;
  const irABuscar = (term: string) => router.push(`/buscar?q=${encodeURIComponent(term)}`);

  return (
    <main className="sld-home">
      <Hero
        onSearch={irABuscar}
        stats={{ promos: ofertasVisibles.length, negocios: initial.length, pronto: urgentOffers.length }}
      />

      <section className="sld-section-cream border-b border-[var(--line)] px-4 py-12 sm:px-6 md:py-16" aria-labelledby="categorias-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-4">
            <div>
              <p className="sld-eyebrow text-[var(--place)]">Explorá por rubro</p>
              <h2 id="categorias-title" className="sld-display mt-2 text-4xl sm:text-5xl">Lo que buscás, cerca.</h2>
            </div>
            <Link href="/negocios" className="hidden items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--accent)] sm:inline-flex">
              Ver directorio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {CATEGORIES.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/negocios?cat=${category.id}`}
                className="group flex min-h-28 flex-col justify-between border border-[var(--line)] bg-[var(--surface)] p-4 transition hover:-translate-y-1 hover:border-[var(--accent)] hover:shadow-[0_12px_24px_rgba(0,0,0,.14)]"
              >
                <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                <span className="mt-5 text-sm font-bold text-[var(--text)]">{category.name}</span>
                <span className="mt-1 text-xs text-[var(--muted2)]">
                  {categoryCounts.get(category.id) || 0} {categoryCounts.get(category.id) === 1 ? "negocio" : "negocios"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="ofertas" className="sld-section-cream px-4 pb-14 sm:px-6 md:pb-20" aria-labelledby="ofertas-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-3 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="sld-eyebrow text-[var(--accent)]">Promociones vigentes</p>
              <h2 id="ofertas-title" className="sld-display mt-2 text-4xl sm:text-5xl">
                {modo === "ahora" ? "Ahora, cerca." : modo === "esta-noche" ? "Para esta noche." : "Ofertas de hoy."}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                Precios publicados por comercios locales. Revisá la vigencia antes de acercarte.
              </p>
            </div>
            <Link href="/promociones" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--accent)]">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar ofertas por momento">
            {([
              ["todo", "Todo"],
              ["ahora", "Ahora"],
              ["esta-noche", "Esta noche"],
            ] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setModo(value)} className={`sld-filter-light ${modo === value ? "is-active" : ""}`}>
                {label}
              </button>
            ))}
          </div>
          {ofertasVisibles.length > 0 ? (
            <div className="sld-no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
              {ofertasVisibles.slice(0, 8).map((offer) => (
                <div key={offer.id} className="w-[18rem] shrink-0 sm:w-auto">
                  <OfferCard o={offer} userCoords={coords} />
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-7">
              <p className="font-bold text-[var(--text)]">{modo === "ahora" ? "No hay ofertas de negocios abiertos ahora." : "Todavía no hay ofertas activas para este momento."}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Probá otro momento o revisá todas las ofertas vigentes.</p>
              <Link href="/para-negocios" className="mt-5 inline-flex items-center gap-2 bg-[var(--accent)] px-4 py-3 text-sm font-black text-white hover:bg-[var(--accent2)]">
                Publicar una oferta <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="sld-section-dark border-y border-white/10 px-4 py-14 sm:px-6 md:py-20" aria-labelledby="comercios-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="sld-eyebrow text-[var(--place)]">Directorio local</p>
              <h2 id="comercios-title" className="sld-display mt-2 text-4xl text-[#f7f3ec] sm:text-5xl">Comercios destacados.</h2>
              <p className="mt-2 max-w-xl text-sm text-[#a99b86]">Negocios con información pública para que elijas dónde comprar.</p>
            </div>
            <Link href="/negocios" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--accent)]">
              Explorar directorio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {initial.length > 0 && (
            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              <button type="button" onClick={() => setCat(null)} className={`sld-filter ${!cat ? "is-active" : ""}`}>Todos</button>
              {CATEGORIES.filter((category) => categoryCounts.has(category.id)).slice(0, 8).map((category) => (
                <button key={category.id} type="button" onClick={() => setCat(cat === category.id ? null : category.id)} className={`sld-filter ${cat === category.id ? "is-active" : ""}`}>
                  {category.name}
                </button>
              ))}
            </div>
          )}
          <Featured list={filteredBusinesses} title="" userCoords={coords} />
        </div>
      </section>

      <section className="sld-section-dark px-4 pb-14 sm:px-6 md:pb-20" aria-label="Promoción para comercios">
        <div className="mx-auto max-w-7xl">
          <div className="sld-sponsored grid gap-6 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-[var(--accent)]">
                <Megaphone className="h-4 w-4" /> Espacio publicitario · disponible
              </div>
              <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight text-[#f7f3ec] sm:text-4xl">Hacé que tu negocio aparezca donde tus vecinos están buscando.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#c7b8a4]">Publicá tu negocio gratis o conocé opciones de promoción. Las campañas pagas se identifican claramente.</p>
            </div>
            <Link href="/planes" className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-black text-white hover:bg-[var(--accent2)]">
              Ver planes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="sld-section-cream px-4 py-14 sm:px-6 md:py-20" aria-labelledby="sumate-title">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
          <div>
            <p className="sld-eyebrow text-[var(--place)]">Una ciudad que se encuentra</p>
            <h2 id="sumate-title" className="sld-display mt-2 max-w-2xl text-4xl sm:text-6xl">La guía local se construye entre todos.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)]">La cantidad que ves arriba refleja los datos disponibles hoy. No usamos testimonios ni métricas inventadas: descubrí, contactá y compartí negocios reales.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/registro" className="inline-flex items-center gap-2 bg-[var(--text)] px-5 py-3 text-sm font-black text-[var(--bg)] hover:bg-[var(--accent)] hover:text-white"><Search className="h-4 w-4" /> Crear cuenta</Link>
              <Link href="/para-negocios" className="inline-flex items-center gap-2 border border-[var(--line-strong)] px-5 py-3 text-sm font-black text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)]"><Store className="h-4 w-4" /> Publicar negocio</Link>
            </div>
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <p className="sld-eyebrow text-[var(--muted2)]">Datos de esta página</p>
            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-7">
              <div><strong className="sld-display text-5xl text-[var(--text)]">{initial.length}</strong><p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted2)]">negocios publicados</p></div>
              <div><strong className="sld-display text-5xl text-[var(--text)]">{ofertas.length}</strong><p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted2)]">ofertas activas</p></div>
              <div><strong className="sld-display text-5xl text-[var(--text)]">{categoryCounts.size}</strong><p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted2)]">rubros con presencia</p></div>
              <div><strong className="sld-display text-5xl text-[var(--text)]">{verifiedBusinesses}</strong><p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted2)]">negocios verificados</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="sld-section-dark px-4 py-14 sm:px-6 md:py-20" aria-labelledby="planes-title">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="sld-eyebrow text-[var(--accent)]">Para comercios</p>
              <h2 id="planes-title" className="sld-display mt-2 text-4xl text-[var(--text)] sm:text-5xl">Empezá simple. Crecé cuando quieras.</h2>
            </div>
            <Link href="/planes" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text)] hover:text-[var(--accent)]">Comparar planes <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {(["gratis", "profesional", "premium"] as const).map((key) => {
              const plan = PLANES[key];
              return (
                <Link key={key} href="/planes" className={`border p-5 transition hover:-translate-y-1 ${key === "premium" ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-white/15 bg-white/[.04]"}`}>
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-[var(--muted)]">{key === "gratis" ? "Para empezar" : key === "premium" ? "Mayor exposición" : "Para crecer"}</p><h3 className="mt-2 text-xl font-black text-[var(--text)]">{plan.name}</h3></div><Tag className="h-5 w-5 text-[var(--accent)]" /></div>
                  <p className="mt-5 text-3xl font-black text-[var(--accent)]">{plan.precioARS ? `$${plan.precioARS.toLocaleString("es-AR")}` : "Gratis"}{plan.precioARS > 0 && <span className="ml-1 text-sm font-medium text-[var(--muted)]">/mes</span>}</p>
                  <ul className="mt-5 space-y-2 text-sm text-[var(--muted)]">{planFeatures[key].map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
