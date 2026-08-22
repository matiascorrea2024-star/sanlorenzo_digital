"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Sparkles, BadgeCheck, Flame, ArrowRight } from "lucide-react";
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
  { icon: Flame, label: "Ofertas reales", color: "orange" },
  { icon: MapPin, label: "100% San Lorenzo", color: "sky" },
  { icon: Sparkles, label: "Gratis para vecinos", color: "pink" },
];

const TRUST_STYLE: Record<string, { icon: string }> = {
  emerald: { icon: "text-[var(--ok)]" },
  orange: { icon: "text-[var(--accent)]" },
  sky: { icon: "text-[var(--place)]" },
  pink: { icon: "text-[var(--bad)]" },
};

export default function Hero({ onSearch, stats }: HeroProps) {
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });
  const trustRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !trustRef.current) return;
    gsap.fromTo(trustRef.current.children, { opacity: 0, y: 8 }, {
      opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out", delay: 0.25,
    });
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
    { value: display.promos, label: plural(display.promos, "promoción activa", "promociones activas"), sub: display.pronto > 0 ? `${display.pronto} ${plural(display.pronto, "termina", "terminan")} pronto` : undefined },
    { value: display.negocios, label: plural(display.negocios, "negocio", "negocios") },
  ];

  return (
    <section className="editorial-hero relative overflow-hidden">
      <div className="editorial-hero-rule" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 md:pb-14 md:pt-14">
        <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_.7fr] lg:gap-16">
          <div>
            <p className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.22em] text-[var(--place)]">
              <MapPin className="h-3.5 w-3.5" /> San Lorenzo, Santa Fe
            </p>
            <h1 className="max-w-3xl text-[clamp(3.3rem,8vw,7.5rem)] font-black leading-[.87] tracking-[-.07em]" style={{ fontFamily: "var(--font-ticket)" }}>
              Lo bueno
              <span className="block text-[var(--accent)]">está cerca.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
              Ofertas, negocios y productos reales de tu ciudad. Encontrá lo que necesitás y hablá directo con quien lo vende.
            </p>
            <div className="mt-8 max-w-2xl">
              <SmartSearch
                placeholder="¿Qué estás buscando?"
                onPlainSearch={(term) => onSearch && onSearch(term)}
                shortcutSlash
              />
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted2)]">Probá con</span>
                {sugerencias.map((sug) => (
                  <button key={sug} onClick={() => onSearch && onSearch(sug)} className="border-b border-[var(--line-strong)] pb-0.5 font-semibold text-[var(--text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                    {sug}
                  </button>
                ))}
              </div>
              <button onClick={() => onSearch?.("ofertas")} className="mt-7 inline-flex items-center gap-2 bg-[var(--accent)] px-5 py-3 text-sm font-black text-white shadow-lg shadow-orange-950/20 transition hover:brightness-110">
                Explorar ofertas <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="editorial-hero-aside">
            <div className="mb-7 flex items-center gap-2 text-xs font-bold text-[var(--place)]">
              <span className="h-2 w-2 rounded-full bg-[var(--place)]" /> En tu ciudad, hoy
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-8">
              {STATS.map((s) => (
                <div key={s.label} className="border-t border-[var(--line)] pt-3">
                  <span className="block text-5xl font-black leading-none tabular-nums text-[var(--text)]" style={{ fontFamily: "var(--font-ticket)" }}>{s.value}</span>
                  <span className="mt-2 block text-[11px] font-black uppercase tracking-[.13em] text-[var(--muted2)]">{s.label}</span>
                  {s.sub && <span className="mt-1 block text-xs font-bold text-[var(--accent)]">{s.sub}</span>}
                </div>
              ))}
            </div>
            <div className="mt-10 border-l-2 border-[var(--accent)] pl-4 text-sm leading-relaxed text-[var(--muted)]">
              <span className="font-bold text-[var(--text)]">Sin vueltas, sin intermediarios.</span><br />
              Contactá al comercio por WhatsApp y resolvé en el barrio.
            </div>
          </aside>
        </div>
      </div>

      <div className="editorial-trust border-t border-[var(--line)]">
        <div ref={trustRef} className="mx-auto grid max-w-7xl grid-cols-2 gap-y-3 px-4 py-4 sm:px-6 md:grid-cols-4 md:gap-4">
          {TRUST.map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-[11px] font-bold text-[var(--text)]/75">
              <Icon className={`h-4 w-4 shrink-0 ${TRUST_STYLE[color].icon}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
