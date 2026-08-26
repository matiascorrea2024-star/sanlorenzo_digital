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

const TRUST: { icon: LucideIcon; label: string; iconClass: string }[] = [
  { icon: BadgeCheck, label: "Comercios verificados", iconClass: "text-[var(--ok)]" },
  { icon: Flame, label: "Ofertas reales", iconClass: "text-[var(--accent)]" },
  { icon: MapPin, label: "100% San Lorenzo", iconClass: "text-[var(--place)]" },
  { icon: Sparkles, label: "Gratis para vecinos", iconClass: "text-[var(--bad)]" },
];

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
    <section className="relative overflow-hidden bg-[var(--bg)] text-[var(--text)]">
      {/* Orbs de marca -- gradientes estáticos, costo cero */}
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[70%] w-[70%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[1700px] px-4 pb-12 pt-12 sm:px-6 md:pb-16 md:pt-20">
        <div className="grid items-end gap-12 lg:grid-cols-[1.35fr_.65fr] lg:gap-16">
          <div>
            <p className="mb-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
              <MapPin className="h-4 w-4" /> World Class · San Lorenzo, Santa Fe
            </p>

            <h1 className="font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.85] tracking-tight">
              LA GRAN
              <span className="knockout-text magenta-glow block">BARATA</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-[#c4b5a5] md:text-lg">
              Todas las ofertas y negocios de San Lorenzo en un solo lugar.
              Encontrá lo que necesitás y hablá directo con quien lo vende.
            </p>

            <div className="mt-9 max-w-2xl">
              <SmartSearch
                placeholder="Buscá notebooks, pizza, peluquería, zapatillas..."
                onPlainSearch={(term) => onSearch && onSearch(term)}
                shortcutSlash
              />
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Probá con</span>
                {sugerencias.map((sug) => (
                  <button key={sug} onClick={() => onSearch && onSearch(sug)}
                    className="rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] px-3.5 py-1.5 text-xs font-bold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]">
                    {sug}
                  </button>
                ))}
              </div>
              <button onClick={() => onSearch?.("ofertas")}
                className="btn-hard mt-8 inline-flex items-center gap-3 rounded-xl bg-[var(--accent)] px-8 py-4 text-sm font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "var(--font-display)" }}>
                Explorar ofertas <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <aside className="lg:border-l lg:border-[var(--line-strong)] lg:pl-12">
            <div className="mb-8 flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
              <span className="live-dot !h-2.5 !w-2.5" aria-hidden="true" /> En tu ciudad, hoy
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <span className="magenta-glow block font-display text-4xl leading-none tabular-nums text-[var(--text)] md:text-5xl">{s.value}</span>
                  <span className="mt-3 block text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>{s.label}</span>
                  {s.sub && <span className="mt-1 block text-xs font-bold text-[var(--accent)]">{s.sub}</span>}
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--ov-03)] p-5">
              <p className="text-sm leading-relaxed text-[#c4b5a5]">
                <span className="font-black text-white">Sin vueltas, sin intermediarios.</span><br />
                Contactá al comercio por WhatsApp y resolvé en el barrio.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* Barra de confianza */}
      <div className="relative z-10 border-y border-[var(--line)] bg-[var(--ov-02)]">
        <div ref={trustRef} className="mx-auto grid max-w-[1700px] grid-cols-2 gap-y-3 px-4 py-4 sm:px-6 md:grid-cols-4 md:gap-4">
          {TRUST.map(({ icon: Icon, label, iconClass }) => (
            <div key={label} className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: "var(--font-display)" }}>
              <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
