"use client";
import { useState } from "react";
import Image from "next/image";
import Avatar from "@/components/ui/avatar";
import { useRank } from "@/lib/rank-cache";
import { rangoDe, gemaDe } from "@/lib/ranks";
import RankFrame from "@/components/ui/rank-frame";

// Icono de negocio PRO: doble anillo metálico, brillo especular,
// gema facetada de categoría y nivel opcional.
export default function RankedAvatar({ slug, name, size = 44, categoria, photoUrl, showLevel = false }: {
  slug?: string;
  name: string;
  size?: number;
  categoria?: string;
  /** Si el caller ya tiene el logo cargado (ej. viene de una card con los
   * datos del negocio a mano), se puede pasar directo -- evita esperar
   * al cache de rangos solo para mostrar la foto. */
  photoUrl?: string | null;
  showLevel?: boolean;
}) {
  const cache = useRank(slug);
  const pts = cache?.puntos ?? 0;
  const cat = categoria ?? cache?.category;
  const [fotoRota, setFotoRota] = useState(false);
  const foto = fotoRota ? null : (photoUrl ?? cache?.logo_url);
  const r = rangoDe(pts);
  const gema = gemaDe(cat);
  const gemaSize = Math.max(12, Math.round(size / 2.8));

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <RankFrame puntos={pts} size={size + 8} categoria={cat}>
          <span className="relative block h-full w-full overflow-hidden rounded-full bg-[var(--bg)]" style={{ padding: 2 }}>
            {foto ? (
              <Image src={foto} alt={name} fill quality={90} sizes={`${size}px`}
                className="rounded-full object-cover" onError={() => setFotoRota(true)} />
            ) : (
              <Avatar name={name} size={size} />
            )}
          </span>
      </RankFrame>
      <span className="pointer-events-none absolute left-[14%] top-[5%] z-10 h-[16%] w-[44%] rounded-full bg-white/45 blur-[2px]" aria-hidden="true" />
        {/* Gema facetada de categoría */}
        <svg className="absolute -bottom-1 -right-1.5 z-20" width={gemaSize} height={gemaSize} viewBox="0 0 24 24"
          style={{ filter: `drop-shadow(0 0 5px ${gema})` }}>
          <polygon points="12,1 21,8 18,22 6,22 3,8" fill={gema} />
          <polygon points="12,1 16,8 12,22 8,8" fill="#fff" opacity="0.45" />
          <polygon points="3,8 21,8 18,11 6,11" fill="#fff" opacity="0.25" />
          <polygon points="12,1 21,8 12,8" fill="#000" opacity="0.3" />
          <circle cx="9" cy="5" r="1.4" fill="#fff" opacity="0.9" />
        </svg>
      {showLevel && (
        <span className="flex flex-col leading-tight whitespace-nowrap">
          <span className="rounded-md px-1.5 py-0.5 text-[9px] font-black whitespace-nowrap"
            style={{
              background: `linear-gradient(180deg, ${r.accent}26, #0c0a0bf0)`,
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
