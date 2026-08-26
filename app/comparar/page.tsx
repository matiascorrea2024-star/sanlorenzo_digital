"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Package, Star, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Badge from "@/components/ui/badge";
import { calcSDLScore } from "@/lib/sdl-score";
import PageHero from "@/components/ui/page-hero";

function CompararContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam.split(",").filter(Boolean);
  
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (ids.length === 0) { setLoading(false); return; }
      const { data } = await supabase()
        .from("products")
        .select("*, businesses(name, slug, rating, category)")
        .in("id", ids);
      setProductos(data || []);
      setLoading(false);
    })();
  }, [idsParam]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <PageHero title="Comparador" subtitle="Compará negocios y productos de un vistazo" />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-[var(--muted)]">Cargando...</div>
      </main>
    );
  }

  if (productos.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <PageHero title="Comparador" subtitle="Compará negocios y productos de un vistazo" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <div className="mx-auto max-w-md rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-10">
            <Package className="mx-auto h-16 w-16 text-[var(--muted2)] mb-4" />
            <p className="text-[var(--muted)]">No hay productos seleccionados para comparar.</p>
            <Link href="/negocios" className="btn-hard mt-6 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Explorar productos
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const conScore = productos.map(p => ({
    ...p,
    sdlScore: calcSDLScore({
      descuento: p.old_price ? Math.round(((Number(p.old_price) - Number(p.price)) / Number(p.old_price)) * 100) : 0,
      distanciaKm: null,
      rating: Number(p.businesses?.rating || 0),
      diasRestantes: null,
    }),
  }));

  const mejorId = conScore.reduce((best, p) => p.sdlScore > best.sdlScore ? p : best, conScore[0]).id;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <PageHero title="Comparador" subtitle={`Comparando ${productos.length} producto${productos.length !== 1 ? "s" : ""} lado a lado`} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/negocios" className="mb-4 inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-[var(--accent)]">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>

        <div className="mt-8 rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b border-[var(--line-strong)] p-3 text-left text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>Característica</th>
                {conScore.map(p => (
                  <th key={p.id} className="min-w-[180px] border-b border-[var(--line-strong)] p-3 text-center">
                    {p.id === mejorId && (
                      <Badge variant="success" size="sm" className="mb-2">🏆 Mejor opción</Badge>
                    )}
                    <div className="mx-auto mb-2 flex h-24 w-24 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] magenta-glow">
                      <Package className="h-10 w-10 text-[var(--accent)]" />
                    </div>
                    <p className="font-display text-sm uppercase tracking-tight">{p.name}</p>
                    <Link href={`/negocio/${p.businesses.slug}`} className="text-xs text-[var(--muted)] transition hover:text-[var(--accent)]">
                      {p.businesses.name} →
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[var(--line)]">
                <td className="p-3 text-sm font-bold">💰 Precio</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    {p.old_price && <p className="text-xs text-[var(--muted2)] line-through">${Number(p.old_price).toLocaleString("es-AR")}</p>}
                    <p className="font-display text-lg text-[var(--accent)]">${Number(p.price).toLocaleString("es-AR")}</p>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--line)] bg-white/[0.02]">
                <td className="p-3 text-sm font-bold">🏷️ Categoría</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm capitalize">{p.category || p.businesses?.category || "—"}</td>
                ))}
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="p-3 text-sm font-bold">⭐ Rating negocio</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-display">{Number(p.businesses?.rating || 0).toFixed(1)}</span>
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-[var(--line)] bg-white/[0.02]">
                <td className="p-3 text-sm font-bold">📦 Stock</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm">{p.stock ?? "—"}</td>
                ))}
              </tr>
              <tr className="border-b border-[var(--line)]">
                <td className="p-3 text-sm font-bold">🔥 SDL Score</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    <span className={`font-display text-2xl ${p.id === mejorId ? "text-[var(--ok)]" : "text-[var(--text)]"}`}>
                      {p.sdlScore}
                    </span>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted2)]">/100</p>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 text-sm font-bold">🛒 Acción</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    {p.id === mejorId ? (
                      <Link href={`/negocio/${p.businesses.slug}`}
                        className="btn-hard inline-block rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                        Ver negocio
                      </Link>
                    ) : (
                      <Link href={`/negocio/${p.businesses.slug}`}
                        className="inline-block rounded-xl border border-[var(--line-strong)] px-4 py-2 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
                        Ver negocio
                      </Link>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted2)]">
          El SDL Score se calcula en base a precio, descuento, rating del negocio y disponibilidad.
        </p>
      </div>
    </main>
  );
}

export default function CompararPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text)]">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[var(--accent)]"></div>
      </main>
    }>
      <CompararContent />
    </Suspense>
  );
}
