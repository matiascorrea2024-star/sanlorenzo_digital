"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, MapPin, AlertCircle, ShieldCheck, ArrowRight } from "lucide-react";

export default function BuscarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q");
  const catParam = searchParams.get("cat");
  const modoParam = searchParams.get("modo");
  const [query, setQuery] = useState(qParam || "");
  // La categoría viene de la URL (?cat=): el usuario no la cambia desde acá.
  const [category] = useState(catParam || "");
  const [mode, setMode] = useState(modoParam || "");
  const [loading, setLoading] = useState(false);

  // Esta página es una landing: no muestra resultados. Si llegó acá con una
  // búsqueda (?q= desde un link externo o el sitemap), seguir directo a
  // /negocios en vez de enseñar el hero con la búsqueda ignorada.
  useEffect(() => {
    if (!qParam && !catParam && !modoParam) return;
    const params = new URLSearchParams();
    if (qParam) params.set("q", qParam);
    if (catParam) params.set("cat", catParam);
    if (modoParam) params.set("modo", modoParam);
    router.replace(`/negocios?${params.toString()}`);
  }, [qParam, catParam, modoParam, router]);

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

  if (qParam || catParam || modoParam) {
    // Redirigiendo a resultados: no renderizar la landing (evita el flash).
    return <main className="min-h-screen bg-[var(--bg)]" />;
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Hero Section */}
      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(209,47,104,.14),transparent_65%)]" />
        <div className="mb-10 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
            <Search className="h-3.5 w-3.5" /> Buscador local
          </span>
          <h1 className="font-display text-5xl uppercase leading-[0.9] tracking-tight sm:text-7xl">
            Buscá lo que<br /><span className="knockout-text magenta-glow">necesitás</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base text-[var(--muted)]">
            Encontrá comercios y productos en San Lorenzo al instante
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="relative mx-auto max-w-2xl">
          <div className="relative mb-4 rounded-[2rem] border border-[var(--line-strong)] bg-[var(--ov-05)] p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition focus-within:border-[var(--accent)]">
            <div className="relative">
              <input
                type="text"
                placeholder="Pizza, ropa, ferretería, peluquería..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Qué querés encontrar"
                className="w-full rounded-[1.6rem] border border-[var(--line)] bg-black/30 px-4 py-4 pl-12 text-[var(--text)] outline-none placeholder:text-[var(--muted2)] focus:border-[var(--accent)]"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--accent)]" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-hard inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            style={{ fontFamily: "var(--font-display)", background: "var(--accent)" }}
          >
            {loading ? "Buscando..." : "Buscar ahora"} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </button>
          <div className="mt-5 flex justify-center gap-2" role="group" aria-label="Momento de búsqueda">
            {([["", "Todo"], ["ahora", "Ahora"], ["esta-noche", "Esta noche"]] as const).map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMode(value)}
                className={`rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                  mode === value ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-white"
                }`} style={{ fontFamily: "var(--font-display)" }}>
                {label}
              </button>
            ))}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            { icon: MapPin, t: "100% San Lorenzo", d: "Solo comercios y negocios locales verificados" },
            { icon: AlertCircle, t: "Ofertas Reales", d: "Solo promociones vigentes de comercios verificados" },
            { icon: ShieldCheck, t: "Filtros Avanzados", d: "Filtrá por barrio, horario, envíos y más" },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="card-lift rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]">
              <Icon className="mb-3 h-6 w-6 text-[var(--accent)]" />
              <h3 className="mb-2 font-display text-lg uppercase tracking-wide">{t}</h3>
              <p className="text-sm text-[var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
