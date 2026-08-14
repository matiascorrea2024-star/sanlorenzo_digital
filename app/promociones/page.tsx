"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import { useAllBusinesses } from "@/lib/use-businesses";

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
const FALLBACK = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function countdown(p: any, now: number): string | null {
  const end = p.expires_at ? new Date(p.expires_at).getTime() : p.expires ? new Date(p.expires + "T23:59:59").getTime() : null;
  if (!end) return null;
  const diff = end - now;
  if (diff <= 0) return "Terminó";
  const d = Math.floor(diff / 86400000);
  if (d >= 1) return `Termina en ${d} día${d > 1 ? "s" : ""}`;
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `⏰ ${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function PromocionesPage() {
  const todos = useAllBusinesses();
  const now = useNow();

  const promos = todos.flatMap((b: any) =>
    (Array.isArray(b.promotions) ? b.promotions : [])
      .filter((p: any) => {
        if (!p.title) return false;
        if (p.expires_at) return new Date(p.expires_at).getTime() > now;
        if (p.expires) return p.expires >= new Date(now).toISOString().slice(0, 10);
        return true;
      })
      .map((p: any, i: number) => ({
        ...p,
        negocio: b.name,
        slug: b.slug,
        cat: b.category,
        img: b.portada_url,
        id: b.slug + "-" + i,
      }))
  );

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-24">
      <PageHero title="🔥 Ofertas en este momento" subtitle={<>{promos.length} promociones corriendo ahora en San Lorenzo</>} />

      <div className="mx-auto max-w-6xl px-4">
        {promos.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <p className="text-5xl mb-4">🔥</p>
            <p className="font-bold">No hay promociones activas en este momento</p>
            <p className="text-sm mt-2">Los comercios suben ofertas relámpago todos los días. Volvete a meter en un rato.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p: any) => {
              const cd = countdown(p, now);
              return (
                <Link key={p.id} href={"/negocio/" + p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60">
                  <div className="relative h-36">
                    <img src={p.img || CATEGORY_IMAGES[p.cat] || FALLBACK} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    {p.discount && (
                      <span className="absolute left-3 top-3 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 text-sm font-black">{p.discount}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold leading-snug">{p.title}</p>
                    <p className="mt-1 text-xs text-white/50">{p.negocio}</p>
                    <div className="mt-3 flex items-center justify-between">
                      {cd ? (
                        <span className={`rounded-lg px-2 py-1 text-xs font-black ${cd.includes(":") ? "bg-red-500/20 text-red-300 animate-pulse" : "bg-yellow-500/15 text-yellow-300"}`}>
                          {cd}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">Sin vencimiento</span>
                      )}
                      <span className="text-xs font-bold text-orange-400">Ver →</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/ofertas-finalizadas" className="text-sm text-white/50 hover:text-orange-400">
            😢 Ver ofertas que ya terminaron →
          </Link>
        </div>
      </div>
    </main>
  );
}
