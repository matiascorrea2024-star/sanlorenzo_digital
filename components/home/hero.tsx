"use client";
import { useEffect, useState } from "react";
import { MapPin, Sparkles, BadgeCheck, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import SmartSearch from "@/components/ui/smart-search";
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
    <section className="relative bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Decoración: overflow-hidden va acá, no en la section -- si no,
          recorta el dropdown del buscador inteligente que aparece por
          debajo del buscador (necesita desbordar la altura del hero). */}
      <div className="absolute inset-0 overflow-hidden opacity-25">
        <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-red-600 mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-orange-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-pink-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div
        className="absolute inset-0 overflow-hidden opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className="fade-up text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">San Lorenzo · Santa Fe</span>
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">LA GRAN</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent animate-gradient">BARATA DIGITAL</span>
          </h1>

          <p className="fade-up-2 mx-auto mb-6 max-w-2xl text-base text-white/60 md:text-lg">
            Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
            <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
          </p>

          <div className="fade-up-3 mx-auto max-w-2xl">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 opacity-75 blur transition duration-1000 group-hover:opacity-100 animate-gradient" />
              <div className="relative">
                <SmartSearch
                  placeholder="Buscar ofertas, negocios, productos..."
                  onPlainSearch={(term) => onSearch && onSearch(term)}
                  shortcutSlash
                  seedNegocios={seedNegocios}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
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

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-orange-400 tabular-nums md:text-3xl">{display.promos}</span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.promos, "promoción activa", "promociones activas")}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-white tabular-nums md:text-3xl">{display.negocios}</span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.negocios, "negocio", "negocios")}</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-amber-400 tabular-nums md:text-3xl">{display.pronto}</span>
              <span className="text-left text-[11px] leading-tight text-white/60">{plural(display.pronto, "termina hoy", "terminan pronto")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-sm">
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
