"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { MapPin, Store, Flame, ArrowRight, Search, Sparkles } from "lucide-react";
import Badge from "@/components/ui/badge";
import OfferCard from "@/components/ui/offer-card";
import BusinessCard from "@/components/business/card";

export default function CiudadView() {
  const params = useParams();
  const ciudadSlug = params.ciudad as string;
  const [ciudad, setCiudad] = useState<any>(null);
  const [barrios, setBarrios] = useState<any[]>([]);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Ciudad
      const { data: loc } = await supabase().from("locations")
        .select("*").eq("slug", ciudadSlug).eq("type", "city").maybeSingle();
      if (loc) setCiudad(loc);
      // Una ciudad que existe pero todavía no está activada por el admin
      // muestra el estado "Próximamente" (más abajo) en vez de su
      // contenido -- no tiene sentido cargar barrios/negocios/ofertas.
      if (loc && loc.status === "active") {
        // Barrios
        const { data: neighs } = await supabase().from("locations")
          .select("*").eq("parent_id", loc.id).eq("type", "neighborhood").order("name");
        setBarrios(neighs || []);
        // Negocios
        const { data: biz } = await supabase().from("businesses")
          .select("*").eq("location_id", loc.id).limit(12);
        setNegocios(biz || []);
        // Ofertas -- filtradas por los negocios de esta ciudad (la vista
        // offers_with_business no tiene columna de ciudad propia).
        const bizIds = (biz || []).map((b: any) => b.id);
        const { data: offs } = bizIds.length
          ? await supabase().from("offers_with_business")
              .select("*").in("business_id", bizIds).eq("active", true).limit(8)
          : { data: [] };
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
      setLoading(false);
    })();
  }, [ciudadSlug]);

  if (loading) {
    return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;
  }

  if (!ciudad) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <Search className="mx-auto mb-4 h-10 w-10 text-[var(--muted2)]" />
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Ciudad no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-orange-400">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  if (ciudad.status !== "active") {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <section className="border-b border-[var(--line)] bg-gradient-to-br from-orange-500/10 to-red-600/10 py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Próximamente</Badge>
            <h1 className="mt-3 text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Estamos llegando a {ciudad.name}</h1>
            <p className="mx-auto mt-3 max-w-md text-[var(--text)]/70">
              Todavía no activamos {ciudad.name} en La Gran Barata Digital. Estamos sumando ciudades
              del cordón industrial de a poco -- pronto vas a poder encontrar negocios y ofertas acá.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/" className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-[var(--text)]">
                Ver ciudades activas
              </Link>
              <Link href="/para-negocios" className="rounded-full border border-[var(--line-strong)] px-5 py-2.5 text-sm font-bold text-[var(--text)]/80 hover:bg-[var(--ov-05)]">
                Tengo un negocio acá
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const sinContenido = negocios.length === 0 && ofertas.length === 0;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      {/* Hero de ciudad */}
      <section className="border-b border-[var(--line)] bg-gradient-to-br from-orange-500/10 to-red-600/10 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Ciudad</Badge>
          <h1 className="mt-3 text-4xl font-black md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>{ciudad.name}</h1>
          <p className="mt-2 text-[var(--text)]/70">
            Descubrí negocios, ofertas y servicios en {ciudad.name}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Barrios */}
        {barrios.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-black mb-4">Barrios de {ciudad.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {barrios.map(b => (
                <Link key={b.id} href={`/${ciudadSlug}/${b.slug}`}
                  className="group rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-300 hover:-translate-y-0.5">
                  <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] transition-colors group-hover:border-orange-400/30">
                    <p className="font-bold">{b.name}</p>
                    <p className="text-xs text-[var(--muted)]">Ver negocios →</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ofertas en esta ciudad */}
        {ofertas.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-4">
              <div>
                <Badge variant="danger" size="sm" pulse><Flame className="h-3 w-3" /> Ofertas</Badge>
                <h2 className="mt-2 text-2xl font-black">Ofertas en {ciudad.name}</h2>
              </div>
              <Link href="/promociones" className="text-sm font-bold text-orange-400 flex items-center gap-1">
                Ver todas <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertas.map(o => <OfferCard key={o.id} o={o} />)}
            </div>
          </section>
        )}

        {/* Negocios destacados */}
        {negocios.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4">
              <div>
                <Badge variant="info" size="sm"><Store className="h-3 w-3" /> Negocios</Badge>
                <h2 className="mt-2 text-2xl font-black">Negocios en {ciudad.name}</h2>
              </div>
              <Link href="/negocios" className="text-sm font-bold text-orange-400 flex items-center gap-1">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {negocios.slice(0, 8).map(b => (
                <div key={b.id} className="stagger-item">
                  <BusinessCard b={b} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ciudad recién activada: todavía sin negocios ni ofertas cargados.
            En vez de una sección vacía muerta, invitamos a sumar el primero
            (esto es lo que hace que una ciudad nueva se sienta "viva" desde
            el día 1, no un cascarón). */}
        {sinContenido && (
          <section className="rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] px-6 py-12 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-orange-400" />
              <h2 className="text-xl font-black">{ciudad.name} recién se está sumando a la plataforma</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Todavía no hay negocios ni ofertas cargados acá. Si tenés un comercio en {ciudad.name},
                podés ser el primero en aparecer.
              </p>
              <Link
                href="/registro"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-bold text-[var(--text)]"
              >
                Sumar mi negocio <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
