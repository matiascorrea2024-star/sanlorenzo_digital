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
  emerald: { icon: "text-[var(--ok)]", ring: "border-emerald-400/30 bg-emerald-500/10", glow: "shadow-emerald-500/20" },
  orange: { icon: "text-orange-300", ring: "border-orange-400/30 bg-orange-500/10", glow: "shadow-orange-500/20" },
  sky: { icon: "text-[var(--place)]", ring: "border-sky-400/30 bg-sky-500/10", glow: "shadow-sky-500/20" },
  pink: { icon: "text-[var(--bad)]", ring: "border-red-400/30 bg-red-600/10", glow: "shadow-red-600/20" },
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

  // "Termina hoy" no tiene tarjeta propia (el mockup aprobado mostraba
  // solo 2 tarjetas apiladas) -- se cuela como nota chica dentro de la
  // tarjeta de promociones en vez de perder ese dato real.
  const STATS = [
    { value: display.promos, label: plural(display.promos, "promoción activa", "promociones activas"), sub: display.pronto > 0 ? `${display.pronto} ${plural(display.pronto, "termina", "terminan")} hoy` : undefined },
    { value: display.negocios, label: plural(display.negocios, "negocio", "negocios") },
  ];

  return (
    <section className="relative overflow-hidden bg-[var(--bg)]">
      {/* Decoración: overflow-hidden va en un layer propio, no en la
          section -- si no, recorta el dropdown del buscador inteligente
          que necesita desbordar la altura del hero. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
        <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-red-600 mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-orange-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-red-700 mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />
      {/* Auroras premium fijas en las esquinas, como en el diseño aprobado. */}
      <div className="pointer-events-none absolute -left-[10%] -top-[20%] h-[60vw] w-[60vw] max-h-[560px] max-w-[560px] rounded-full bg-orange-600 opacity-[.15] blur-[120px]" />
      <div className="pointer-events-none absolute -right-[10%] -bottom-[20%] h-[60vw] w-[60vw] max-h-[560px] max-w-[560px] rounded-full bg-red-800 opacity-[.15] blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 md:pb-20 md:pt-20">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-300">San Lorenzo · Santa Fe</span>
        </div>

        {/* Momento tipográfico: 3 líneas apiladas, la última alineada a
            la derecha, líneas 1 y 3 solo con contorno (sin relleno) y
            la del medio con el degradé de marca -- tal cual el diseño
            aprobado en Superdesign. */}
        <div className="relative mb-16 md:mb-20">
          <h1
            className="flex flex-col font-black uppercase leading-[0.85] tracking-tighter"
            style={{ fontFamily: "var(--font-space)", fontSize: "clamp(3.2rem, 15vw, 10rem)" }}
          >
            <span style={{ WebkitTextStroke: "1.5px var(--text-stroke)", color: "transparent" }}>LA GRAN</span>
            <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">BARATA</span>
            <span className="text-right" style={{ WebkitTextStroke: "1.5px var(--text-stroke)", color: "transparent" }}>DIGITAL</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)] md:absolute md:right-0 md:top-1/2 md:mt-0 md:-translate-y-1/2 md:text-right md:text-base">
            Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
            <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
          </p>
        </div>

        {/* Grilla editorial 8/4: buscador como bloque principal + panel
            de 2 tarjetas de estadística apiladas. */}
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="group relative lg:col-span-8">
            <div className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-8 md:p-12">
              <div className="pointer-events-none absolute -right-[10%] -top-[10%] aspect-square w-[60%] rounded-full bg-gradient-to-br from-orange-500 to-red-600 opacity-10 blur-[100px]" />
              <div className="relative z-10">
                <span className="mb-8 inline-block rounded-full border border-orange-500/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Búsqueda inteligente
                </span>
                <h2 className="max-w-xl text-3xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>
                  ¿Qué estás buscando hoy en tu ciudad?
                </h2>
              </div>
              <div className="relative z-10 mt-10 w-full max-w-2xl">
                <SmartSearch
                  placeholder="Buscar ofertas, negocios, productos..."
                  onPlainSearch={(term) => onSearch && onSearch(term)}
                  shortcutSlash
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {sugerencias.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => onSearch && onSearch(sug)}
                      className="rounded-full border border-[var(--line)] bg-[var(--ov-05)] px-4 py-1.5 text-sm text-[var(--muted)] backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-[var(--line-strong)] hover:bg-[var(--ov-10)]"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-1 flex-col items-center justify-center rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:p-10">
                <span className="text-5xl font-black tabular-nums text-[var(--text)] sm:text-6xl" style={{ fontFamily: "var(--font-space)" }}>{s.value}</span>
                <span className="mt-2 text-xs font-black uppercase tracking-widest text-[var(--muted2)]">{s.label}</span>
                {s.sub && <span className="mt-2 text-[11px] font-bold text-orange-400">{s.sub}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-[var(--ov-06)] bg-[var(--card-inner)] backdrop-blur-sm">
        <div ref={trustRef} className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-4 sm:px-6 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label, color }) => {
            const s = TRUST_STYLE[color];
            return (
              <div key={label} className="flex items-center justify-center gap-2 text-[12px] font-bold text-[var(--text)]/80">
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
