"use client";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import NotifyMeButton from "@/components/offers/notify-me-button";
import { useAllBusinesses } from "@/lib/use-businesses";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4f9c777189?auto=format&fit=crop&w=900&q=85",
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
    <main className="bg-[#120d09] text-white min-h-screen pb-24">
      <PageHero
        title="😢 Ofertas que ya terminaron"
        subtitle="Mirá lo que te perdiste... y seguí a tus negocios favoritos para no perderte la próxima."
      >
        <Link href="/promociones" className="mt-3 inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300">← Ver promociones activas</Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4">
        {pasadas.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.03] p-10 text-center">
            <p className="text-6xl">🎉</p>
            <h2 className="mt-3 text-xl font-black">Todavía no hay ofertas finalizadas</h2>
            <p className="mt-2 text-sm text-white/60">Las promociones vencidas van a aparecer acá cuando pasen su fecha.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pasadas.map((p: any) => (
              <Link key={p.id} href={"/negocio/" + p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.03] opacity-85 transition hover:opacity-100 hover:border-orange-400/60 hover:shadow-xl hover:shadow-orange-500/10">
                <div className="relative h-28 overflow-hidden grayscale group-hover:grayscale-0 transition duration-500">
                  <img src={p.img || CATEGORY_IMAGES[p.cat] || FALLBACK} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute left-2 top-2 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-red-300 backdrop-blur">
                    <span>😢</span>
                    <span>Terminó</span>
                  </div>
                  {p.discount && (
                    <div className="absolute right-2 top-2 rounded-lg bg-red-500/90 px-2 py-1 text-[10px] font-black text-white backdrop-blur">
                      {p.discount}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-orange-300 transition">{p.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs capitalize text-white/50">{p.negocio} · {p.cat}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
                    <span className="text-[10px] text-white/40">
                      📅 {new Date(p.expires).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </span>
                    <div onClick={(e) => e.preventDefault()}>
                      <NotifyMeButton businessId={p.businessId} productName={p.title} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <div className="mx-auto max-w-xl">
            <p className="text-3xl">🔔</p>
            <h2 className="mt-3 text-xl font-black">No te pierdas la próxima</h2>
            <p className="mt-2 text-sm text-white/70">Entrá a tus negocios favoritos y tocales ⭐ Seguir. Las ofertas nuevas aparecen todos los días.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/negocios" className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black hover:opacity-90 transition">
                Explorar negocios →
              </Link>
              <Link href="/ranking" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold hover:bg-white/5 transition">
                Ver ranking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
