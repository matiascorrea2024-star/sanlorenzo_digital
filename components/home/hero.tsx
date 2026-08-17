"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Sparkles, BadgeCheck, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import SmartSearch from "@/components/ui/smart-search";

interface HeroProps {
  onSearch?: (query: string) => void;
  stats?: { promos: number; negocios: number; pronto: number };
}

const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

const TRUST: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: BadgeCheck, label: "Comercios verificados", color: "emerald" },
  { icon: Flame, label: "Ofertas reales, no humo", color: "orange" },
  { icon: MapPin, label: "100% San Lorenzo", color: "sky" },
  { icon: Sparkles, label: "Gratis para vecinos", color: "pink" },
];

const TRUST_STYLE: Record<string, { icon: string; ring: string; glow: string }> = {
  emerald: { icon: "text-emerald-300", ring: "border-emerald-400/30 bg-emerald-500/10", glow: "shadow-emerald-500/20" },
  orange: { icon: "text-orange-300", ring: "border-orange-400/30 bg-orange-500/10", glow: "shadow-orange-500/20" },
  sky: { icon: "text-sky-300", ring: "border-sky-400/30 bg-sky-500/10", glow: "shadow-sky-500/20" },
  pink: { icon: "text-red-300", ring: "border-red-400/30 bg-red-600/10", glow: "shadow-red-600/20" },
};

export default function Hero({ onSearch, stats }: HeroProps) {
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });
  const trustRef = useRef<HTMLDivElement>(null);

  // Entrada real (no solo CSS instantáneo) de la barra de confianza --
  // respeta prefers-reduced-motion, y si por lo que sea GSAP no corre
  // (SSR/primer paint) los badges igual son visibles por default.
  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!trustRef.current) return;
    gsap.fromTo(trustRef.current.children,
      { opacity: 0, y: 10, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(1.7)", delay: 0.5 }
    );
  }, { scope: trustRef });

  useEffect(() => {
    const targets = stats || { promos: 0, negocios: 0, pronto: 0 };
    const steps = 24;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = 1 - Math.pow(1 - step / steps, 3);
      setDisplay({
        promos: Math.round(targets.promos * p),
        negocios: Math.round(targets.negocios * p),
        pronto: Math.round(targets.pronto * p),
      });
      if (step >= steps) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [stats]);

  const sugerencias = ["zapatillas", "pizza", "peluquería", "ferretería", "ofertas"];

  const STATS = [
    { value: display.promos, label: plural(display.promos, "promoción activa", "promociones activas"), color: "text-orange-400" },
    { value: display.negocios, label: plural(display.negocios, "negocio", "negocios"), color: "text-[var(--text)]" },
    { value: display.pronto, label: plural(display.pronto, "termina hoy", "terminan pronto"), color: "text-amber-400" },
  ];

  return (
    <section className="relative bg-[#0c0a0b]">
      {/* Decoración: overflow-hidden va acá, no en la section -- si no,
          recorta el dropdown del buscador inteligente que aparece por
          debajo del buscador (necesita desbordar la altura del hero). */}
      <div className="absolute inset-0 overflow-hidden opacity-25">
        <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-red-600 mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-orange-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-red-700 mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div
        className="absolute inset-0 overflow-hidden opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 md:pb-16 md:pt-20">
        {/* Momento tipográfico grande, alineado a la izquierda -- editorial,
            no un banner centrado más. El buscador y las estadísticas viven
            en tarjetas de vidrio aparte, en grilla asimétrica 8/4. */}
        <div className="fade-up mb-10 md:mb-14">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">San Lorenzo · Santa Fe</span>
          </div>
          <h1 className="text-[15vw] font-black leading-[0.85] tracking-tighter sm:text-7xl md:text-8xl lg:text-[8.5rem]" style={{ fontFamily: "var(--font-space)" }}>
            <span className="block text-[var(--text)]">LA GRAN</span>
            <span className="block bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">BARATA DIGITAL</span>
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Buscador -- bloque principal (8/12) */}
          <div className="fade-up-2 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5 lg:col-span-8">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] sm:p-8">
              <p className="mb-2 text-lg font-bold text-[var(--text)] sm:text-xl" style={{ fontFamily: "var(--font-space)" }}>
                ¿Qué estás buscando hoy en tu ciudad?
              </p>
              <p className="mb-5 max-w-lg text-sm text-[var(--muted)]">
                Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
                <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
              </p>
              <div className="group relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-red-600 opacity-60 blur transition duration-1000 group-hover:opacity-90 animate-gradient" />
                <div className="relative">
                  <SmartSearch
                    placeholder="Buscar ofertas, negocios, productos..."
                    onPlainSearch={(term) => onSearch && onSearch(term)}
                    shortcutSlash
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {sugerencias.map((sug) => (
                  <button
                    key={sug}
                    onClick={() => onSearch && onSearch(sug)}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Estadísticas -- panel lateral (4/12), apiladas */}
          <div className="fade-up-3 grid grid-cols-3 gap-4 lg:col-span-4 lg:grid-cols-1">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
                <div className="flex h-full flex-col items-center justify-center rounded-[1.375rem] border border-white/[.05] bg-black/20 px-3 py-5 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] sm:py-6">
                  <span className={`text-3xl font-black tabular-nums sm:text-4xl ${s.color}`} style={{ fontFamily: "var(--font-ticket)" }}>{s.value}</span>
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40 sm:text-[11px]">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[.06] bg-black/20 backdrop-blur-sm">
        <div ref={trustRef} className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:px-6 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label, color }) => {
            const s = TRUST_STYLE[color];
            return (
              <div key={label} className="flex items-center justify-center gap-2 text-[12px] font-bold text-white/80">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-lg ${s.ring} ${s.glow}`}>
                  <Icon className={`h-3.5 w-3.5 ${s.icon}`} />
                </span>
                {label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
