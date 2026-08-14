"use client";
import { rangoDe, gemaDe } from "@/lib/ranks";
import { useRank } from "@/lib/rank-cache";

export default function RankBadge({ slug, puntos, categoria }: {
  slug?: string;
  puntos?: number;
  categoria?: string;
}) {
  const fromCache = useRank(slug);
  const pts = puntos ?? fromCache?.puntos ?? 0;
  const cat = categoria ?? fromCache?.category;
  const r = rangoDe(pts);
  const gema = gemaDe(cat);

  return (
    <span className="inline-flex items-center gap-1 align-middle"
      style={{ color: r.accent, textShadow: `0 0 8px ${r.accent}66` }}
      title={`Rango ${r.rango}${r.tier ? " " + r.tier : ""}`}>
      <svg width="10" height="10" viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 3px ${gema})` }}>
        <polygon points="12,2 20,8 17,21 7,21 4,8" fill={gema} />
        <polygon points="12,2 15,8 12,21 9,8" fill="#fff" opacity="0.4" />
      </svg>
      <span className="text-[9px] font-black uppercase tracking-wider">
        Nv {r.nivel} · {r.rango}{r.tier && ` ${r.tier}`}
      </span>
    </span>
  );
}
