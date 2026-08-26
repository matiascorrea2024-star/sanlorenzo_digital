"use client";
import RankBadge from "@/components/ui/rank-badge";
import RankedAvatar from "@/components/ui/ranked-avatar";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, BadgeCheck } from "lucide-react";
import Badge from "@/components/ui/badge";
import FavoriteButton from "@/components/ui/favorite-button";
import InterestButton from "@/components/offers/interest-button";
import { fmtDistance } from "@/lib/geo";
import { calcSDLScore, sdlLabel } from "@/lib/sdl-score";
import CountdownTimer from "@/components/ui/countdown-timer";
import CategoryCover from "@/components/ui/category-cover";
import { relativeTime } from "@/lib/relative-time";

type Offer = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; antes?: number; ahora?: number;
  portada_url?: string; logo_url?: string;
  latitude?: number; longitude?: number;
  precio_prometido?: boolean;
  rating?: number;
  verificado?: boolean;
  impulsada?: boolean;
  creado?: string;
};

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

function venceInfo(expires?: string) {
  if (!expires) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const f = new Date(expires + "T00:00:00");
  const d = Math.round((f.getTime() - hoy.getTime()) / 86400000);
  if (d < 0) return { label: "Finalizada", variant: "default" as const, urgent: false };
  if (d === 0) return { label: "VENCE HOY", variant: "danger" as const, urgent: true };
  if (d === 1) return { label: "Vence mañana", variant: "warning" as const, urgent: true };
  if (d <= 3) return { label: `En ${d} días`, variant: "warning" as const, urgent: false };
  return { label: `En ${d} días`, variant: "info" as const, urgent: false };
}

export default function OfferCard({ o, userCoords }: { o: Offer; userCoords?: { lat: number; lon: number } | null }) {
  const v = venceInfo(o.vence);
  const isDemo = o.id.startsWith("demo-");
  let dist: string | null = null;
  let distKm: number | null = null;
  if (userCoords && o.latitude && o.longitude) {
    const R = 6371;
    const dLat = (o.latitude - userCoords.lat) * Math.PI / 180;
    const dLon = (o.longitude - userCoords.lon) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.lat*Math.PI/180) * Math.cos(o.latitude*Math.PI/180) * Math.sin(dLon/2)**2;
    const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    dist = fmtDistance(km);
    distKm = km;
  }
  // Calcular SDL Score
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diasRestantes = o.vence ? Math.round((new Date(o.vence + "T00:00:00").getTime() - hoy.getTime()) / 86400000) : null;
  const sdlScore = calcSDLScore({
    descuento: o.descuento || 0,
    distanciaKm: distKm,
    rating: o.rating || 0,
    diasRestantes,
  });
  const publicado = relativeTime(o.creado);

  // Flags de urgencia
  const esUrgente = diasRestantes !== null && diasRestantes <= 1; // vence hoy o mañana
  const esEscaso = (o.descuento || 0) >= 40; // alto descuento = "últimas unidades"
  const esTop = sdlScore >= 80; // "más vendido" si tiene buen score

  return (
    <Link href={o.id.startsWith("demo-") ? ("/negocio/" + o.slug) : ("/oferta/" + o.id)}
      className="group relative block rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
      {/* Portada */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[2rem]">
        {o.portada_url ? (
          <Image src={o.portada_url} alt={o.producto} fill quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-110" />
        ) : (
          <CategoryCover category={o.cat} seed={o.id} className="h-full w-full transition duration-700 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Badges superiores izquierdos */}
        <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
          {o.descuento ? (
            <span className={`rounded-xl px-3.5 py-1.5 text-[12px] font-black uppercase tracking-widest text-white shadow-2xl ${esUrgente ? "animate-pulse" : ""}`}
              style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}>
              -{o.descuento}% OFF
            </span>
          ) : (
            <Badge variant="warning" size="sm">OFERTA</Badge>
          )}
          {o.impulsada && (
            <span className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-2xl" style={{ fontFamily: "var(--font-display)" }}>
              <span aria-hidden="true">🚀</span> Impulsada
            </span>
          )}
          {esTop && !esEscaso && (
            <span className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-2xl" style={{ fontFamily: "var(--font-display)" }}>
              <span aria-hidden="true">⭐</span> Top
            </span>
          )}
          {isDemo && (
            <span className="rounded-xl bg-yellow-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-2xl" style={{ fontFamily: "var(--font-display)" }}>Demo</span>
          )}
          {o.precio_prometido && (
            <span className="flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl" style={{ fontFamily: "var(--font-display)" }} title="Precio certificado por el equipo de San Lorenzo Digital">
              🔒 Precio Prometido
            </span>
          )}
          {esEscaso && (
            <span className="flex items-center gap-1 rounded-xl bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#fbbf24] shadow-2xl backdrop-blur-md" style={{ fontFamily: "var(--font-display)" }}>
              🔥 Últimas unidades
            </span>
          )}
          {dist && (
            <span className="flex items-center gap-1 rounded-xl bg-black/60 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md" style={{ fontFamily: "var(--font-display)" }}>
              <MapPin className="h-3 w-3" /> {dist}
            </span>
          )}
        </div>

        <div className="absolute right-4 top-4 flex flex-col items-center gap-2" aria-label="Acciones de la oferta">
          <FavoriteButton itemType="offer" itemId={o.id} />
          <InterestButton compact offerId={o.id} />
        </div>

        {v && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2">
            <Badge variant={v.variant} size="sm" pulse={v.urgent}>
              <Clock className="h-3 w-3" /> {v.label}
            </Badge>
            {esUrgente && o.vence && <CountdownTimer expiresAt={o.vence} compact />}
          </div>
        )}
      </div>

      {/* Cuerpo */}
      <div className="flex flex-col p-5 sm:p-6">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>{o.negocio}</span>
            {o.verificado && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[var(--place)]" aria-label="Comercio verificado" />}
            <RankedAvatar slug={o.slug} name={o.negocio || ""} size={20} /> <RankBadge slug={o.slug} />
          </div>
          <span className="shrink-0 rounded-md bg-[var(--ov-05)] px-1.5 py-0.5 text-[9px] font-black tabular-nums text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}
            title={sdlLabel(sdlScore).text}>
            {sdlScore}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-[2.6rem] font-display text-xl uppercase leading-[0.95] tracking-wide text-[var(--text)] transition-colors group-hover:text-[var(--accent)] sm:text-2xl">{o.producto}</h3>
        {publicado && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Publicado {publicado}</p>}

        <div className="mt-auto pt-4">
          {o.ahora && o.antes ? (
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="font-display text-4xl leading-none text-[var(--accent)] transition-colors group-hover:text-white">{fmt(o.ahora)}</span>
                <span className="text-sm font-bold text-[var(--muted)] line-through decoration-2">{fmt(o.antes)}</span>
              </div>
              {o.descuento && (
                <span className="rounded-lg bg-green-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--ok)]" style={{ fontFamily: "var(--font-display)" }}>
                  Ahorrás {fmt(o.antes - o.ahora)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Ver oferta →</p>
          )}
        </div>
      </div>
    </Link>
  );
}
