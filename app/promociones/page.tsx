"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import OfferCard from "@/components/ui/offer-card";
import { supabase } from "@/lib/supabase";
import { hoyArgentina } from "@/lib/fecha-ar";
import { CATEGORIES } from "@/lib/data";
import { ExpandableFilterGroup, FilterGroup, CheckRow, RadioRow } from "@/components/ui/filter-sidebar";
import CategoryCover from "@/components/ui/category-cover";
import Image from "next/image";

type Row = {
  id: string;
  business_name: string;
  business_slug: string;
  business_category: string;
  title: string;
  valid_until?: string;
  discount_percent?: number;
  old_price?: number;
  offer_price?: number;
  active: boolean;
  business_portada?: string;
  business_logo?: string;
  created_at: string;
  precio_prometido?: boolean;
  business_latitude?: number;
  business_longitude?: number;
  business_destacado?: boolean;
  business_rating?: number;
  business_status?: string;
  impulsada_hasta?: string;
};

function diasA(vence?: string) {
  if (!vence) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const f = new Date(vence + "T00:00:00");
  return Math.round((f.getTime() - hoy.getTime()) / 86400000);
}

export default function PromocionesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [cats, setCats] = useState<string[]>([]);
  const [minDiscount, setMinDiscount] = useState(0);
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [soloDestacados, setSoloDestacados] = useState(false);
  const [soloUrgentes, setSoloUrgentes] = useState(false);
  const [recomendados, setRecomendados] = useState<any[]>([]);
  const toggleCat = (id: string) => setCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const heroRef = useRef<HTMLDivElement>(null);
  // Snapshot de "ahora" tomado una sola vez (no en cada render) para
  // no llamar Date.now() de forma impura durante el cálculo de impulsada.
  const [ahora] = useState(() => Date.now());

  useEffect(() => {
    (async () => {
      // Misma fuente real que la Home y el resto del sitio (la vista ya
      // filtra active=true) -- antes esta página leía businesses.promotions,
      // un campo JSON legacy que nadie escribe desde que existe la tabla
      // offers: las ofertas que publican los comercios nunca llegaban acá.
      const { data, error: queryError } = await supabase().from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(200);
      if (queryError) setError("No pudimos cargar las ofertas. Revisá tu conexión e intentá de nuevo.");
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
    // Recomendados: negocios mejor valorados, para que la pantalla nunca
    // quede "seca" -- descubrimiento cruzado más allá de solo ofertas.
    supabase().from("businesses").select("id, name, slug, category, portada_url, logo_url, rating, reviews")
      .in("status", ["verificado", "reclamado"]).eq("activo", true).gt("rating", 0)
      .order("rating", { ascending: false }).limit(4)
      .then(({ data }) => setRecomendados(data || []));
  }, []);

  const [hoy] = useState(() => hoyArgentina());
  const activas = useMemo(
    () =>
      rows
        .filter((o) => (!o.valid_until || o.valid_until >= hoy)
          && (cats.length === 0 || cats.includes(o.business_category))
          && (!minDiscount || Number(o.discount_percent || 0) >= minDiscount)
          && (!precioMin || !o.offer_price || Number(o.offer_price) >= Number(precioMin))
          && (!precioMax || !o.offer_price || Number(o.offer_price) <= Number(precioMax))
          && (!soloVerificados || o.business_status === "verificado")
          && (!soloDestacados || o.business_destacado)
          && (!soloUrgentes || (diasA(o.valid_until) !== null && (diasA(o.valid_until) as number) <= 1)))
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
          portada_url: o.business_portada,
          logo_url: o.business_logo,
          creado: o.created_at,
          precio_prometido: !!o.precio_prometido,
          latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
          longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
          rating: o.business_rating ? Number(o.business_rating) : undefined,
          verificado: o.business_status === "verificado",
          impulsada: !!(o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora),
        }))
        // Impulsadas primero -- lo que el negocio pagó por destacar hoy.
        .sort((a, b) => (b.impulsada ? 1 : 0) - (a.impulsada ? 1 : 0)),
    [rows, hoy, ahora, cats, minDiscount, precioMin, precioMax, soloVerificados, soloDestacados, soloUrgentes]
  );

  const urgentes = useMemo(() => activas.filter((o) => { const d = diasA(o.vence); return d !== null && d <= 1; }), [activas]);
  const resto = useMemo(() => activas.filter((o) => !urgentes.includes(o)), [activas, urgentes]);

  // Contador que sube en vivo hasta la cantidad real -- nada de "0" estático
  // mientras carga, y nada inventado: apenas hay datos reales, cuenta hasta ahí.
  useGSAP(() => {
    if (loading) return;
    const obj = { n: 0 };
    gsap.to(obj, {
      n: activas.length, duration: 1.1, ease: "power2.out",
      onUpdate: () => setCount(Math.round(obj.n)),
    });
  }, { dependencies: [loading, activas.length] });

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Header propio del evento "Gran Barata" -- no el PageHero genérico
          del resto del sitio: acá la energía/urgencia es el punto. */}
      <section ref={heroRef} className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%, rgba(209,47,104,.16), transparent 60%), radial-gradient(circle at 85% 30%, rgba(169,31,85,.10), transparent 55%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent-ink)]">← Volver al inicio</Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-1.5">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" /></span>
                <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>Corriendo ahora</span>
              </div>
              <h1 className="font-display text-3xl leading-[0.95] tracking-tight sm:text-4xl">
                <span>La Gran</span>{" "}
                <span className="knockout-text magenta-glow">Barata</span>
              </h1>
            </div>
            <div className="shrink-0 rounded-2xl border border-[var(--accent)]/25 bg-[var(--surface)] p-1.5 shadow-[0_0_40px_rgba(209,47,104,0.08)]">
              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-5 py-3 text-center">
                <p className="tabular-nums font-display text-2xl text-[var(--accent-ink)] sm:text-3xl">{count}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)]">oferta{count === 1 ? "" : "s"} activa{count === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-[1500px] items-start gap-8 px-4 pt-8">
        {/* ── Sidebar de filtros, mismo patrón que /negocios ── */}
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <ExpandableFilterGroup title="Rubro" items={CATEGORIES} selected={cats} onToggle={toggleCat} visibleCount={8} />
          <FilterGroup title="Precio">
            <div className="flex items-center gap-2">
              <input type="number" min={0} inputMode="numeric" value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} placeholder="Mín."
                className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--ov-05)] px-2 py-1.5 text-xs outline-none focus:border-[var(--accent)]" />
              <span className="text-xs text-[var(--muted2)]">—</span>
              <input type="number" min={0} inputMode="numeric" value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} placeholder="Máx."
                className="w-full rounded-lg border border-[var(--line-strong)] bg-[var(--ov-05)] px-2 py-1.5 text-xs outline-none focus:border-[var(--accent)]" />
            </div>
            {(precioMin || precioMax) && (
              <button onClick={() => { setPrecioMin(""); setPrecioMax(""); }} className="text-xs font-bold text-[var(--accent-ink)] hover:underline">Limpiar precio</button>
            )}
          </FilterGroup>
          <FilterGroup title="Descuento mínimo">
            {[{ v: 0, l: "Cualquiera" }, { v: 10, l: "10% o más" }, { v: 20, l: "20% o más" }, { v: 30, l: "30% o más" }].map((o) => (
              <RadioRow key={o.v} name="descuento" checked={minDiscount === o.v} onChange={() => setMinDiscount(o.v)} label={o.l} />
            ))}
          </FilterGroup>
          <FilterGroup title="Filtrar">
            <CheckRow checked={soloUrgentes} onChange={() => setSoloUrgentes((v) => !v)} label="Vencen hoy o mañana" />
            <CheckRow checked={soloVerificados} onChange={() => setSoloVerificados((v) => !v)} label="Solo verificados" />
            <CheckRow checked={soloDestacados} onChange={() => setSoloDestacados((v) => !v)} label="Solo destacados" />
          </FilterGroup>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Chips de rubro para mobile (sin sidebar ahí) */}
          <div className="custom-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => toggleCat(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${cats.includes(c.id) ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)]"}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {error && <div role="alert" className="mb-6 rounded-xl border border-[var(--bad)]/30 bg-[var(--bad)]/10 px-4 py-3 text-sm text-[var(--bad)]">{error}</div>}
          {!loading && activas.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center md:p-10">
              <p className="font-display mt-3 text-xl uppercase tracking-tight">No hay ofertas activas ahora</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Los negocios publican ofertas nuevas todos los días. Volvé a pasar más tarde.</p>
              <Link
                href="/dashboard/ofertas/nueva"
                className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Soy comercio: publicar oferta
              </Link>
            </div>
          ) : loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
              ))}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-[var(--muted)]">{activas.length} {activas.length === 1 ? "oferta" : "ofertas"}</p>
              {urgentes.length > 0 && (
                <div className="mb-10">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[var(--accent-ink)]">
                      ⏰ Vencen hoy o mañana
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted2)]">corré antes de que se acaben</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {urgentes.map((o) => <OfferCard key={o.id} o={o} />)}
                  </div>
                </div>
              )}
              {resto.length > 0 && (
                <div>
                  {urgentes.length > 0 && (
                    <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted2)]">El resto de las ofertas</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {resto.map((o) => <OfferCard key={o.id} o={o} />)}
                  </div>
                </div>
              )}
            </>
          )}

          {recomendados.length > 0 && (
            <div className="mt-12 border-t border-[var(--line)] pt-8">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[.2em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>Negocios mejor valorados para descubrir</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {recomendados.map((b: any) => (
                  <Link key={b.id} href={`/negocio/${b.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]/50">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      {b.portada_url ? (
                        <Image src={b.portada_url} alt={b.name} fill quality={80} sizes="56px" className="object-cover" />
                      ) : (
                        <CategoryCover category={b.category} seed={String(b.id || b.slug)} className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--text)] transition group-hover:text-[var(--accent-ink)]">{b.name}</p>
                      <p className="text-xs font-bold text-[var(--warn)]">★ {Number(b.rating).toFixed(1)} <span className="font-normal text-[var(--muted)]">({b.reviews || 0})</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 text-center">
            <Link href="/ofertas-finalizadas" className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent-ink)]">
              Ver ofertas que ya terminaron →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
