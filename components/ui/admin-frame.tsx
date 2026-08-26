import { ReactNode } from "react";

// Marco exclusivo del equipo de San Lorenzo Digital -- misma estética
// Wild Rift que lib/ranks.ts/DivisionFrame (metal + glow + partículas),
// pero sin ser parte de la escalera de rangos que se gana con puntos:
// esto es identidad de plataforma, no algo que un negocio pueda alcanzar.
export default function AdminFrame({ children, size = 44 }: { children: ReactNode; size?: number }) {
  const ring = size + 14;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: ring, height: ring }}>
      <span className="pointer-events-none absolute inset-0 rounded-full" style={{
        background: "radial-gradient(circle, rgba(250,204,21,0.55) 0%, rgba(220,38,38,0.3) 45%, transparent 75%)",
        transform: "scale(1.7)", filter: "blur(5px)",
      }} />
      <span className="holo-spin pointer-events-none absolute rounded-full" style={{
        width: ring, height: ring,
        background: "conic-gradient(from 0deg, #fbbf24, #f472b6, #22d3ee, #fbbf24)",
      }} />
      <span className="relative overflow-hidden rounded-full p-[3px]" style={{
        width: size + 6, height: size + 6,
        background: "linear-gradient(135deg,#78350f 0%,#fde047 30%,#a16207 55%,#fef08a 80%,#78350f 100%)",
      }}>
        <span className="shine rounded-full" />
        <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[var(--bg)]">
          {children}
        </span>
      </span>
      <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 text-[13px]" style={{ filter: "drop-shadow(0 0 4px rgba(250,204,21,.9))" }}>👑</span>
      <span className="sparkle" style={{ top: -2, left: "2%", color: "#fbbf24" }}>✦</span>
      <span className="sparkle s2" style={{ bottom: 2, right: "0%", color: "#f472b6" }}>✦</span>
      <span className="sparkle s4" style={{ top: "45%", right: "-6%", color: "#22d3ee" }}>✦</span>
    </span>
  );
}

/** Pill inline para usar al lado de texto (nombre en un header, remitente
 * arriba de un mensaje) cuando envolver un avatar entero es demasiado. */
export function AdminBadge({ text = "Equipo San Lorenzo Digital" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-yellow-200"
      style={{
        background: "linear-gradient(135deg,#451a03,#a16207,#451a03)",
        border: "1px solid rgba(253,224,71,0.5)",
        boxShadow: "0 0 10px rgba(250,204,21,0.35)",
      }}>
      👑 {text}
    </span>
  );
}
