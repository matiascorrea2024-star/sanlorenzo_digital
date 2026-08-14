"use client";
import { useEffect, useState } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";

interface HeroProps {
  onSearch?: (query: string) => void;
  stats?: { promos: number; negocios: number; pronto: number };
}

export default function Hero({ onSearch, stats }: HeroProps) {
  const [display, setDisplay] = useState({ promos: 0, negocios: 0, pronto: 0 });
  const [search, setSearch] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Count-up animado
  useEffect(() => {
    const targets = stats || { promos: 0, negocios: 0, pronto: 0 };
    const duration = 1500;
    const steps = 30;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      setDisplay({
        promos: Math.floor(targets.promos * progress),
        negocios: Math.floor(targets.negocios * progress),
        pronto: Math.floor(targets.pronto * progress),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const handleSearch = () => {
    if (onSearch && search.trim()) {
      onSearch(search.trim());
    }
  };

  const sugerencias = ["zapatillas", "pizza", "peluquería", "ferretería", "ofertas"];

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
      {/* Fondo animado con gradientes */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-orange-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid de puntos decorativos */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      {/* Contenido principal */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 md:py-32">
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* Badge superior */}
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 mb-8 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-300">San Lorenzo · Santa Fe</span>
          </div>

          {/* Título principal con gradiente */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
              LA GRAN
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              BARATA DIGITAL
            </span>
          </h1>

          {/* Contadores animados */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-8">
            <div className={`flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-white/5 backdrop-blur-md px-6 py-3 transition-all duration-500 delay-300 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <span className="text-3xl md:text-4xl font-black text-orange-400">{display.promos}</span>
              <span className="text-sm text-white/70">promociones<br/>activas</span>
            </div>
            <div className={`flex items-center gap-2 rounded-2xl border border-purple-500/20 bg-white/5 backdrop-blur-md px-6 py-3 transition-all duration-500 delay-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <span className="text-3xl md:text-4xl font-black text-purple-400">{display.negocios}</span>
              <span className="text-sm text-white/70">negocios<br/>registrados</span>
            </div>
            <div className={`flex items-center gap-2 rounded-2xl border border-pink-500/20 bg-white/5 backdrop-blur-md px-6 py-3 transition-all duration-500 delay-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
              <span className="text-3xl md:text-4xl font-black text-pink-400">{display.pronto}</span>
              <span className="text-sm text-white/70">terminan<br/>pronto</span>
            </div>
          </div>

          {/* Descripción */}
          <p className={`text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto transition-all duration-700 delay-900 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            Todas las ofertas, promociones y negocios de San Lorenzo en un solo lugar.
          </p>

          {/* Buscador con glassmorphism */}
          <div className={`max-w-2xl mx-auto transition-all duration-700 delay-1100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2">
                <Search className="w-5 h-5 text-white/50 ml-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Buscar negocios, productos, servicios..."
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder-white/50 focus:outline-none"
                />
                <button 
                  onClick={handleSearch}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-bold text-white hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                >
                  🔍 Buscar
                </button>
              </div>
            </div>

            {/* Sugerencias de búsqueda */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {sugerencias.map((sug, i) => (
                <button
                  key={sug}
                  onClick={() => {
                    setSearch(sug);
                    if (onSearch) onSearch(sug);
                  }}
                  className={`rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                  style={{ transitionDelay: `${1300 + i * 100}ms` }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Botón de geolocalización */}
          <a href="/mapa" className={`mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md px-6 py-3 text-white/70 hover:bg-white/10 hover:border-white/40 transition-all duration-300 hover:scale-105 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '1700ms' }}>
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Ver negocios cerca mío</span>
          </a>
        </div>
      </div>

      {/* Formas geométricas flotantes */}
      <div className="absolute top-20 right-10 w-20 h-20 border border-orange-500/20 rounded-full animate-float"></div>
      <div className="absolute bottom-20 left-10 w-16 h-16 border border-purple-500/20 rounded-lg rotate-45 animate-float-delayed"></div>
      <div className="absolute top-1/2 right-20 w-12 h-12 border border-pink-500/20 rounded-full animate-float-slow"></div>
    </section>
  );
}
