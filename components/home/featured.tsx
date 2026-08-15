import BusinessCard from "@/components/business/card";
import type { Business } from "@/lib/data";

export default function Featured({ list, title, userCoords }: {
  list: Business[]; title: string; userCoords?: { lat: number; lon: number } | null;
}) {
  return (
    <section id="destacados" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--accent2)]">Directorio</p>
          <h2 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>{title}</h2>
        </div>
        {list.length > 0 && <a href="/negocios" className="text-sm text-[var(--muted)] hover:text-white">Explorar todo →</a>}
      </div>
      {list.length === 0 ? (
        <div className="sld-card rounded-2xl p-12 text-center">
          <div className="text-4xl">⌕</div>
          <p className="mt-4 font-semibold">No encontramos resultados</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Probá con otra palabra o elegí una categoría.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.slice(0, 12).map((b) => <BusinessCard key={b.id} b={b} userCoords={userCoords} />)}
        </div>
      )}
    </section>
  );
}
