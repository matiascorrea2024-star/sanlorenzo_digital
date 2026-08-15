"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/ui/page-hero";
import OfferCard from "@/components/ui/offer-card";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  business_name: string;
  business_slug: string;
  business_category: string;
  title: string;
  valid_until?: string;
  discount_percent?: number;
  old_price?: number;
  offer_price?: number;
  active: boolean;
  business_portada?: string;
  business_logo?: string;
  created_at: string;
  precio_prometido?: boolean;
  business_latitude?: number;
  business_longitude?: number;
  business_destacado?: boolean;
  business_rating?: number;
  business_status?: string;
};

export default function PromocionesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Misma fuente real que la Home y el resto del sitio (la vista ya
      // filtra active=true) -- antes esta página leía businesses.promotions,
      // un campo JSON legacy que nadie escribe desde que existe la tabla
      // offers: las ofertas que publican los comercios nunca llegaban acá.
      const { data } = await supabase().from("offers_with_business").select("*").order("created_at", { ascending: false }).limit(200);
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);
  const activas = useMemo(
    () =>
      rows
        .filter((o) => !o.valid_until || o.valid_until >= hoy)
        .map((o) => ({
          id: o.id,
          negocio: o.business_name,
          slug: o.business_slug,
          producto: o.title,
          cat: o.business_category || "",
          vence: o.valid_until,
          descuento: o.discount_percent ? Number(o.discount_percent) : undefined,
          antes: o.old_price ? Number(o.old_price) : undefined,
          ahora: o.offer_price ? Number(o.offer_price) : undefined,
          portada_url: o.business_portada,
          logo_url: o.business_logo,
          precio_prometido: !!o.precio_prometido,
          latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
          longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
          rating: o.business_rating ? Number(o.business_rating) : undefined,
          verificado: o.business_status === "verificado",
        })),
    [rows, hoy]
  );

  return (
    <main className="min-h-screen bg-[#120d09] pb-24 text-white">
      <PageHero
        title="Ofertas en este momento"
        subtitle={loading ? "Cargando..." : `${activas.length} promocion${activas.length === 1 ? "" : "es"} corriendo ahora en San Lorenzo`}
      >
        <Link href="/" className="mt-3 inline-block text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4">
        {!loading && activas.length === 0 ? (
          <div className="sld-card rounded-3xl p-10 text-center">
            <p className="mt-3 text-xl font-black">No hay ofertas activas ahora</p>
            <p className="mt-2 text-sm text-white/60">Los negocios publican ofertas nuevas todos los días. Volvé a pasar más tarde.</p>
            <Link
              href="/dashboard/ofertas/nueva"
              className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-bold hover:opacity-90"
            >
              Soy comercio: publicar oferta
            </Link>
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activas.map((o) => (
              <OfferCard key={o.id} o={o} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link href="/ofertas-finalizadas" className="text-sm text-white/50 transition hover:text-orange-300">
            Ver ofertas que ya terminaron →
          </Link>
        </div>
      </div>
    </main>
  );
}
