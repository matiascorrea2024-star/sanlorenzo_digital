"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2 } from "lucide-react";
import PageHero from "@/components/ui/page-hero";
import { useAllBusinesses } from "@/lib/use-businesses";

const CAT_IMG: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=800&q=80",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4f9c777189?auto=format&fit=crop&w=800&q=80",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
};
const FALLBACK = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80";

function Countdown({ expires }: { expires: string }) {
  const [left, setLeft] = useState("…");
  useEffect(() => {
    const tick = () => {
      const end = new Date(expires + "T23:59:59").getTime();
      const d = end - Date.now();
      if (d <= 0) { setLeft("Terminó"); return; }
      const days = Math.floor(d / 86400000);
      const h = Math.floor((d % 86400000) / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setLeft(days > 0
        ? `${days}d ${h}h ${m}m`
        : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expires]);
  return (
    <span className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 bg-red-500/15 px-2 py-1 text-[11px] font-black text-red-300 tabular-nums">
      ⏰ {left}
    </span>
  );
}

export default function PromocionesPage() {
  const todos = useAllBusinesses();
  const hoy = new Date().toISOString().slice(0, 10);

  const activas = todos.flatMap((b: any) =>
    (Array.isArray(b.promotions) ? b.promotions : [])
      .filter((p: any) => p.title && (!p.expires || p.expires >= hoy))
      .map((p: any, i: number) => ({ ...p, negocio: b.name, slug: b.slug, cat: b.category, portada: b.portada_url, id: b.slug + i }))
  );

  return (
    <main className="min-h-screen bg-[#120d09] pb-24 text-white">
      <PageHero
        title="Ofertas en este momento"
        subtitle={`${activas.length} promocion${activas.length === 1 ? "" : "es"} corriendo ahora en San Lorenzo`}
      >
        <Link href="/" className="mt-3 inline-block text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4">
        {activas.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.03] p-10 text-center">
            <p className="text-6xl">🕐</p>
            <h2 className="mt-3 text-xl font-black">No hay ofertas activas ahora</h2>
            <p className="mt-2 text-sm text-white/60">Los negocios publican ofertas nuevas todos los días. Volvete a pasar más tarde.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activas.map((p: any) => (
              <Link
                key={p.id}
                href={`/negocio/${p.slug}`}
                data-spot
                className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.02] transition duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-xl hover:shadow-orange-500/10"
              >
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={p.image_url || p.portada || CAT_IMG[String(p.cat || "").toLowerCase()] || FALLBACK}
                    alt={p.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#120d09] via-transparent to-transparent" />
                  {p.discount && (
                    <span className="absolute left-3 top-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-1 text-xs font-black text-white shadow-lg">
                      {p.discount}
                    </span>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-black leading-snug transition group-hover:text-orange-300">{p.title}</h3>
                  <p className="mt-1 text-xs capitalize text-white/50">🏪 {p.negocio} · {p.cat}</p>

                  {(p.price_before || p.price_offer) && (
                    <div className="mt-3 flex items-baseline gap-2">
                      {p.price_before && (
                        <span className="text-xs text-white/40 line-through">${Number(p.price_before).toLocaleString("es-AR")}</span>
                      )}
                      {p.price_offer && (
                        <span className="text-lg font-black text-emerald-300">${Number(p.price_offer).toLocaleString("es-AR")}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    {p.expires ? <Countdown expires={p.expires} /> : <span />}
                    <div className="flex items-center gap-2">
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const url = `https://sanlorenzodigital.vercel.app/negocio/${p.slug}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(`🔥 ${p.title} en ${p.negocio} — ${url}`)}`, "_blank");
                        }}
                        className="flex cursor-pointer items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-black text-emerald-300 transition hover:bg-emerald-500/20"
                      >
                        <Share2 className="h-3 w-3" /> Compartir
                      </span>
                      <span className="text-xs font-bold text-orange-400 opacity-0 transition group-hover:opacity-100">Ver →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/ofertas-finalizadas" className="text-sm text-white/50 transition hover:text-orange-300">
            😢 Ver ofertas que ya terminaron →
          </Link>
        </div>
      </div>
    </main>
  );
}
