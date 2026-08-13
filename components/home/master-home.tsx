"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BUSINESSES, CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import CercaTuyo from "./cerca-tuyo";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=900&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=90";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

type Oferta = {
  id: string;
  negocio: string;
  slug: string;
  producto: string;
  cat: string;
  vence?: string;
  descuento?: number;
  discountTxt?: string;
  antes?: number;
  ahora?: number;
  real?: boolean;
  portada_url?: string;
  logo_url?: string;
};

const DEMO_OFFERS: Oferta[] = [
  { id: "o1", negocio: "Almendra Calzados", slug: "almendra-calzados", producto: "Sandalias de taco ART 06", antes: 45000, ahora: 32000, descuento: 29, cat: "calzado", vence: "2026-08-16" },
  { id: "o2", negocio: "Café La Esquina", slug: "cafe-central", producto: "2x1 en latte de especialidad", antes: 7600, ahora: 3800, descuento: 50, cat: "gastronomia", vence: "2026-08-13" },
  { id: "o3", negocio: "Ferretería San Martín", slug: "ferreteria-san-lorenzo", producto: "Taladro percutor 650W", antes: 58000, ahora: 46400, descuento: 20, cat: "ferreteria", vence: "2026-08-18" },
  { id: "o4", negocio: "Barbería Centro", slug: "barberia-estilo", producto: "Corte + barba", antes: 11000, ahora: 8800, descuento: 20, cat: "belleza", vence: "2026-08-15" },
];

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

function venceTxt(expires?: string) {
  if (!expires) return "⚡ Oferta";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(expires + "T00:00:00");
  const d = Math.round((f.getTime() - hoy.getTime()) / 86400000);
  if (d < 0) return "Hoy último día";
  if (d === 0) return "⏰ Vence HOY";
  if (d === 1) return "Vence mañana";
  return `En ${d} días`;
}

