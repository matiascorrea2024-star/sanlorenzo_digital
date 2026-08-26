import Link from "next/link";

const COLECCIONES = [
  { id: "gastronomia", titulo: "Semana de la Pizza", icono: "🍕" },
  { id: "ropa", titulo: "Black San Lorenzo", icono: "🖤" },
  { id: "ferreteria", titulo: "Ferreterazo", icono: "🔨" },
  { id: "calzado", titulo: "Temporada de zapatillas", icono: "👟" },
];

export default function Colecciones({ counts }: { counts: Map<string, number> }) {
  // Honestidad primero: una colección sin negocios reales detrás no se muestra.
  const activas = COLECCIONES.filter((c) => (counts.get(c.id) || 0) > 0);
  if (activas.length === 0) return null;

  return (
    <section className="border-b border-[var(--line)] px-4 py-14 sm:px-6 md:py-20" aria-labelledby="colecciones-title">
      <div className="mx-auto max-w-[1700px]">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Momentos que marcan la ciudad</p>
        <h2 id="colecciones-title" className="mt-3 font-display text-4xl uppercase leading-[0.9] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl">
          Eventos y <span className="text-[var(--accent)]">colecciones.</span>
        </h2>

        <div className="custom-scrollbar -mx-4 mt-8 flex gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
          {activas.map((c) => {
            const n = counts.get(c.id) || 0;
            return (
              <Link
                key={c.id}
                href={`/negocios?cat=${c.id}`}
                className="card-lift group w-[15rem] shrink-0 rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]"
              >
                <span className="block text-4xl transition-transform duration-300 group-hover:scale-125 group-hover:-rotate-6" aria-hidden="true">{c.icono}</span>
                <span className="mt-6 block font-display text-lg uppercase leading-tight tracking-wide text-[var(--text)] transition-colors group-hover:text-[var(--accent)]">{c.titulo}</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>
                  {n} {n === 1 ? "negocio" : "negocios"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
