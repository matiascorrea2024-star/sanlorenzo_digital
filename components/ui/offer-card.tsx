"use client";
import RankBadge from "@/components/ui/rank-badge";
import RankedAvatar from "@/components/ui/ranked-avatar";
import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, BadgeCheck } from "lucide-react";
import Badge from "@/components/ui/badge";
import FavoriteButton from "@/components/ui/favorite-button";
import { fmtDistance } from "@/lib/geo";
import { calcSDLScore, sdlLabel } from "@/lib/sdl-score";
import CountdownTimer from "@/components/ui/countdown-timer";
import CategoryCover from "@/components/ui/category-cover";

type Offer = {
  id: string; negocio: string; slug: string; producto: string; cat: string;
  vence?: string; descuento?: number; antes?: number; ahora?: number;
  portada_url?: string; logo_url?: string;
  latitude?: number; longitude?: number;
  precio_prometido?: boolean;
  rating?: number;
  verificado?: boolean;
  impulsada?: boolean;
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
  const sdl = sdlLabel(sdlScore);

  // Flags de urgencia
  const esUrgente = diasRestantes !== null && diasRestantes <= 1; // vence hoy o mañana
  const esEscaso = (o.descuento || 0) >= 40; // alto descuento = "últimas unidades"
  const esTop = sdlScore >= 80; // "más vendido" si tiene buen score

  return (
    <Link href={o.id.startsWith("demo-") ? ("/negocio/" + o.slug) : ("/oferta/" + o.id)}
      className={`group relative block rounded-[1.75rem] border p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 ${
        esUrgente
          ? "border-red-400/30 bg-gradient-to-br from-red-500/[.08] to-transparent hover:border-red-400/60 hover:shadow-2xl hover:shadow-red-500/20"
          : "border-[var(--ov-06)] bg-[var(--ov-02)] hover:border-orange-400/30 hover:shadow-xl hover:shadow-orange-500/10"
      }`}>
      <div className="relative flex flex-col overflow-hidden rounded-[1.375rem] border border-[var(--ov-06)] bg-gradient-to-b from-[var(--ov-05)] to-[var(--ov-02)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {o.portada_url ? (
          <Image src={o.portada_url} alt={o.producto} fill quality={90}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-110" />
        ) : (
          <CategoryCover category={o.cat} seed={o.id} className="h-full w-full transition duration-500 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {o.impulsada && (
            <span className="rounded-lg bg-gradient-to-r from-cyan-500 to-sky-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
              🚀 Impulsada
            </span>
          )}
          {esEscaso && (
            <span className="rounded-lg bg-yellow-500/90 px-2 py-0.5 text-[10px] font-black text-black shadow">
              🔥 Últimas unidades
            </span>
          )}
          {esTop && !esEscaso && (
            <span className="rounded-lg bg-sky-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow">
              ⭐ Más vendido
            </span>
          )}
          {isDemo && (
            <span className="rounded-lg bg-yellow-500/90 px-2 py-0.5 text-[10px] font-black text-black">
              DEMO
            </span>
          )}
          {o.precio_prometido && (
            <span className="flex items-center gap-1 rounded-lg bg-sky-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow" title="Precio certificado por el equipo de San Lorenzo Digital">
              🔒 Precio Prometido
            </span>
          )}
          {o.descuento ? (
            <span
              className="rounded-lg bg-gradient-to-r from-red-500 to-orange-500 px-2.5 py-1 text-sm text-white shadow-lg"
              style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}
            >
              -{o.descuento}%
            </span>
          ) : (
            <Badge variant="warning" size="sm">OFERTA</Badge>
          )}
          {dist && (
            <span className="flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
              <MapPin className="h-2.5 w-2.5" /> {dist}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3" aria-label="Acciones de favorito"><FavoriteButton itemType="offer" itemId={o.id} /></div>
        {v && (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <Badge variant={v.variant} size="sm" pulse={v.urgent}>
              <Clock className="h-3 w-3" /> {v.label}
            </Badge>
            {esUrgente && o.vence && <CountdownTimer expiresAt={o.vence} compact />}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex min-w-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-400/80">
            <span className="truncate">{o.negocio}</span>
            {o.verificado && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-400" aria-label="Comercio verificado" />}
            <RankedAvatar slug={o.slug} name={o.negocio || ""} size={20} /> <RankBadge slug={o.slug} />
          </div>
          <span className={`text-[10px] font-black ${sdl.color}`}>
            🔥 {sdlScore}/100
          </span>
        </div>
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-tight text-[var(--text)]">{o.producto}</h3>
        <div className="mt-auto pt-3">
          {o.ahora && o.antes ? (
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-[var(--muted2)] line-through">{fmt(o.antes)}</p>
                <p className="text-3xl leading-none text-[var(--text)]" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>{fmt(o.ahora)}</p>
              </div>
              {o.descuento && (
                <span className="rounded-lg bg-green-500/15 px-2 py-1 text-xs font-black text-green-300">
                  Ahorrás {fmt(o.antes - o.ahora)}
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm font-bold text-orange-400">Ver oferta →</p>
          )}
        </div>
      </div>
      </div>
    </Link>
  );
}
