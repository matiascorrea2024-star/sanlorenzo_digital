"use client";
import { useEffect, useRef, useState } from "react";
import { Search, MapPin, Sparkles, BadgeCheck, Flame } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface HeroProps {
  onSearch?: (query: string) => void;
  stats?: { promos: number; negocios: number; pronto: number };
}

const plural = (n: number, sing: string, plur: string) => (n === 1 ? sing : plur);

const TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: BadgeCheck, label: "Comercios verificados" },
  { icon: Flame, label: "Ofertas reales, no humo" },
  { icon: MapPin, label: "100% San Lorenzo" },
  { icon: Sparkles, label: "Gratis para vecinos" },
];

export default function Hero({ onSearch, stats }: HeroProps) {
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setIsVisible(true); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const handleSearch = () => {
    if (onSearch && search.trim()) onSearch(search.trim());
  };

  const sugerencias = ["zapatillas", "pizza", "peluquería", "ferretería", "ofertas"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      <div className="absolute inset-0 opacity-25">
        <div className="absolute top-0 left-1/4 h-80 w-80 rounded-full bg-red-600 mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-orange-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 h-80 w-80 rounded-full bg-pink-600 mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div
        className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
        <div className={`text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-xs font-medium text-orange-300">San Lorenzo · Santa Fe</span>
          </div>

          <h1 className="mb-4 text-4xl font-black tracking-tight md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">LA GRAN</span>{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent animate-gradient">BARATA DIGITAL</span>
          </h1>

          <p className={`mx-auto mb-6 max-w-2xl text-base text-white/60 md:text-lg transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            Las ofertas y promos de San Lorenzo, publicadas por los comercios en tiempo real.{" "}
            <span className="font-bold text-orange-300">Que no se te escape ninguna.</span>
          </p>

          <div className={`mx-auto max-w-2xl transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 opacity-75 blur transition duration-1000 group-hover:opacity-100 animate-gradient" />
              <div className="relative flex items-center rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-xl">
                <Search className="ml-4 h-5 w-5 text-white/50" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Buscar ofertas, negocios, productos..."
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:outline-none"
                />
                <kbd className="mr-2 hidden h-6 w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[10px] font-bold text-white/40 md:flex">/</kbd>
                <button
                  onClick={handleSearch}
                  className="btn-shine flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-bold text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50"
                >
                  <Search className="h-4 w-4" />
                  Buscar
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {sugerencias.map((sug) => (
                <button
                  key={sug}
                  onClick={() => { setSearch(sug); if (onSearch) onSearch(sug); }}
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
