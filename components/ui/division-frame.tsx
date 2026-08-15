"use client";
import { ReactNode } from "react";
import { rangoDe, gemaDe } from "@/lib/ranks";

const OCT = "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";

function Gema({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
      <polygon points="12,2 20,8 17,21 7,21 4,8" fill={color} />
      <polygon points="12,2 15,8 12,21 9,8" fill="#fff" opacity="0.4" />
      <polygon points="4,8 20,8 17,11 7,11" fill="#fff" opacity="0.25" />
      <polygon points="12,2 20,8 12,8" fill="#000" opacity="0.3" />
      <polygon points="7,21 12,11 17,21" fill="#000" opacity="0.2" />
    </svg>
  );
}

export default function DivisionFrame({ children, puntos, size = 96, showLabel = false, categoria, enFuego = false }: {
  children: ReactNode;
  puntos: number;
  size?: number;
  showLabel?: boolean;
  categoria?: string;
  /** Racha real de crecimiento (ej: #1 en visitas esta semana vs la
   * anterior) -- suma un halo y llamas encima del marco de rango, sin
   * tocar el sistema de rangos en sí. */
  enFuego?: boolean;
}) {
  const r = rangoDe(puntos);
  const gema = gemaDe(categoria);

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size + 32 }}>
      {/* Halo de energía */}
      <div className="pointer-events-none absolute inset-0" style={{ background: r.glow, transform: "scale(1.4)", filter: "blur(6px)" }} />

      {enFuego && (
        <>
          <div className="blaze-ring pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle,rgba(251,146,60,.55) 0%,rgba(239,68,68,.25) 45%,transparent 75%)", transform: "scale(1.55)" }} />
          <span className="blaze-flame" style={{ top: -10, left: "10%" }}>🔥</span>
          <span className="blaze-flame b2" style={{ top: -14, right: "8%" }}>🔥</span>
          <span className="blaze-flame b3" style={{ bottom: 6, left: "-6%" }}>🔥</span>
        </>
      )}

      {/* Partículas ✦ para rangos altos */}
      {r.particulas >= 3 && (
        <>
          <span className="sparkle" style={{ top: -8, left: "6%", color: r.accent }}>✦</span>
          <span className="sparkle s2" style={{ top: 2, right: "0%", color: gema }}>✦</span>
          <span className="sparkle s3" style={{ bottom: 10, left: "-2%", color: r.accent }}>✦</span>
        </>
      )}
      {r.particulas >= 6 && (
        <>
          <span className="sparkle s4" style={{ top: -12, right: "12%", color: "#fff" }}>✦</span>
          <span className="sparkle s5" style={{ bottom: 4, right: "-4%", color: gema }}>✦</span>
        </>
      )}

      {/* Marco metálico octogonal facetado */}
      <div className="relative" style={{ width: size + 26, height: size + 26, clipPath: OCT, background: r.metal, padding: 3 }}>
        {/* Brillo que recorre el metal */}
        <div className="shine" />
        {/* Bisel especular superior */}
        <div className="pointer-events-none absolute left-[18%] top-[4%] h-[10%] w-[50%] rounded-full bg-white/35 blur-[3px]" data-especular />
        {/* Interior con profundidad 3D */}
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden"
          style={{
            clipPath: OCT,
            background: "radial-gradient(circle at 35% 28%, #221a2e 0%, #120d09 72%)",
            boxShadow: "inset 0 2px 6px rgba(255,255,255,0.18), inset 0 -5px 12px rgba(0,0,0,0.85)",
          }}>
          {children}
        </div>
      </div>

      {/* Gema-emblema superior (color de la categoría) */}
      <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
        <Gema color={gema} size={r.particulas >= 5 ? 24 : 17} />
      </div>

      {/* Placa de rango */}
      {showLabel && (
        <div className="relative z-10 -mt-2 px-4 py-1 text-center"
          style={{
            background: "linear-gradient(180deg, rgba(10,7,16,0.9), rgba(10,7,16,0.98))",
            border: `1px solid ${r.accent}88`,
            clipPath: "polygon(8% 0, 92% 0, 100% 50%, 92% 100%, 8% 100%, 0 50%)",
            boxShadow: `0 0 12px ${r.accent}44`,
          }}>
          <p className="whitespace-nowrap text-[10px] font-black uppercase tracking-widest" style={{ color: r.accent }}>
            🏆 Nv {r.nivel} · {r.rango}{r.tier && ` ${r.tier}`}
          </p>
          {r.faltan > 0 && (
            <p className="whitespace-nowrap text-[8px] font-bold text-white/50">
              A {r.faltan} pts de {r.proximo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
