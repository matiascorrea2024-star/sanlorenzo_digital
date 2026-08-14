"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import { Heart, Store, Flame, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import OfferCard from "@/components/ui/offer-card";
import Avatar from "@/components/ui/avatar";

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
          })));
        }
      }
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <PageHero title="❤️ Mis favoritos" subtitle="Todos tus negocios y ofertas guardados en un solo lugar" />
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Heart className="mx-auto h-16 w-16 text-white/20" />
          
          <p className="mt-2 text-white/60">Iniciá sesión para guardar y ver tus ofertas y negocios favoritos.</p>
          <Link href="/login"
            className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-3 text-sm font-black">
            Iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const vacio = !loading && ofertas.length === 0 && negocios.length === 0;

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <PageHero title="❤️ Mis favoritos" subtitle="Todos tus negocios y ofertas guardados en un solo lugar" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-black">❤️ Mis favoritos</h1>
        <p className="mt-1 text-white/60">Todo lo que guardaste para no perderte nada</p>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : vacio ? (
          <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <Heart className="mx-auto h-16 w-16 text-white/20" />
            <h2 className="mt-4 text-xl font-black">Todavía no guardaste nada</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/50">
              Tocá el corazón en cualquier oferta o negocio para guardarlo acá y volver cuando quieras.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/promociones"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black">
                🔥 Explorar ofertas
              </Link>
              <Link href="/negocios"
                className="rounded-xl border border-white/20 px-6 py-3 text-sm font-black hover:bg-white/10">
                🏪 Ver negocios
              </Link>
            </div>
          </div>
        ) : (
          <>
            {ofertas.length > 0 && (
              <section className="mt-8">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                  <Flame className="h-5 w-5 text-orange-400" /> Ofertas guardadas ({ofertas.length})
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {ofertas.map(o => <OfferCard key={o.id} o={o} />)}
                </div>
              </section>
            )}

            {negocios.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-black">
                  <Store className="h-5 w-5 text-sky-400" /> Negocios guardados ({negocios.length})
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {negocios.map(b => (
                    <Link key={b.id} href={`/negocio/${b.slug}`}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-orange-400/50 transition">
                      <Avatar name={b.name} size={44} />
                      <div className="flex-1">
                        <p className="font-bold">{b.name}</p>
                        <p className="text-xs capitalize text-white/50">{b.category} · ⭐ {(b.rating || 0).toFixed(1)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-orange-400" />
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
