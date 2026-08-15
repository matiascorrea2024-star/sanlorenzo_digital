"use client";
import Avatar from "@/components/ui/avatar";
import { useRank } from "@/lib/rank-cache";
import { rangoDe, gemaDe } from "@/lib/ranks";

// Icono de negocio PRO: doble anillo metálico, brillo especular,
// gema facetada de categoría y nivel opcional.
export default function RankedAvatar({ slug, name, size = 44, categoria, showLevel = false }: {
  slug?: string;
  name: string;
  size?: number;
  categoria?: string;
  showLevel?: boolean;
}) {
  const cache = useRank(slug);
  const pts = cache?.puntos ?? 0;
  const cat = categoria ?? cache?.category;
  const foto = (cache as any)?.portada_url;
  const r = rangoDe(pts);
  const gema = gemaDe(cat);
  const gemaSize = Math.max(12, Math.round(size / 2.8));

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <span className="relative inline-block shrink-0" style={{ width: size + 8, height: size + 8 }}
        title={`Nivel ${r.nivel} · ${r.rango}${r.tier ? " " + r.tier : ""}`}>
        {/* Halo de energía pulsante */}
        <span className="absolute inset-0 rounded-full blur-[7px]"
          style={{ background: r.glow, animation: r.particulas >= 3 ? "rankPulse 2.6s ease-in-out infinite" : undefined }} />
        {/* Anillo metálico exterior */}
        <span className="relative block h-full w-full rounded-full"
          style={{
            background: r.metal,
            padding: 2.5,
            boxShadow: `0 0 14px ${r.accent}99, 0 2px 6px rgba(0,0,0,.6), inset 0 1px 1px rgba(255,255,255,.5)`,
          }}>
          {/* Separador oscuro interior */}
          <span className="block h-full w-full overflow-hidden rounded-full bg-[#120d09]" style={{ padding: 2 }}>
            {foto ? (
              <img src={foto} alt={name} className="h-full w-full rounded-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <Avatar name={name} size={size} />
            )}
          </span>
          {/* Brillo especular superior (efecto metal pulido) */}
          <span className="pointer-events-none absolute left-[14%] top-[5%] h-[16%] w-[44%] rounded-full bg-white/45 blur-[2px]" />
        </span>
        {/* Gema facetada de categoría */}
        <svg className="absolute -bottom-1 -right-1.5" width={gemaSize} height={gemaSize} viewBox="0 0 24 24"
          style={{ filter: `drop-shadow(0 0 5px ${gema})` }}>
          <polygon points="12,1 21,8 18,22 6,22 3,8" fill={gema} />
          <polygon points="12,1 16,8 12,22 8,8" fill="#fff" opacity="0.45" />
          <polygon points="3,8 21,8 18,11 6,11" fill="#fff" opacity="0.25" />
          <polygon points="12,1 21,8 12,8" fill="#000" opacity="0.3" />
          <circle cx="9" cy="5" r="1.4" fill="#fff" opacity="0.9" />
        </svg>
      </span>
      {showLevel && (
        <span className="flex flex-col leading-tight whitespace-nowrap">
          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black whitespace-nowrap"
            style={{
              background: `linear-gradient(180deg, ${r.accent}26, #120d09f0)`,
              border: `1px solid ${r.accent}66`,
              color: r.accent,
              boxShadow: `0 0 8px ${r.accent}44`,
            }}>
            Nv {r.nivel}
          </span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap text-white/50">
            {r.rango}{r.tier ? ` ${r.tier}` : ""}
          </span>
        </span>
      )}
    </span>
  );
}
