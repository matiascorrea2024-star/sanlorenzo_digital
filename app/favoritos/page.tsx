"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Store, Flame, ArrowRight, Route } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import OfferCard from "@/components/ui/offer-card";
import RankedAvatar from "@/components/ui/ranked-avatar";

export default function FavoritosPage() {
  const { user } = useAuth();
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (user) {
        const { data } = await supabase().from("favorites")
          .select("*").eq("user_id", user.id);
        const favs = data || [];

        const bizIds = favs.filter(f => f.item_type === "business").map(f => f.item_id);
        const offerIds = favs.filter(f => f.item_type === "offer").map(f => f.item_id);

        if (bizIds.length) {
          const { data: biz } = await supabase().from("businesses").select("*").in("id", bizIds);
          setNegocios(biz || []);
        }
        if (offerIds.length) {
          const { data: offs } = await supabase().from("offers_with_business").select("*").in("id", offerIds);
          setOfertas((offs || []).map((o: any) => ({
            id: o.id, negocio: o.business_name, slug: o.business_slug,
            producto: o.title, cat: o.business_category || "",
            vence: o.valid_until, descuento: o.discount_percent,
            antes: o.old_price ? Number(o.old_price) : undefined,
            ahora: o.offer_price ? Number(o.offer_price) : undefined,
            portada_url: o.business_portada,
            rating: o.business_rating ? Number(o.business_rating) : undefined,
            verificado: o.business_status === "verificado",
          })));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <section className="relative overflow-hidden border-b border-[var(--line)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0a0b] to-transparent" />
          <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 sm:px-6">
            <Heart className="h-10 w-10 text-[var(--accent)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
            <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">Mis favoritos</h1>
            <p className="mt-3 max-w-xl text-base text-[var(--muted)]">Todos tus negocios y ofertas guardados en un solo lugar</p>
          </div>
        </section>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-[var(--muted2)]" />

          <p className="mt-2 text-[var(--muted)]">Iniciá sesión para guardar y ver tus ofertas y negocios favoritos.</p>
          <Link href="/login"
            className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const vacio = !loading && ofertas.length === 0 && negocios.length === 0;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(209,47,104,.16),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0c0a0b] to-transparent" />
        <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-16 sm:px-6">
          <Heart className="h-10 w-10 text-[var(--accent)] drop-shadow-[0_0_14px_rgba(209,47,104,.5)]" />
          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight sm:text-5xl">Mis favoritos</h1>
          <p className="mt-3 max-w-xl text-base text-[var(--muted)]">Todos tus negocios y ofertas guardados en un solo lugar</p>
          <div className="mt-6">
            <Link href="/recorrido" className="btn-hard inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              <Route className="h-4 w-4" /> Armar recorrido de compras
            </Link>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 animate-pulse rounded-xl border border-[var(--line)] bg-[var(--ov-05)]" />
            ))}
          </div>
        ) : vacio ? (
          <div className="mt-12 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-[var(--muted2)]" />
            <h2 className="mt-4 font-display text-2xl uppercase tracking-tight sm:text-3xl">Todavía no guardaste nada</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
              Tocá el corazón en cualquier oferta o negocio para guardarlo acá y volver cuando quieras.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/promociones"
                className="btn-hard inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                🔥 Explorar ofertas
              </Link>
              <Link href="/negocios"
                className="inline-block rounded-full border border-[var(--line-strong)] px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
                🏪 Ver negocios
              </Link>
            </div>
          </div>
        ) : (
          <>
            {ofertas.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-5 flex items-center gap-2 font-display text-2xl uppercase tracking-tight sm:text-3xl">
                  <Flame className="h-6 w-6 text-[var(--accent)]" /> Ofertas guardadas ({ofertas.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ofertas.map(o => <OfferCard key={o.id} o={o} />)}
                </div>
              </section>
            )}

            {negocios.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-5 flex items-center gap-2 font-display text-2xl uppercase tracking-tight sm:text-3xl">
                  <Store className="h-6 w-6 text-[var(--accent)]" /> Negocios guardados ({negocios.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {negocios.map(b => (
                    <Link key={b.id} href={`/negocio/${b.slug}`}
                      className="group flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                      <RankedAvatar slug={b.slug} name={b.name} categoria={b.category} photoUrl={b.logo_url} size={44} />
                      <div className="ml-3 flex-1">
                        <p className="font-bold">{b.name}</p>
                        <p className="text-xs capitalize text-[var(--muted)]">{b.category} · ⭐ {(b.rating || 0).toFixed(1)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)] transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
