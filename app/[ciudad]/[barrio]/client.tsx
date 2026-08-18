"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MapPin, Store, ArrowLeft, Search, Sparkles, ArrowRight, Flame } from "lucide-react";
import Badge from "@/components/ui/badge";
import BusinessCard from "@/components/business/card";
import OfferCard from "@/components/ui/offer-card";

export default function BarrioView() {
  const params = useParams();
  const ciudadSlug = params.ciudad as string;
  const barrioSlug = params.barrio as string;
  const [barrio, setBarrio] = useState<any>(null);
  const [ciudad, setCiudad] = useState<any>(null);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [ofertasPromo, setOfertasPromo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: city } = await supabase().from("locations")
        .select("*").eq("slug", ciudadSlug).eq("type", "city").maybeSingle();
      const { data: neigh } = await supabase().from("locations")
        .select("*").eq("slug", barrioSlug).eq("type", "neighborhood").maybeSingle();
      // Igual que la página de ciudad: si la ciudad todavía no está
      // activada por el admin, el barrio tampoco es navegable.
      if (city && city.status === "active" && neigh) {
        setCiudad(city);
        setBarrio(neigh);
        const { data: biz } = await supabase().from("businesses")
          .select("*").eq("neighborhood_id", neigh.id).limit(20);
        setNegocios(biz || []);

        // Ofertas que un negocio (de cualquier parte de la ciudad, plan
        // PRO+) eligió promocionar puntualmente en este barrio.
        const { data: promo } = await supabase().from("offers")
          .select("*, businesses(name, slug, category, portada_url, rating, status)")
          .eq("promoted_neighborhood_id", neigh.id).eq("active", true).limit(6);
        setOfertasPromo((promo || []).map((o: any) => ({
          id: o.id, negocio: o.businesses?.name, slug: o.businesses?.slug,
          producto: o.title, cat: o.businesses?.category || "",
          vence: o.valid_until, descuento: o.discount_percent,
          antes: o.old_price ? Number(o.old_price) : undefined,
          ahora: o.offer_price ? Number(o.offer_price) : undefined,
          portada_url: o.businesses?.portada_url,
          rating: o.businesses?.rating ? Number(o.businesses.rating) : undefined,
          verificado: o.businesses?.status === "verificado",
        })));
      }
      setLoading(false);
    })();
  }, [ciudadSlug, barrioSlug]);

  if (loading) {
    return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;
  }

  if (!barrio || !ciudad) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <Search className="mx-auto mb-4 h-10 w-10 text-[var(--muted2)]" />
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Barrio no encontrado</h1>
          <Link href={`/${ciudadSlug}`} className="mt-4 inline-block text-orange-400">← Volver a {ciudadSlug}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="border-b border-[var(--line)] bg-gradient-to-br from-orange-500/10 to-red-600/10 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Link href={`/${ciudadSlug}`} className="text-sm text-orange-400 flex items-center gap-1 mb-3">
            <ArrowLeft className="h-4 w-4" /> Volver a {ciudad.name}
          </Link>
          <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Barrio</Badge>
          <h1 className="mt-3 text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>{barrio.name}</h1>
          <p className="mt-2 text-[var(--text)]/70">{barrio.name}, {ciudad.name}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {ofertasPromo.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
              <Flame className="h-6 w-6 text-orange-400" /> Ofertas para {barrio.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ofertasPromo.map((o) => <OfferCard key={o.id} o={o} />)}
            </div>
          </section>
        )}

        <h2 className="text-2xl font-black mb-4">
          <Store className="inline h-6 w-6 mr-2" />
          Negocios en {barrio.name} ({negocios.length})
        </h2>
        {negocios.length === 0 ? (
          <div className="rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] px-6 py-10 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Sparkles className="mx-auto mb-3 h-7 w-7 text-orange-400" />
              <p className="font-bold">Todavía no hay negocios en {barrio.name}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
                Si tenés un comercio en este barrio, podés ser el primero en aparecer acá.
              </p>
              <Link
                href="/registro"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-bold text-white"
              >
                Sumar mi negocio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {negocios.map(b => (
              <div key={b.id} className="stagger-item">
                <BusinessCard b={b} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
