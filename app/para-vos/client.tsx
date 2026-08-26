"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Compass, Flame, History, MapPin, Sparkles, Timer } from "lucide-react";
import OfferCard from "@/components/ui/offer-card";
import { hoyArgentina } from "@/lib/fecha-ar";
import { calcDistanceKm } from "@/lib/geo";

type Oferta = {
  id: string;
  negocio: string;
  slug: string;
  producto: string;
  cat: string;
  vence?: string;
  descuento?: number;
  antes?: number;
  ahora?: number;
  portada_url?: string;
  logo_url?: string;
  creado?: string;
  latitude?: number;
  longitude?: number;
  precio_prometido?: boolean;
  destacado?: boolean;
  rating?: number;
  verificado?: boolean;
  impulsada?: boolean;
  businessOpen?: boolean;
};

// Fila de la vista offers_with_business (mismo shape que promociones).
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
  impulsada_hasta?: string;
  business_open?: boolean;
};

type Coords = { lat: number; lon: number };

const VISITADAS_KEY = "sld-visited-offers";
const DIA_MS = 86400000;

export default function ParaVosClient({ ofertas: initialOfertas }: { ofertas: Row[] }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [geoError, setGeoError] = useState(false);
  // null = todavía no leímos localStorage (evita flash de la sección);
  // [] = leído y vacío → sección oculta, sin inventar historial.
  const [visitadas, setVisitadas] = useState<string[] | null>(null);
  const [hoy] = useState(() => hoyArgentina());
  const [ahora] = useState(() => Date.now());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISITADAS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      setVisitadas(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : []);
    } catch {
      setVisitadas([]);
    }
  }, []);

  const pedirUbicacion = () => {
    if (!navigator.geolocation) return setGeoError(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setGeoError(false);
      },
      () => setGeoError(true),
    );
  };

  const ofertas = useMemo<Oferta[]>(
    () =>
      (initialOfertas || [])
        .filter((o) => o.active && (!o.valid_until || o.valid_until >= hoy))
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
          creado: o.created_at,
          precio_prometido: !!o.precio_prometido,
          latitude: o.business_latitude ? Number(o.business_latitude) : undefined,
          longitude: o.business_longitude ? Number(o.business_longitude) : undefined,
          destacado: !!o.business_destacado,
          rating: o.business_rating ? Number(o.business_rating) : undefined,
          verificado: o.business_status === "verificado",
          impulsada: !!o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora,
          businessOpen: o.business_open === true,
        })),
    [initialOfertas, hoy, ahora],
  );

  // Días entre HOY Argentina y la fecha de vencimiento -- contra el string
  // de fecha-ar, no contra la hora local del dispositivo.
  const diasHasta = useMemo(() => {
    const baseMs = new Date(`${hoy}T00:00:00`).getTime();
    return (vence?: string) =>
      vence ? Math.round((new Date(`${vence}T00:00:00`).getTime() - baseMs) / DIA_MS) : null;
  }, [hoy]);

  const secciones = useMemo(() => {
    const conCoords = ofertas.filter((o) => o.latitude != null && o.longitude != null);
    const cerca = coords
      ? conCoords
          .map((o) => ({ o, km: calcDistanceKm(coords.lat, coords.lon, o.latitude!, o.longitude!) }))
          .sort((a, b) => a.km - b.km)
          .map(({ o }) => o)
      : [];
    const ultima = ofertas.filter((o) => {
      const d = diasHasta(o.vence);
      return d !== null && d <= 3;
    });
    const nuevos = ofertas.filter(
      (o) => o.creado && ahora - new Date(o.creado).getTime() <= 7 * DIA_MS && ahora >= new Date(o.creado).getTime(),
    );
    const tendencia = [...ofertas]
      .sort((a, b) => Number(!!b.impulsada) - Number(!!a.impulsada) || (b.descuento || 0) - (a.descuento || 0))
      .slice(0, 10);
    const vistas =
      visitadas && visitadas.length > 0
        ? visitadas.map((id) => ofertas.find((o) => o.id === id)).filter((o): o is Oferta => !!o)
        : [];
    return { cerca, ultima, nuevos, tendencia, vistas };
  }, [ofertas, coords, diasHasta, ahora, visitadas]);

  const hayContenido =
    secciones.cerca.length > 0 ||
    secciones.ultima.length > 0 ||
    secciones.nuevos.length > 0 ||
    secciones.tendencia.length > 0;

  if (ofertas.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <div className="mx-auto max-w-[1700px] px-4 py-24 sm:px-6">
          <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-10 text-center md:p-14">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Feed inteligente</p>
            <p className="mt-4 font-display text-2xl uppercase tracking-tight text-[var(--text)]">Todavía no hay ofertas para recomendar. Volvé en un rato.</p>
            <Link href="/promociones" className="btn-hard mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Ver todas las ofertas
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* ── Header ── */}
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 20% 0%, rgba(209,47,104,.16), transparent 60%), radial-gradient(circle at 85% 30%, rgba(169,31,85,.10), transparent 55%)" }} />
        <div className="relative mx-auto max-w-[1700px] px-4 py-12 sm:px-6 md:py-16">
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-[var(--muted)] transition hover:text-[var(--accent)]">← Volver al inicio</Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Feed inteligente</p>
              <h1 className="mt-4 font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
                PARA <span className="knockout-text magenta-glow">VOS</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                Una mezcla de cerca tuyo, por vencer y tendencias de San Lorenzo. Se ajusta a lo que mirás.
              </p>
            </div>
            <div className="shrink-0">
              {!coords ? (
                <div>
                  <button
                    type="button"
                    onClick={pedirUbicacion}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    <Compass className="h-4 w-4" /> Usar mi ubicación
                  </button>
                  {geoError && <p className="mt-2 max-w-xs text-[11px] uppercase tracking-widest text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>No pudimos leer tu ubicación.</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2" style={{ fontFamily: "var(--font-display)" }}>
                  <MapPin className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">Mostrando cerca tuyo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Secciones del feed ── */}
      <div className="mx-auto flex flex-col gap-16 px-4 py-14 sm:px-6 md:py-20">
        {coords && secciones.cerca.length > 0 && (
          <Fila
            icon={<MapPin className="h-4 w-4" />}
            eyebrow="Geolocalización"
            title={<>Cerca <span className="text-[var(--accent)]">tuyo.</span></>}
            sub="Ordenado por distancia real hasta cada negocio."
            ofertas={secciones.cerca}
            userCoords={coords}
          />
        )}

        {secciones.ultima.length > 0 && (
          <Fila
            icon={<Timer className="h-4 w-4" />}
            eyebrow="Corré que se termina"
            title={<>Última <span className="text-[var(--accent)]">oportunidad.</span></>}
            sub="Vencen en 3 días o menos."
            ofertas={secciones.ultima}
            userCoords={coords}
          />
        )}

        {secciones.nuevos.length > 0 && (
          <Fila
            icon={<Sparkles className="h-4 w-4" />}
            eyebrow="Publicadas esta semana"
            title={<>Recién <span className="text-[var(--accent)]">llegados.</span></>}
            sub="Ofertas publicadas en los últimos 7 días."
            ofertas={secciones.nuevos}
            userCoords={coords}
          />
        )}

        {secciones.tendencia.length > 0 && (
          <Fila
            icon={<Flame className="h-4 w-4" />}
            eyebrow="Lo que mueve la barata"
            title={<>En <span className="text-[var(--accent)]">tendencia.</span></>}
            sub="Impulsadas primero, después los descuentos más fuertes."
            ofertas={secciones.tendencia}
            userCoords={coords}
          />
        )}

        {visitadas !== null && secciones.vistas.length > 0 && (
          <Fila
            icon={<History className="h-4 w-4" />}
            eyebrow="Tu historial"
            title={<>Vistos por <span className="text-[var(--accent)]">vos.</span></>}
            sub="Ofertas que abriste desde este dispositivo."
            ofertas={secciones.vistas}
            userCoords={coords}
          />
        )}

        {!hayContenido && visitadas !== null && secciones.vistas.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-10 text-center">
            <p className="font-display text-xl uppercase tracking-tight text-[var(--text)]">Todavía no hay ofertas para recomendar. Volvé en un rato.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function Fila({
  icon,
  eyebrow,
  title,
  sub,
  ofertas,
  userCoords,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: React.ReactNode;
  sub?: string;
  ofertas: Oferta[];
  userCoords: Coords | null;
}) {
  return (
    <section aria-label={eyebrow}>
      <div className="mb-6 flex items-start gap-4">
        <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] text-[var(--accent)]">{icon}</span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl leading-[0.95] tracking-tight text-[var(--text)] sm:text-4xl">{title}</h2>
          {sub && <p className="mt-2 text-xs uppercase tracking-widest text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>{sub}</p>}
        </div>
      </div>
      <div className="custom-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-4">
        {ofertas.map((o) => (
          <div key={o.id} className="w-[19rem] shrink-0">
            <OfferCard o={o} userCoords={userCoords} />
          </div>
        ))}
      </div>
    </section>
  );
}
