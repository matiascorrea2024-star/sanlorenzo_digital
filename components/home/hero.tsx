"use client";
import { useEffect, useState } from "react";
import { MapPin, Sparkles, BadgeCheck, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SmartSearch from "@/components/ui/smart-search";
import Skyline from "@/components/home/skyline";
import type { FullBusiness } from "@/lib/use-businesses";

interface HeroProps {
  onSearch?: (query: string) => void;
  stats?: { promos: number; negocios: number; pronto: number };
  seedNegocios?: FullBusiness[];
}

const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Comercios verificados" },
  { icon: Flame, label: "Ofertas reales, no humo" },
  { icon: MapPin, label: "100% San Lorenzo" },
  { icon: Sparkles, label: "Gratis para vecinos" },
];

export default function Hero({ onSearch, stats, seedNegocios }: HeroProps) {
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });

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

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#120d09] via-[#1c150e] to-[#120d09]">
      {/* Perfil real de San Lorenzo (silos + grúa portuaria + barcaza sobre
          el Paraná) en vez de blobs abstractos -- la identidad viene del
          lugar, no de un gradiente genérico. Se funde hacia arriba para no
          competir con el texto. */}
      <Skyline
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-[#2a2015] opacity-70 [mask-image:linear-gradient(to_top,black_55%,transparent_100%)] md:h-56"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="fade-up text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">San Lorenzo · Santa Fe</span>
          </div>

          <h1 className="mb-4 leading-[0.95]">
            <span
              className="block text-3xl font-bold tracking-tight text-white md:text-5xl"
              style={{ fontFamily: "var(--font-space)" }}
            >
              LA GRAN
            </span>
            <span
              className="relative mt-1 inline-block -rotate-1 text-5xl font-black uppercase tracking-tight text-orange-400 md:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-ticket)" }}
            >
              Barata Digital
              <span className="absolute -right-3 -top-2 text-xl text-red-500 md:-right-5 md:-top-3 md:text-3xl">°</span>
            </span>
          </h1>

          <p className="fade-up-2 mx-auto mb-6 max-w-2xl text-base text-white/60 md:text-lg">
            Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
            <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
          </p>

          <div className="fade-up-3 mx-auto max-w-2xl">
            <div className="hero-search rounded-2xl transition-shadow duration-300">
              <SmartSearch
                placeholder="Buscar ofertas, negocios, productos..."
                onPlainSearch={(term) => onSearch && onSearch(term)}
                shortcutSlash
                seedNegocios={seedNegocios}
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {sugerencias.map((sug) => (
                <button
                  key={sug}
                  onClick={() => onSearch && onSearch(sug)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <span className="text-2xl tabular-nums text-orange-400 md:text-3xl" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>
                {display.promos}
              </span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.promos, "promoción activa", "promociones activas")}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-2xl tabular-nums text-white md:text-3xl" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>
                {display.negocios}
              </span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.negocios, "negocio", "negocios")}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-2xl tabular-nums text-red-500 md:text-3xl" style={{ fontFamily: "var(--font-ticket)", fontWeight: 700 }}>
                {display.pronto}
              </span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.pronto, "termina hoy", "terminan pronto")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Franja tipo talonario de ticket -- borde punteado simulando el
          desgarro, no otro panel de vidrio esmerilado. */}
      <div className="relative z-10 border-t border-dashed border-white/15 bg-black/25">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 text-[11px] font-semibold text-white/45">
              <Icon className="h-3.5 w-3.5 text-orange-400/70" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
