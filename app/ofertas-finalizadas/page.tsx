"use client";
import Link from "next/link";
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

export default function OfertasFinalizadasPage() {
  const todos = useAllBusinesses();
  const hoy = new Date().toISOString().slice(0, 10);

  const pasadas = todos.flatMap((b: any) =>
    (Array.isArray(b.promotions) ? b.promotions : [])
      .filter((p: any) => p.title && p.expires && p.expires < hoy)
      .map((p: any, i: number) => ({ ...p, negocio: b.name, slug: b.slug, cat: b.category, img: b.portada_url, id: b.slug + i }))
      .sort((a: any, b2: any) => (a.expires < b2.expires ? 1 : -1))
  );

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/promociones" className="text-sm text-orange-400 hover:text-orange-300">← Promociones activas</Link>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">😢 Ofertas que ya terminaron</h1>
        <p className="text-white/60 mt-1">Mirá lo que te perdiste... y seguí a tus negocios favoritos para no perderte la próxima.</p>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {pasadas.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <p className="text-5xl mb-4">🎉</p>
            <p className="font-bold">Todavía no hay ofertas finalizadas</p>
            <p className="text-sm mt-2">Las promociones vencidas van a aparecer acá.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pasadas.map((p: any) => (
              <Link key={p.id} href={"/negocio/" + p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 opacity-80 transition hover:opacity-100 hover:border-orange-400/60">
                <div className="relative h-32 grayscale">
                  <img src={p.img || CATEGORY_IMAGES[p.cat] || FALLBACK} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-lg bg-black/80 px-2.5 py-1 text-xs font-black text-red-300">😢 Terminó</span>
                </div>
                <div className="p-4">
                  <p className="font-bold leading-snug">{p.title}</p>
                  <p className="mt-1 text-xs text-white/50">{p.negocio}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-white/40">Venció el {p.expires.split("-").reverse().join("/")}</span>
                    <span className="text-xs font-bold text-orange-400">Seguir →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <h2 className="text-xl font-black">🔔 No te pierdas la próxima</h2>
          <p className="mt-2 text-sm text-white/60">Entrá a tus negocios favoritos y tocalés ⭐ Seguir. Las ofertas nuevas aparecen todos los días.</p>
          <Link href="/negocios" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
            Explorar negocios →
          </Link>
        </div>
      </div>
    </main>
  );
}
