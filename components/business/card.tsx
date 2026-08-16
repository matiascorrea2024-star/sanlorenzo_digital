import Link from "next/link";
import RankBadge from "@/components/ui/rank-badge";
import RankedAvatar from "@/components/ui/ranked-avatar";
import CategoryCover from "@/components/ui/category-cover";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";

export default function BusinessCard({ b, userCoords }: { b: any; userCoords?: { lat: number; lon: number } | null }) {
  const cat = String(b.category || "").toLowerCase();
  const isOpen = !!b.open;
  const isVerified = b.status === "verificado";
  const rating = Number(b.rating || 0).toFixed(1);
  const esParticular = b.type && b.type !== "comercio";
  const TIPO_LABEL: Record<string, string> = { particular: "🙋 Particular", servicio: "🔧 Servicio", profesional: "💼 Profesional" };
  const dist = userCoords && b.latitude && b.longitude
    ? fmtDistance(calcDistanceKm(userCoords.lat, userCoords.lon, Number(b.latitude), Number(b.longitude)))
    : null;

  return (
    <Link
      href={`/negocio/${b.slug}`}
      data-spot
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[.06] to-white/[.02] transition duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-xl hover:shadow-orange-500/10"
    >
      {/* Imagen de portada */}
      <div className="relative h-24 md:h-32 overflow-hidden">
        {b.portada_url ? (
          <img
            src={b.portada_url}
            alt={b.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        ) : (
          <CategoryCover category={cat} seed={String(b.id || b.slug || b.name)} className="h-full w-full transition duration-500 group-hover:scale-110" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d09] via-transparent to-transparent" />
        
        {/* Badge abierto/cerrado */}
        <span className={`absolute left-2 top-2 md:left-3 md:top-3 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[9px] md:text-[10px] font-black backdrop-blur ${
          isOpen
            ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
            : "border-rose-400/30 bg-rose-500/20 text-rose-300"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
          {isOpen ? "Abierto" : "Cerrado"}
        </span>
        
        {/* Badge verificado */}
        {isVerified && (
          <span className="absolute right-2 top-2 md:right-3 md:top-3 rounded-full border border-sky-400/30 bg-black/60 px-2 py-0.5 md:py-1 text-[9px] md:text-[10px] font-black text-sky-300 backdrop-blur">
            ✓ Verificado
          </span>
        )}
        {dist && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold text-sky-300 backdrop-blur">
            📍 {dist}
          </span>
        )}
      </div>

      {/* Logo flotante -- afuera del overflow-hidden de la imagen (si no, se
          recorta) y en el flujo normal (margen negativo, no absolute) para
          que quede apoyado sobre el borde inferior de la portada sin cortarse.
          Mismo marco de rango que /ranking (anillo metálico + gema de
          categoría) -- antes esta era la única card sin ese lenguaje visual. */}
      <div className="relative z-10 -mt-5 ml-3 w-fit md:-mt-6 md:ml-4">
        <RankedAvatar slug={b.slug} name={b.name} categoria={b.category} photoUrl={b.logo_url} size={36} />
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 md:p-4 pt-1">
        <h3 className="truncate text-sm md:text-base font-black transition group-hover:text-orange-300">
          {b.name}
        </h3>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] md:text-xs capitalize text-white/50">
          <span>{b.category}{b.address ? ` · ${b.address}` : ""}</span>
          <RankBadge slug={b.slug} categoria={b.category} />
        </p>
        {b.description && (
          <p className="mt-2 line-clamp-2 text-xs text-white/60">{b.description}</p>
        )}
        {esParticular && (
          <span className="mt-2 w-fit rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2 py-0.5 text-[10px] font-black text-cyan-300">
            {TIPO_LABEL[b.type]}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-center gap-2 text-xs font-bold text-yellow-300">
            ★ {rating}
            <span className="font-normal text-white/40">({b.reviews || 0})</span>
            {b.hace_envios && <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-black text-sky-300">🚚 Envíos</span>}
          </span>
          <span className="text-xs font-bold text-orange-400 opacity-0 transition group-hover:opacity-100">
            Ver →
          </span>
        </div>
      </div>
    </Link>
  );
}
