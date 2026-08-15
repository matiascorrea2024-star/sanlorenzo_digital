import Link from "next/link";
import BusinessCard from "@/components/business/card";
import SectionTitle from "@/components/ui/section-title";
import type { Business } from "@/lib/data";

export default function Featured({ list, title, userCoords }: {
  list: Business[]; title: string; userCoords?: { lat: number; lon: number } | null;
}) {
  return (
    <section id="destacados" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16">
      <SectionTitle
        eyebrow="Directorio"
        title={title}
        action={
          list.length > 0 ? (
            <Link href="/negocios" className="text-sm text-[var(--muted)] hover:text-white">Explorar todo →</Link>
          ) : undefined
        }
      />
      {list.length === 0 ? (
        <div className="sld-card rounded-2xl px-6 py-8 text-center">
          <p className="font-semibold">No encontramos resultados</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Probá con otra palabra o elegí otra categoría.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.slice(0, 12).map((b) => (
            <div key={b.id} className="stagger-item">
              <BusinessCard b={b} userCoords={userCoords} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
