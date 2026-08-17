import Link from "next/link";
import BusinessCard from "@/components/business/card";
import SectionTitle from "@/components/ui/section-title";

export default function Featured({ list, title, userCoords }: {
  // any[]: acá llegan filas reales de Supabase (con destacado/plan/etc.),
  // no el tipo Business de lib/data.ts (ese es solo semilla de desarrollo).
  list: any[]; title: string; userCoords?: { lat: number; lon: number } | null;
}) {
  return (
    <section id="destacados" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <SectionTitle
        eyebrow="Directorio"
        title={title}
        action={
          list.length > 0 ? (
            <Link href="/negocios" className="text-sm text-[var(--muted)] hover:text-[var(--text)]">Explorar todo →</Link>
          ) : undefined
        }
      />
      {list.length === 0 ? (
        <div className="sld-card rounded-2xl px-6 py-8 text-center">
          <p className="font-semibold">No encontramos resultados</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Probá con otra palabra o elegí otra categoría.</p>
        </div>
      ) : (
        // Bento: el negocio con Destacado Semanal (plan pago) se lleva el
        // bloque grande -- la jerarquía queda en la estructura, no en un
        // badge más. Si nadie pagó destacado todavía, la grilla queda
        // pareja (no se inventa un "destacado" que no es real).
        <div className="grid auto-rows-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.slice(0, 12).map((b, i) => {
            const featured = i === 0 && !!b.destacado;
            return (
              <div key={b.id} className={`stagger-item ${featured ? "sm:col-span-2 sm:row-span-2" : ""}`}>
                <BusinessCard b={b} userCoords={userCoords} featured={featured} />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
