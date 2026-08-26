"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import NotifyMeButton from "@/components/offers/notify-me-button";
import { supabase } from "@/lib/supabase";
import CategoryCover from "@/components/ui/category-cover";
import { hoyArgentina } from "@/lib/fecha-ar";

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
  const [hoy] = useState(() => hoyArgentina());

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
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%, rgba(209,47,104,.14), transparent 60%), radial-gradient(circle at 85% 30%, rgba(169,31,85,.08), transparent 55%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)]">← Volver al inicio</Link>
          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>La Gran Barata</p>
          <h1 className="mt-3 font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-7xl">
            Ofertas que ya <span className="knockout-text magenta-glow">terminaron</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-[var(--muted)]">Mirá lo que te perdiste... y seguí a tus negocios favoritos para no perderte la próxima.</p>
          <Link href="/promociones" className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-[var(--accent)] transition hover:text-white">← Ver promociones activas</Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        {!loading && pasadas.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center md:p-10">
            <p className="font-display text-xl uppercase tracking-tight">Todavía no hay ofertas finalizadas</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Las promociones vencidas van a aparecer acá cuando pasen su fecha.</p>
          </div>
        ) : loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-52 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />)}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pasadas.map((p) => (
              <Link key={p.id} href={"/negocio/" + p.slug} className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                <div className="relative h-28 overflow-hidden grayscale transition duration-500 group-hover:grayscale-0">
                  {p.img ? (
                    <Image src={p.img} alt={p.title} fill sizes="(max-width: 768px) 50vw, 280px" quality={80} className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <CategoryCover category={p.cat} seed={p.id} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute left-2 top-2 rounded-xl bg-black/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)] backdrop-blur">
                    Terminó
                  </div>
                  {p.discount && (
                    <div className="absolute right-2 top-2 rounded-xl px-3.5 py-1.5 text-[12px] font-black uppercase tracking-widest text-white shadow-2xl" style={{ background: "var(--accent)" }}>
                      {p.discount}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="line-clamp-2 text-sm font-bold leading-snug transition group-hover:text-[var(--accent)]">{p.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs capitalize text-[var(--muted)]">{p.negocio} · {p.cat}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-2">
                    <span className="text-[10px] text-[var(--muted2)]">
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

        <div className="mt-10 rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-r from-[var(--accent)]/[.08] to-transparent p-1.5">
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="font-display text-2xl uppercase tracking-tight">No te pierdas la <span className="text-[var(--accent)]">próxima</span></h2>
            <p className="mt-2 text-sm text-[var(--muted)]">Entrá a tus negocios favoritos y seguilos. Las ofertas nuevas aparecen todos los días.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/negocios" className="btn-hard rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                Explorar negocios →
              </Link>
              <Link href="/ranking" className="rounded-xl border border-[var(--line-strong)] px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white">
                Ver ranking
              </Link>
            </div>
          </div>
          </div>
        </div>
      </div>
    </main>
  );
}