export default function MasterHome() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [ofertas, setOfertas] = useState<Oferta[]>(DEMO_OFFERS);
  const [hayReales, setHayReales] = useState(false);

  /* Registrar PWA */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  /* Cargar ofertas REALES de Supabase (publicadas desde el panel) */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase()
          .from("businesses")
          .select("name, slug, category, promotions, portada_url, logo_url");
        if (!data) return;
        const hoy = new Date().toISOString().slice(0, 10);
        const reales: Oferta[] = (data as any[]).flatMap((b) =>
          (Array.isArray(b.promotions) ? b.promotions : [])
            .filter((p: any) => p && p.title && (!p.expires || p.expires >= hoy))
            .map((p: any, i: number) => ({
              id: b.slug + "-promo-" + i,
              negocio: b.name,
              slug: b.slug,
              producto: p.title,
              cat: b.category || "",
              vence: p.expires,
              discountTxt: p.discount,
              real: true,
              portada_url: b.portada_url,
              logo_url: b.logo_url,
            }))
        );
        if (reales.length > 0) {
          setOfertas(reales);
          setHayReales(true);
        }
      } catch (e) {
        console.error("No se pudieron cargar ofertas reales:", e);
      }
    })();
  }, []);

  const buscar = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/negocios" + (q.trim() ? "?q=" + encodeURIComponent(q.trim()) : ""));
  };

  return (
    <main className="bg-[#0d0a12] text-white">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#0d0a12]" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 text-center">
          <span className="inline-block rounded-full border border-orange-400/50 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
            🛍️ San Lorenzo · Santa Fe
          </span>
          <h1 className="mt-6 text-4xl font-black leading-tight md:text-7xl">
            LA GRAN{" "}
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              BARATA
            </span>
            <br />
            DIGITAL
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/70 md:text-lg">
            Todas las ofertas, promociones y negocios de San Lorenzo en un solo lugar.
          </p>

          <form
            onSubmit={buscar}
            className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-md"
          >
            <span className="pl-3 text-xl">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="¿Qué estás buscando hoy?"
              className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-white/50 md:text-base"
            />
            <button className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-bold hover:opacity-90 md:px-8">
              Buscar
            </button>
          </form>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
            {["zapatillas", "pizza", "peluquería", "ferretería", "ofertas"].map((s) => (
              <button
                key={s}
                onClick={() => router.push("/negocios?q=" + encodeURIComponent(s))}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/70 hover:border-orange-400 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORÍAS ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">Explorá</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">¿Qué estás buscando?</h2>
          </div>
          <Link href="/negocios" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
            Ver todo →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = BUSINESSES.filter((b) => b.category === c.id).length;
            return (
              <Link
                key={c.id}
                href={"/negocios?cat=" + c.id}
                className="group relative h-36 overflow-hidden rounded-2xl border border-white/10 md:h-44"
              >
                <img
                  src={CATEGORY_IMAGES[c.id] || FALLBACK_IMAGE}
                  alt={c.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-lg font-bold">{c.icon} {c.name}</p>
                  <p className="text-xs text-white/60">
                    {count} {count === 1 ? "negocio" : "negocios"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ============ 🔥 LA GRAN BARATA ============ */}
      <section className="border-y border-white/10 bg-gradient-to-b from-[#1a0d12] to-[#0d0a12] py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">🔥 Ofertas del momento</p>
              <h2 className="mt-1 text-2xl font-black md:text-3xl">La Gran Barata</h2>
            </div>
            <span className="rounded-full bg-red-500/15 border border-red-400/40 px-3 py-1 text-xs font-bold text-red-300">
              {hayReales ? "🟢 Publicadas por comercios" : "Vencen pronto ⏰"}
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ofertas.map((o) => (
              <Link
                key={o.id}
                href={"/negocio/" + o.slug}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60"
              >
                <div className="relative h-32">
                  <img
                    src={o.portada_url || CATEGORY_IMAGES[o.cat] || FALLBACK_IMAGE}
                    alt={o.producto}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <span className="absolute left-3 top-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-sm font-black">
                    {o.descuento ? `-${o.descuento}%` : o.discountTxt || "OFERTA"}
                  </span>
                  <span className="absolute right-3 top-3 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-bold text-orange-300">
                    {venceTxt(o.vence)}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold leading-snug">{o.producto}</p>
                  <p className="mt-1 text-xs text-white/50">{o.negocio}</p>
                  {o.ahora ? (
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-xs text-white/40 line-through">{fmt(o.antes!)}</span>
                      <span className="text-lg font-black text-orange-400">{fmt(o.ahora)}</span>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs font-bold text-orange-400">Ver en el negocio →</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DESTACADOS ============ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">⭐ Recomendados</p>
            <h2 className="mt-1 text-2xl font-black md:text-3xl">Negocios destacados</h2>
          </div>
          <Link href="/mapa" className="text-sm font-semibold text-orange-400 hover:text-orange-300">
            Ver en el mapa →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUSINESSES.slice(0, 4).map((b) => (
            <Link
              key={b.id}
              href={"/negocio/" + b.slug}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60"
            >
              <div className="relative h-32">
                <img
                  src={CATEGORY_IMAGES[b.category] || FALLBACK_IMAGE}
                  alt={b.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                {b.status === "verificado" && (
                  <span className="absolute left-3 top-3 rounded-lg bg-green-500/90 px-2 py-0.5 text-[10px] font-black">
                    ✓ VERIFICADO
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-bold">{b.name}</p>
                <p className="mt-0.5 text-xs capitalize text-white/50">{b.category}</p>
                <p className="mt-2 text-xs text-white/70">⭐ {b.rating.toFixed(1)} ({b.reviews})</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CercaTuyo />

      {/* ============ CTA ============ */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-600 via-red-500 to-pink-600 p-8 text-center md:p-14">
          <h2 className="text-2xl font-black md:text-4xl">¿Tenés un negocio en San Lorenzo?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/85 md:text-base">
            Publicá tus ofertas, productos y promociones en La Gran Barata Digital y conseguí más clientes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/para-negocios"
              className="rounded-xl bg-white px-6 py-3 text-sm font-black text-red-600 hover:bg-orange-100"
            >
              Quiero publicar mi negocio
            </Link>
            <Link
              href="/login"
              className="rounded-xl border-2 border-white/60 px-6 py-3 text-sm font-black hover:bg-white/10"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
