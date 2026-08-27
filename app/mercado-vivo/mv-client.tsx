"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { BadgeCheck, Trophy } from "lucide-react";
import FavoriteButton from "@/components/ui/favorite-button";
import InterestButton from "@/components/offers/interest-button";
import OpinionVote from "@/components/offers/opinion-vote";
import Share from "@/components/business/share";
import Stories from "@/components/home/stories";
import LiveNow from "@/components/home/live-now";
import ReelsStrip from "@/components/home/reels-strip";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { relativeTime } from "@/lib/relative-time";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/data";
import styles from "./mercado-vivo.module.css";

type Oferta = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; antes?: number; ahora?: number;
  portada_url?: string; logo_url?: string;
  latitude?: number; longitude?: number;
  precio_prometido?: boolean; rating?: number; verificado?: boolean;
  impulsada?: boolean; creado?: string; businessOpen?: boolean;
};

type TickerItem = { kind: "live" | "info" | "warn"; text: string };
type Review = { negocio: string; reviewer_name: string; comment: string };
type Stats = { activas: number; verificados: number; terminanHoy: number };
type Coords = { lat: number; lon: number };

const fmt = (n?: number) => (typeof n === "number" ? "$" + n.toLocaleString("es-AR") : "");

// Días hasta el vencimiento, calculado en el cliente (independiente del
// daysTo del server component en page.tsx -- mismo cálculo, otro archivo).
function diasA(vence?: string) {
  if (!vence) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${vence}T00:00:00`).getTime() - hoy.getTime()) / 86400000);
}

function venceLabel(vence?: string) {
  const d = diasA(vence);
  if (d === null) return null;
  if (d < 0) return "Finalizada";
  if (d === 0) return "Vence hoy";
  if (d === 1) return "Vence mañana";
  return `En ${d} días`;
}

function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setInView(true); return; }
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) { setInView(true); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setInView(true); io.unobserve(e.target); } });
    }, { threshold: .15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`${styles.mvReveal} ${inView ? styles.mvIn : ""}`}>{children}</div>;
}

function CountUp({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setN(target); return; }
    let start: number | null = null;
    const dur = 900;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{n}</>;
}

function Shot({ oferta, className, children }: { oferta?: Oferta | null; className?: string; children?: React.ReactNode }) {
  const icon = (oferta && CATEGORIES.find((c) => c.id === oferta.cat)?.icon) || "🏪";
  return (
    <div className={`${styles.mvShot} ${className || ""}`}>
      {oferta?.portada_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={oferta.portada_url} alt={oferta.producto} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className={styles.mvShotSil}><span style={{ fontSize: "3.5rem", filter: "drop-shadow(0 6px 16px rgba(0,0,0,.35))" }}>{icon}</span></div>
      )}
      <div className={styles.mvShotRim} />
      {children}
    </div>
  );
}

// Tarjeta de producto -- calcada del mockup aprobado (badge, tipografía
// Fraunces en el precio, meta de distancia/vencimiento), pero con datos
// 100% reales: nada de "14 viendo" ni stock inventado. El corazón y el
// "me interesa" son los componentes reales de siempre.
function MvOfferCard({ o, coords }: { o: Oferta; coords: Coords | null }) {
  const label = venceLabel(o.vence);
  const esEscaso = (o.descuento || 0) >= 40;
  const publicado = relativeTime(o.creado);
  const dist = coords && o.latitude && o.longitude
    ? fmtDistance(calcDistanceKm(coords.lat, coords.lon, o.latitude, o.longitude))
    : null;

  return (
    <Link href={`/oferta/${o.id}`} className={styles.mvProdCard}>
      <Shot oferta={o} className={styles.mvProdShot}>
        {o.descuento ? (
          <span className={styles.mvProdBadge}>-{o.descuento}%{esEscaso ? " · últimas" : ""}</span>
        ) : null}
        <div className={styles.mvProdTopRight}>
          <FavoriteButton itemType="offer" itemId={o.id} />
          <InterestButton compact offerId={o.id} />
        </div>
      </Shot>
      <div className={styles.mvProdBody}>
        <div className={styles.mvProdShop}>
          {o.verificado && <BadgeCheck />}
          {o.negocio}
        </div>
        <div className={styles.mvProdName}>{o.producto}</div>
        <div className={styles.mvProdPriceRow}>
          {o.ahora ? <span className={`${styles.mvProdPrice} num`}>{fmt(o.ahora)}</span> : null}
          {o.antes ? <span className={`${styles.mvProdOld} num`}>{fmt(o.antes)}</span> : null}
        </div>
        <div className={styles.mvProdMeta}>
          <span>{dist ? `📍 ${dist}` : publicado ? `Publicado ${publicado}` : ""}</span>
          {label && <span>{label}</span>}
        </div>
      </div>
    </Link>
  );
}

// Hitos reales de /invitar (mismos números, no se inventa otra escala acá).
const HITOS_REFERIDOS = [
  { n: 3, premio: "3 días de visibilidad \"Nuevo\"" },
  { n: 10, premio: "1 mes de Plan PRO sin costo" },
  { n: 25, premio: "Destacado del Mes" },
];

// Si el visitante está logueado y tiene referidos reales, mostramos su
// progreso real hacia el próximo hito. Si no, queda el teaser genérico
// de siempre -- nunca un número inventado.
function ReferralMini() {
  const [activos, setActivos] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) return;
      const { data } = await supabase().from("referrals").select("activated_at").eq("referrer_id", user.id);
      setActivos((data || []).filter((r: { activated_at?: string | null }) => r.activated_at).length);
    })();
  }, []);

  if (activos === null) {
    return (
      <div className={styles.mvRefBox}>
        <p>Invitá 3 vecinos y sumás días de visibilidad gratis para tu negocio, o beneficios si sos comprador.</p>
      </div>
    );
  }

  const next = HITOS_REFERIDOS.find((h) => h.n > activos) || HITOS_REFERIDOS[HITOS_REFERIDOS.length - 1];
  const falta = Math.max(0, next.n - activos);

  return (
    <div className={styles.mvRefBox}>
      <p>
        <b className="num">{activos}</b> vecino{activos === 1 ? "" : "s"} invitado{activos === 1 ? "" : "s"}
        {falta > 0 ? <> · te falta{falta === 1 ? "" : "n"} <b className="num">{falta}</b> para: {next.premio}</> : <> · ¡{next.premio} conseguido!</>}
      </p>
    </div>
  );
}

export default function MercadoVivoClient({
  destacada, spotlight, terminanPronto, recomendadas, stats, tickerItems, reviews,
}: {
  destacada: Oferta | null;
  spotlight: Oferta | null;
  terminanPronto: Oferta[];
  recomendadas: Oferta[];
  stats: Stats;
  tickerItems: TickerItem[];
  reviews: Review[];
}) {
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [terminaHoy, setTerminaHoy] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);

  const usedCats = useMemo(() => {
    const ids = new Set<string>();
    [...terminanPronto, ...recomendadas].forEach((o) => { if (o.cat) ids.add(o.cat); });
    return CATEGORIES.filter((c) => ids.has(c.id));
  }, [terminanPronto, recomendadas]);

  const dotClass = { live: styles.mvDotLive, info: styles.mvDotInfo, warn: styles.mvDotWarn } as const;
  const doubled = [...tickerItems, ...tickerItems];

  const toggleNearMe = () => {
    if (nearMe) { setNearMe(false); return; }
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setNearMe(true); },
      () => { /* permiso denegado o no disponible: el chip simplemente no se activa */ }
    );
  };

  const filtered = (list: Oferta[]) => {
    let out = catFilter ? list.filter((o) => o.cat === catFilter) : list;
    if (terminaHoy) out = out.filter((o) => diasA(o.vence) === 0);
    if (nearMe && coords) {
      out = [...out].sort((a, b) => {
        const da = a.latitude && a.longitude ? calcDistanceKm(coords.lat, coords.lon, a.latitude, a.longitude) : Infinity;
        const db = b.latitude && b.longitude ? calcDistanceKm(coords.lat, coords.lon, b.latitude, b.longitude) : Infinity;
        return da - db;
      });
    }
    return out;
  };

  return (
    <div className={styles.mvRoot}>
      <div className={styles.mvGrain} />

      <section className={styles.mvHero}>
        <div className={styles.mvHeroGlow} />
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6" style={{ position: "relative", zIndex: 2 }}>
          <div className={styles.mvHeroGrid}>
            <div>
              <span className={styles.mvEyebrow}>San Lorenzo, en vivo</span>
              <h1 style={{ marginTop: ".7rem" }}>
                Tu barrio<b>tiene más ofertas de las que pensás.</b>
              </h1>
              <p className={styles.mvLede}>Antes de abrir Instagram para ver qué te estás perdiendo, mirá esto: lo que están comprando, opinando y compartiendo tus vecinos, en este momento.</p>
              <div className={styles.mvHeroCta}>
                <Link href="/promociones" className={styles.mvBtnGlow}>Ver ofertas ahora →</Link>
                <Link href="/para-negocios" className={styles.mvBtnGhost}>Soy comerciante</Link>
              </div>
              <div className={styles.mvHeroStats}>
                <div className={styles.mvHstat}><b className="num"><CountUp target={stats.activas} /></b><span>Ofertas activas</span></div>
                <div className={styles.mvHstat}><b className="num"><CountUp target={stats.verificados} /></b><span>Negocios verificados</span></div>
                <div className={styles.mvHstat}><b className="num"><CountUp target={stats.terminanHoy} /></b><span>Terminan hoy</span></div>
              </div>
            </div>

            {destacada && (
              <div className={styles.mvHeroSpot}>
                <Shot oferta={destacada} className={styles.mvHeroSpotCard}>
                  <span className={styles.mvHeroSpotBadge}>Destacado hoy</span>
                  <div className={styles.mvHeroSpotTag}>
                    <div className={styles.mvSh}>{destacada.negocio}{destacada.verificado ? " · Verificado" : ""}</div>
                    <h4>{destacada.producto}</h4>
                    <div className={styles.mvPr}>
                      <b className="num">{fmt(destacada.ahora)}</b>
                      {destacada.antes ? <s className="num">{fmt(destacada.antes)}</s> : null}
                    </div>
                  </div>
                </Shot>
              </div>
            )}
          </div>
        </div>

        {tickerItems.length > 0 && (
          <div className={styles.mvTickerShell}>
            <div className={styles.mvTickerTrack}>
              {doubled.map((it, i) => (
                <span key={i} className={styles.mvTickerItem} aria-hidden={i >= tickerItems.length}>
                  <span className={`${styles.mvDot} ${dotClass[it.kind]}`} />{it.text}
                  {i < doubled.length - 1 && <span className={styles.mvTickerSep}>·</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <Stories />

      <section className={styles.mvSection} id="ofertas">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          {usedCats.length > 0 && (
            <div className={styles.mvFiltersRow}>
              <button className={`${styles.mvChip} ${catFilter === null ? styles.mvActive : ""}`} onClick={() => setCatFilter(null)}>Todos</button>
              {usedCats.map((c) => (
                <button key={c.id} className={`${styles.mvChip} ${catFilter === c.id ? styles.mvActive : ""}`} onClick={() => setCatFilter(c.id)}>{c.icon} {c.name}</button>
              ))}
              <button className={`${styles.mvChip} ${styles.mvChipRight} ${nearMe ? styles.mvActive : ""}`} onClick={toggleNearMe}>📍 Cerca de mí</button>
              <button className={`${styles.mvChip} ${terminaHoy ? styles.mvActive : ""}`} onClick={() => setTerminaHoy((v) => !v)}>Termina hoy</button>
            </div>
          )}

          {spotlight && (
            <Reveal>
              <div className={styles.mvSpotWrap}>
                <Shot oferta={spotlight} className={styles.mvSpotShot} />
                <div className={styles.mvSpotCopy}>
                  <div className={styles.mvShName}><BadgeCheck /><span>{spotlight.negocio}{spotlight.verificado ? " · Verificado" : ""}</span></div>
                  <h2>{spotlight.producto}</h2>
                  <div className={styles.mvSpotPriceRow}>
                    <span className={`${styles.mvSpotPrice} num`}>{fmt(spotlight.ahora)}</span>
                    {spotlight.antes ? <span className={`${styles.mvSpotOld} num`}>{fmt(spotlight.antes)}</span> : null}
                    {spotlight.descuento ? <span className={styles.mvSpotOff}>-{spotlight.descuento}%</span> : null}
                  </div>
                  <div style={{ marginBottom: "1.2rem" }}><OpinionVote offerId={spotlight.id} /></div>
                  <div className={styles.mvSpotActions}>
                    <Link href={`/oferta/${spotlight.id}`} className={styles.mvBtnGlow}>Ver oferta</Link>
                    <Share title={spotlight.producto} />
                  </div>
                </div>
              </div>
            </Reveal>
          )}

          {filtered(terminanPronto).length > 0 && (
            <Reveal>
              <div style={{ marginBottom: "3rem" }}>
                <div className={styles.mvSecHead}><h2>Terminan pronto</h2><Link href="/promociones">Ver todas →</Link></div>
                <div className={styles.mvGrid3}>
                  {filtered(terminanPronto).map((o) => <MvOfferCard key={o.id} o={o} coords={coords} />)}
                </div>
              </div>
            </Reveal>
          )}

          {filtered(recomendadas).length > 0 && (
            <Reveal>
              <div>
                <div className={styles.mvSecHead}><h2>Recomendadas por el barrio</h2><Link href="/mapa">Ver mapa →</Link></div>
                <div className={styles.mvGrid3}>
                  {filtered(recomendadas).map((o) => <MvOfferCard key={o.id} o={o} coords={coords} />)}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <LiveNow />
      <ReelsStrip />

      <section className={styles.mvSection} id="widgets">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className={styles.mvSecHead}><h2>El pulso del barrio</h2></div>
          <Reveal>
            <div className={styles.mvTriple}>
              <div className={styles.mvWidget}>
                <div className={styles.mvWidgetHead}><h3>Mapa caliente</h3><span>Vista ilustrativa</span></div>
                <div className={styles.mvHeatCard}>
                  <svg viewBox="0 0 300 190" xmlns="http://www.w3.org/2000/svg">
                    <rect width="300" height="190" fill="var(--surface2)" />
                    <g stroke="var(--line-strong)" strokeWidth="1.3">
                      <line x1="0" y1="48" x2="300" y2="48" /><line x1="0" y1="96" x2="300" y2="96" /><line x1="0" y1="144" x2="300" y2="144" />
                      <line x1="68" y1="0" x2="68" y2="190" /><line x1="142" y1="0" x2="142" y2="190" /><line x1="216" y1="0" x2="216" y2="190" />
                    </g>
                    <circle className={styles.mvPulseDot} cx="100" cy="70" r="6" fill="var(--accent)" opacity=".85" />
                    <circle className={styles.mvPulseDot} cx="175" cy="118" r="5" fill="var(--accent)" opacity=".7" style={{ animationDelay: ".4s" }} />
                    <circle className={styles.mvPulseDot} cx="240" cy="55" r="6" fill="var(--accent)" opacity=".9" style={{ animationDelay: ".8s" }} />
                </svg>
                </div>
                <div className={styles.mvHeatFoot}>
                  <span><b className="num">{stats.activas}</b>activas</span>
                  <span><b className="num">{stats.terminanHoy}</b>terminan hoy</span>
                  <span><b className="num">{stats.verificados}</b>verificados</span>
                </div>
                <Link href="/mapa" className={styles.mvWidgetCta}>Ver mapa real →</Link>
              </div>

              <div className={styles.mvWidget}>
                <div className={styles.mvWidgetHead}><h3>Invitá vecinos</h3><span>Recompensa real</span></div>
                <ReferralMini />
                <Link href="/invitar" className={styles.mvWidgetCta}>Ir a invitar →</Link>
              </div>

              <div className={styles.mvWidget}>
                <div className={styles.mvWidgetHead}><h3>Ranking del barrio</h3><span><Trophy size={11} /></span></div>
                <div className={styles.mvRefBox}>
                  <p>Los negocios y vecinos más activos de San Lorenzo, actualizado todas las semanas.</p>
                </div>
                <Link href="/ranking" className={styles.mvWidgetCta}>Ver ranking →</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className={styles.mvSection} id="opinan">
          <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
            <div className={styles.mvSecHead}><h2>El barrio opina</h2><Link href="/comunidad">Ver comunidad →</Link></div>
            <Reveal>
              <div className={styles.mvNotesGrid}>
                {reviews.map((r, i) => (
                  <div key={i} className={styles.mvNoteCard}>
                    <div className={styles.mvNoteTop}>
                      <svg className={styles.mvNoteIcon} viewBox="0 0 64 64" fill="none" aria-hidden="true">
                        <path d="M13 9 H49 V42 L37 53 H13 Z" stroke="currentColor" strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />
                        <path d="M37 42 V53 L49 42 Z" fill="currentColor" />
                      </svg>
                      <div className={styles.mvNoteWho}>{r.reviewer_name}<span>{r.negocio}</span></div>
                    </div>
                    <p className={styles.mvNoteBody}>&ldquo;{r.comment}&rdquo;</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section className={styles.mvSection} id="comando">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
          <Reveal>
            <div className={styles.mvMerchantBand}>
              <div className={styles.mvMerchantCopy}>
                <h3>¿Tenés un negocio en San Lorenzo?</h3>
                <p>Mirá cómo te ven tus vecinos y destacate cuando más importa, con herramientas reales de visibilidad.</p>
              </div>
              <div className={styles.mvMerchantRing}>
                <svg viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--line-strong)" strokeWidth="10" />
                  <circle cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" strokeDasharray="251.2" strokeDashoffset="90" transform="rotate(-90 48 48)" />
                </svg>
                <small>Vista ilustrativa</small>
              </div>
              <Link href="/para-negocios" className={styles.mvMerchantCta}>Publicar mi negocio →</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
