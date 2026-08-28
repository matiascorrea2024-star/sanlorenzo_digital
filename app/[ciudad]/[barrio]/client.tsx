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
          <h1 className="font-display text-3xl uppercase tracking-tight">Barrio no encontrado</h1>
          <Link href={`/${ciudadSlug}`} className="mt-4 inline-block text-[var(--accent-ink)]">← Volver a {ciudadSlug}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--line-strong)] bg-[var(--bg)] py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(209,47,104,0.14),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <Link href={`/${ciudadSlug}`} className="mb-3 flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
            <ArrowLeft className="h-4 w-4" /> Volver a {ciudad.name}
          </Link>
          <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Barrio</Badge>
          <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">{barrio.name}</h1>
          <p className="mt-2 text-[var(--muted)]">{barrio.name}, {ciudad.name}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {ofertasPromo.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 font-display text-2xl uppercase tracking-tight">
              <Flame className="h-6 w-6 text-[var(--accent-ink)]" /> Ofertas para {barrio.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ofertasPromo.map((o) => <OfferCard key={o.id} o={o} />)}
            </div>
          </section>
        )}

        <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">
          <Store className="mr-2 inline h-6 w-6" />
          Negocios en {barrio.name} ({negocios.length})
        </h2>
        {negocios.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8">
            <div className="text-center">
              <Sparkles className="mx-auto mb-3 h-7 w-7 text-[var(--accent-ink)]" />
              <p className="font-display text-xl uppercase tracking-tight">Todavía no hay negocios en {barrio.name}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
                Si tenés un comercio en este barrio, podés ser el primero en aparecer acá.
              </p>
              <Link
                href="/registro"
                className="btn-hard mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Sumar mi negocio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
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
