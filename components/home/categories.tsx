import { CATEGORIES } from "@/lib/data";

const GRADS = [
  "from-orange-500/25 to-pink-500/15",
  "from-sky-500/25 to-cyan-500/15",
  "from-violet-500/25 to-fuchsia-500/15",
  "from-emerald-500/25 to-lime-500/15",
  "from-amber-500/25 to-yellow-500/15",
  "from-rose-500/25 to-red-500/15",
];

export default function Categories({ active, onSelect }: { active: string | null; onSelect: (id: string | null) => void }) {
  return (
    <section id="categorias" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">Explorá</p>
          <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>¿Qué necesitás hoy?</h2>
        </div>
        <a href="/negocios" className="hidden text-sm text-[var(--muted)] transition hover:text-orange-300 sm:block">Ver todos →</a>
      </div>
      <div className="sld-no-scrollbar flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 lg:grid-cols-8">
        {CATEGORIES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onSelect(active === c.id ? null : c.id)}
            data-spot className={`group relative min-w-[112px] overflow-hidden rounded-2xl border p-4 text-left transition duration-300 md:min-w-0 ${
              active === c.id
                ? "border-orange-400/60 bg-orange-500/10 shadow-lg shadow-orange-500/10"
                : "border-white/[.08] bg-white/[.025] hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.05] hover:shadow-xl hover:shadow-black/40"
            }`}
          >
            <span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-xl transition duration-300 group-hover:rotate-6 group-hover:scale-110 ${GRADS[i % GRADS.length]}`}>
              {c.icon}
            </span>
            <span className="mt-3 block text-sm font-bold">{c.name}</span>
            <span className={`mt-0.5 block text-[11px] transition ${active === c.id ? "text-orange-300" : "text-white/40 group-hover:text-orange-300"}`}>
              {active === c.id ? "✓ Filtrando" : "Descubrir →"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
