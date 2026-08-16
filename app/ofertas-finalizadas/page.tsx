"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/ui/page-hero";
import NotifyMeButton from "@/components/offers/notify-me-button";
import { supabase } from "@/lib/supabase";
import CategoryCover from "@/components/ui/category-cover";

type Row = {
  id: string;
  title: string;
  valid_until: string;
  discount_percent?: number;
  image_url?: string;
  businesses: { name: string; slug: string; category: string; portada_url?: string; id: string } | null;
};

export default function OfertasFinalizadasPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    (async () => {
      // Ofertas realmente vencidas (tabla offers real, no el campo JSON
      // legacy businesses.promotions) -- se consulta la tabla directa
      // (no la vista offers_with_business) porque esa vista solo muestra
      // active=true, y una oferta vencida puede haber quedado marcada
      // como inactiva.
      const { data } = await supabase()
        .from("offers")
        .select("id, title, valid_until, discount_percent, image_url, businesses(name, slug, category, portada_url, id)")
        .lt("valid_until", hoy)
        .order("valid_until", { ascending: false })
        .limit(100);
      setRows(((data as any[]) || []).filter((r) => r.businesses));
      setLoading(false);
    })();
  }, [hoy]);

  const pasadas = useMemo(
    () =>
      rows.map((o) => ({
        id: o.id,
        title: o.title,
        expires: o.valid_until,
        discount: o.discount_percent ? `-${o.discount_percent}%` : undefined,
        img: o.image_url || o.businesses?.portada_url,
        negocio: o.businesses?.name || "",
        slug: o.businesses?.slug || "",
        cat: o.businesses?.category || "",
        businessId: o.businesses?.id,
      })),
    [rows]
  );

  return (
    <main className="bg-[#120d09] text-white min-h-screen pb-24">
      <PageHero
        title="Ofertas que ya terminaron"
        subtitle="Mirá lo que te perdiste... y seguí a tus negocios favoritos para no perderte la próxima."
      >
        <Link href="/promociones" className="mt-3 inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300">← Ver promociones activas</Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4">
        {!loading && pasadas.length === 0 ? (
          <div className="sld-card rounded-3xl p-10 text-center">
            <p className="mt-3 text-xl font-black">Todavía no hay ofertas finalizadas</p>
            <p className="mt-2 text-sm text-white/60">Las promociones vencidas van a aparecer acá cuando pasen su fecha.</p>
          </div>
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pasadas.map((p) => (
              <Link key={p.id} href={"/negocio/" + p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.07] to-white/[.03] opacity-85 transition hover:opacity-100 hover:border-orange-400/60 hover:shadow-xl hover:shadow-orange-500/10">
                <div className="relative h-28 overflow-hidden grayscale group-hover:grayscale-0 transition duration-500">
                  {p.img ? (
                    <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <CategoryCover category={p.cat} seed={p.id} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-[10px] font-black text-red-300 backdrop-blur">
                    Terminó
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
                      {new Date(p.expires + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                    </span>
                    {p.businessId && (
                      <div onClick={(e) => e.preventDefault()}>
                        <NotifyMeButton businessId={p.businessId} productName={p.title} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 overflow-hidden rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-xl font-black">No te pierdas la próxima</h2>
            <p className="mt-2 text-sm text-white/70">Entrá a tus negocios favoritos y seguilos. Las ofertas nuevas aparecen todos los días.</p>
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
