"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";

export default function BuscarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("cat") || "");
  const [mode, setMode] = useState(searchParams.get("modo") || "");
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !mode) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("cat", category);
    if (mode) params.set("modo", mode);
    router.push(`/negocios?${params.toString()}`);
  };

  return (
    <main className="sld-editorial-page min-h-screen text-[var(--text)]">
      {/* Hero Section */}
      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,.16),transparent_65%)]" />
        <div className="mb-8 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.25em] text-orange-300">
            <Search className="h-3.5 w-3.5" /> Buscador local
          </span>
          <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
            Buscá lo que necesitás
          </h1>
          <p className="text-lg text-[var(--muted)]">
            Encontrá comercios y productos en San Lorenzo al instante
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
          <div className="relative mb-4 rounded-[1.5rem] border border-orange-400/30 bg-[var(--ov-03)] p-1.5 shadow-2xl shadow-orange-950/20 backdrop-blur-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Pizza, ropa, ferretería, peluquería..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Qué querés encontrar"
              className="w-full rounded-[1.1rem] border border-[var(--line)] bg-[var(--surface)] px-4 py-4 pl-12 text-[var(--text)] placeholder-[var(--muted)] focus:border-orange-500 focus:outline-none"
            />
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted)]" />
          </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3.5 font-black text-white shadow-lg shadow-orange-950/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Buscando..." : "Buscar ahora"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <div className="mt-4 flex justify-center gap-2" role="group" aria-label="Momento de búsqueda">
            {([["", "Todo"], ["ahora", "Ahora"], ["esta-noche", "Esta noche"]] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMode(value)} className={`sld-filter-light ${mode === value ? "is-active" : ""}`}>
                {label}
              </button>
            ))}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="sld-card rounded-2xl p-6">
            <MapPin className="mb-3 h-6 w-6 text-orange-500" />
            <h3 className="mb-2 font-semibold">100% San Lorenzo</h3>
            <p className="text-sm text-[var(--muted)]">
              Solo comercios y negocios locales verificados
            </p>
          </div>
          <div className="sld-card rounded-2xl p-6">
            <AlertCircle className="mb-3 h-6 w-6 text-orange-500" />
            <h3 className="mb-2 font-semibold">Ofertas Reales</h3>
            <p className="text-sm text-[var(--muted)]">
              Solo promociones vigentes de comercios verificados
            </p>
          </div>
          <div className="sld-card rounded-2xl p-6">
            <ShieldCheck className="mb-3 h-6 w-6 text-orange-500" />
            <h3 className="mb-2 font-semibold">Filtros Avanzados</h3>
            <p className="text-sm text-[var(--muted)]">
              Filtrá por barrio, horario, envíos y más
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
