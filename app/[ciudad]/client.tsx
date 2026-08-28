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
          <h1 className="font-display text-3xl uppercase tracking-tight">Ciudad no encontrada</h1>
          <Link href="/" className="mt-4 inline-block text-[var(--accent-ink)]">← Volver al inicio</Link>
        </div>
      </main>
    );
  }

  if (ciudad.status !== "active") {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <section className="relative overflow-hidden border-b border-[var(--line-strong)] bg-[var(--bg)] py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(209,47,104,0.14),_transparent_55%)]" />
          <div className="relative mx-auto max-w-2xl px-4 text-center">
            <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Próximamente</Badge>
            <h1 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight md:text-6xl">Estamos llegando a {ciudad.name}</h1>
            <p className="mx-auto mt-3 max-w-md text-[var(--muted)]">
              Todavía no activamos {ciudad.name} en La Gran Barata Digital. Estamos sumando ciudades
              del cordón industrial de a poco -- pronto vas a poder encontrar negocios y ofertas acá.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link href="/" className="btn-hard rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                Ver ciudades activas
              </Link>
              <Link href="/para-negocios" className="rounded-xl border border-[var(--line-strong)] px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
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
      <section className="relative overflow-hidden border-b border-[var(--line-strong)] bg-[var(--bg)] py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(209,47,104,0.14),_transparent_55%)]" />
        <div className="relative mx-auto max-w-6xl px-4">
          <Badge variant="info" size="sm"><MapPin className="h-3 w-3" /> Ciudad</Badge>
          <h1 className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight md:text-6xl">{ciudad.name}</h1>
          <p className="mt-2 text-[var(--muted)]">
            Descubrí negocios, ofertas y servicios en {ciudad.name}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Barrios */}
        {barrios.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-display text-2xl uppercase tracking-tight">Barrios de {ciudad.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {barrios.map(b => (
                <Link key={b.id} href={`/${ciudadSlug}/${b.slug}`}
                  className="group rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                  <p className="font-display text-xl uppercase tracking-tight">{b.name}</p>
                  <p className="text-xs text-[var(--muted)]">Ver negocios →</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ofertas en esta ciudad */}
        {ofertas.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <Badge variant="danger" size="sm" pulse><Flame className="h-3 w-3" /> Ofertas</Badge>
                <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Ofertas en {ciudad.name}</h2>
              </div>
              <Link href="/promociones" className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
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
            <div className="mb-4 flex items-end justify-between">
              <div>
                <Badge variant="info" size="sm"><Store className="h-3 w-3" /> Negocios</Badge>
                <h2 className="mt-2 font-display text-2xl uppercase tracking-tight">Negocios en {ciudad.name}</h2>
              </div>
              <Link href="/negocios" className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
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
          <section className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8">
            <div className="text-center">
              <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--accent-ink)]" />
              <h2 className="font-display text-xl uppercase tracking-tight">{ciudad.name} recién se está sumando a la plataforma</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
                Todavía no hay negocios ni ofertas cargados acá. Si tenés un comercio en {ciudad.name},
                podés ser el primero en aparecer.
              </p>
              <Link
                href="/registro"
                className="btn-hard mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "var(--font-display)" }}
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
