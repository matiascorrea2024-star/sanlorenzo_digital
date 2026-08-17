"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import OfferCard from "@/components/ui/offer-card";
import { supabase } from "@/lib/supabase";
import { hoyArgentina } from "@/lib/fecha-ar";

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
  const [count, setCount] = useState(0);
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
      const { data } = await supabase().from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(200);
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  const [hoy] = useState(() => hoyArgentina());
  const activas = useMemo(
    () =>
      rows
        .filter((o) => !o.valid_until || o.valid_until >= hoy)
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
          precio_prometido: !!o.precio_prometido,
          latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
          longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
          rating: o.business_rating ? Number(o.business_rating) : undefined,
          verificado: o.business_status === "verificado",
          impulsada: !!(o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora),
        }))
        // Impulsadas primero -- lo que el negocio pagó por destacar hoy.
        .sort((a, b) => (b.impulsada ? 1 : 0) - (a.impulsada ? 1 : 0)),
    [rows, hoy, ahora]
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
      <section ref={heroRef} className="relative overflow-hidden border-b border-[var(--ov-05)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%, rgba(249,115,22,.22), transparent 60%), radial-gradient(circle at 85% 30%, rgba(220,38,38,.14), transparent 55%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>
                <span className="text-[11px] font-black uppercase tracking-widest text-red-300">Corriendo ahora</span>
              </div>
              <h1 className="text-5xl font-black leading-[0.95] tracking-tighter md:text-7xl" style={{ fontFamily: "var(--font-space)" }}>
                <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">La Gran</span>{" "}
                <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent animate-gradient">Barata</span>
              </h1>
            </div>
            <div className="shrink-0 rounded-[1.75rem] border border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-transparent p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--line)] bg-[var(--card-inner)] px-6 py-4 text-center backdrop-blur">
                <p className="tabular-nums text-4xl font-black text-orange-400 md:text-5xl" style={{ fontFamily: "var(--font-ticket)" }}>{count}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)]">oferta{count === 1 ? "" : "s"} activa{count === 1 ? "" : "s"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        {!loading && activas.length === 0 ? (
          <div className="sld-card rounded-3xl p-10 text-center">
            <p className="mt-3 text-xl font-black">No hay ofertas activas ahora</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Los negocios publican ofertas nuevas todos los días. Volvé a pasar más tarde.</p>
            <Link
              href="/dashboard/ofertas/nueva"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold hover:opacity-90"
            >
              Soy comercio: publicar oferta
            </Link>
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--ov-05)]" />
            ))}
          </div>
        ) : (
          <>
            {urgentes.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-red-300">
                    ⏰ Vencen hoy o mañana
                  </span>
                  <span className="text-sm font-bold text-[var(--muted2)]">corré antes de que se acaben</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {urgentes.map((o) => <OfferCard key={o.id} o={o} />)}
                </div>
              </div>
            )}
            {resto.length > 0 && (
              <div>
                {urgentes.length > 0 && (
                  <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-[var(--muted2)]">El resto de las ofertas</p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {resto.map((o) => <OfferCard key={o.id} o={o} />)}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-10 text-center">
          <Link href="/ofertas-finalizadas" className="text-sm text-[var(--muted)] transition hover:text-orange-300">
            Ver ofertas que ya terminaron →
          </Link>
        </div>
      </div>
    </main>
  );
}
