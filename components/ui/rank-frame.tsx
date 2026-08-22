"use client";

import type { CSSProperties, ReactNode } from "react";
import { rangoDe, gemaDe } from "@/lib/ranks";

type Props = {
  puntos: number;
  size: number;
  categoria?: string;
  children: ReactNode;
  badge?: ReactNode;
  className?: string;
};

export default function RankFrame({ puntos, size, categoria, children, badge, className = "" }: Props) {
  const rango = rangoDe(puntos);
  const gema = gemaDe(categoria);
  const style = {
    "--rank-accent": rango.accent,
    "--rank-gem": gema,
    width: size,
    height: size,
  } as CSSProperties;

  return (
    <span
      className={`rank-frame rank-level-${rango.nivel} relative inline-block shrink-0 ${className}`}
      data-rank-level={rango.nivel}
      data-rank-name={rango.rango}
      style={style}
      title={`Nivel ${rango.nivel} · ${rango.rango}${rango.tier ? ` ${rango.tier}` : ""}`}
    >
      <span className="rank-frame-aura" style={{ background: rango.glow }} aria-hidden="true" />
      <span className="rank-frame-core" style={{ background: rango.metal }}>
        <span className="rank-frame-energy" aria-hidden="true" />
        <span className="rank-frame-inner">{children}</span>
        <span className="rank-frame-glint" aria-hidden="true" />
      </span>
      {rango.nivel >= 4 && <span className="rank-spark rank-spark-a" aria-hidden="true">✦</span>}
      {rango.nivel >= 6 && <span className="rank-spark rank-spark-b" aria-hidden="true">✧</span>}
      {rango.nivel >= 7 && <span className="rank-spark rank-spark-c" aria-hidden="true">·</span>}
      {badge}
    </span>
  );
}
