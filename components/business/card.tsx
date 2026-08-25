import Link from "next/link";
import Image from "next/image";
import RankBadge from "@/components/ui/rank-badge";
import RankedAvatar from "@/components/ui/ranked-avatar";
import CategoryCover from "@/components/ui/category-cover";
import { calcDistanceKm, fmtDistance } from "@/lib/geo";
import { relativeTime } from "@/lib/relative-time";

export default function BusinessCard({ b, userCoords, featured = false }: { b: any; userCoords?: { lat: number; lon: number } | null; featured?: boolean }) {
  const cat = String(b.category || "").toLowerCase();
  const isOpen = !!b.open;
  const isVerified = b.status === "verificado";
  const rating = Number(b.rating || 0).toFixed(1);
  const esParticular = b.type && b.type !== "comercio";
  const TIPO_LABEL: Record<string, string> = { particular: "🙋 Particular", servicio: "🔧 Servicio", profesional: "💼 Profesional" };
  const dist = userCoords && b.latitude && b.longitude
    ? fmtDistance(calcDistanceKm(userCoords.lat, userCoords.lon, Number(b.latitude), Number(b.longitude)))
    : null;
  const actualizado = relativeTime(b.updated_at);

  return (
    // Card del lenguaje LA GRAN BARATA: superficie #161314, borde hairline,
    // hover levanta con borde magenta y sombra profunda.
    <Link
      href={`/negocio/${b.slug}`}
      data-spot
      className={`group relative block h-full overflow-hidden rounded-[2rem] border border-white/5 bg-[#161314] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)] ${
        featured ? "ring-1 ring-[var(--accent)]/40" : ""
      }`}
    >
      {/* Imagen de portada */}
      <div className={`relative overflow-hidden ${featured ? "h-48 md:h-72" : "h-24 md:h-32"}`}>
        {b.portada_url ? (
          <Image
            src={b.portada_url}
            alt={b.name}
            fill
            quality={90}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <CategoryCover category={cat} seed={String(b.id || b.slug || b.name)} className="h-full w-full transition duration-700 group-hover:scale-110" />
        )}
        {featured && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 animate-pulse rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-2xl md:right-4 md:top-4"
            style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}>
            🔥 Destacado
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a0b] via-transparent to-transparent" />

        {/* Badge abierto/cerrado */}
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest backdrop-blur-md md:left-4 md:top-4 ${
          isOpen
            ? "border-emerald-400/30 bg-black/60 text-[var(--ok)]"
            : "border-rose-400/30 bg-black/60 text-[var(--bad)]"
        }`} style={{ fontFamily: "var(--font-display)" }}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? "animate-pulse bg-emerald-400" : "bg-rose-400"}`} />
          {isOpen ? "Abierto" : "Cerrado"}
        </span>

        {/* Badge verificado */}
        {isVerified && (
          <span className="absolute bottom-3 left-3 rounded-xl bg-black/60 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md md:bottom-4 md:left-4"
            style={{ fontFamily: "var(--font-display)" }}>
            ✓ Verificado
          </span>
        )}
        {dist && (
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-xl bg-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md md:bottom-4 md:right-4"
            style={{ fontFamily: "var(--font-display)" }}>
            📍 {dist}
          </span>
        )}
      </div>

      {/* Logo flotante -- afuera del overflow-hidden de la imagen (si no, se
          recorta) y en el flujo normal (margen negativo, no absolute) para
          que quede apoyado sobre el borde inferior de la portada sin cortarse.
          Mismo marco de rango que /ranking (anillo metálico + gema de
          categoría) -- antes esta era la única card sin ese lenguaje visual. */}
      <div className={`relative z-10 ml-3 w-fit md:ml-4 ${featured ? "-mt-8 md:-mt-10" : "-mt-5 md:-mt-6"}`}>
        <RankedAvatar slug={b.slug} name={b.name} categoria={b.category} photoUrl={b.logo_url} size={featured ? 52 : 36} />
      </div>

      {/* Info */}
      <div className={`flex flex-1 flex-col pt-1 ${featured ? "p-4 md:p-6" : "p-3 md:p-4"}`}>
        <h3 className={`truncate font-display uppercase tracking-wide transition-colors group-hover:text-[var(--accent)] ${featured ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
          {b.name}
        </h3>
        <p className={`mt-0.5 flex flex-wrap items-center gap-x-1 capitalize text-[#a99b86] ${featured ? "text-xs md:text-sm" : "text-[11px] md:text-xs"}`}>
          <span>{b.category}{b.address ? ` · ${b.address}` : ""}</span>
          <RankBadge slug={b.slug} categoria={b.category} />
        </p>
        {actualizado && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#7d6f5c]" style={{ fontFamily: "var(--font-display)" }}>Actualizado {actualizado}</p>}
        {b.description && (
          <p className={`mt-2 line-clamp-2 text-[#c4b5a5] ${featured ? "text-sm" : "text-xs"}`}>{b.description}</p>
        )}
        {esParticular && (
          <span className="mt-2 w-fit rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--place)]">
            {TIPO_LABEL[b.type]}
          </span>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="flex items-center gap-2 text-xs font-bold text-[#fbbf24]">
            ★ {rating}
            <span className="font-normal text-[#7d6f5c]">({b.reviews || 0})</span>
            {b.hace_envios && <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--place)]">🚚 Envíos</span>}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/60 transition group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white"
            style={{ fontFamily: "var(--font-display)" }}>
            Ver negocio →
          </span>
        </div>
      </div>
    </Link>
  );
}
