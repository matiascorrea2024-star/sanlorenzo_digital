"use client";
import { rangoDe } from "@/lib/ranks";
import { useRank } from "@/lib/rank-cache";

export default function LevelBadge({ slug }: { slug?: string; verificado?: boolean }) {
  const rank = useRank(slug);
  const puntos = rank?.puntos ?? 0;
  const r = rangoDe(puntos);

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black"
        style={{ borderColor: `${r.accent}66`, background: `${r.accent}1a`, color: r.accent }}
      >
        {r.rango}{r.tier ? ` ${r.tier}` : ""} · {puntos} pts
      </span>
      {r.proximo ? (
        <div className="w-40">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${r.progreso}%` }} />
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">→ {r.proximo} (faltan {r.faltan})</p>
        </div>
      ) : (
        <p className="text-[10px] text-yellow-300">👑 Rango máximo</p>
      )}
    </div>
  );
}
