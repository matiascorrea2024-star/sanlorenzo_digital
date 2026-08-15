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
      <main className="min-h-screen bg-[#120d09] text-white pb-24">
        <PageHero title="Comparador" subtitle="Compará negocios y productos de un vistazo" />
        <div className="mx-auto max-w-5xl px-4 py-16 text-center text-white/50">Cargando...</div>
      </main>
    );
  }

  if (productos.length === 0) {
    return (
      <main className="min-h-screen bg-[#120d09] text-white pb-24">
        <PageHero title="Comparador" subtitle="Compará negocios y productos de un vistazo" />
        <div className="mx-auto max-w-5xl px-4 py-12 text-center">
          <Package className="mx-auto h-16 w-16 text-white/30 mb-4" />
          <p className="mt-3 text-white/60">No hay productos seleccionados para comparar.</p>
          <Link href="/negocios" className="mt-6 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black">
            Explorar productos
          </Link>
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
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <PageHero title="Comparador" subtitle={`Comparando ${productos.length} producto${productos.length !== 1 ? "s" : ""} lado a lado`} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/negocios" className="flex items-center gap-1 text-sm text-orange-400 mb-4">
          <ArrowLeft className="h-4 w-4" /> Volver a productos
        </Link>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-white/40 border-b border-white/10">Característica</th>
                {conScore.map(p => (
                  <th key={p.id} className="p-3 text-center border-b border-white/10 min-w-[180px]">
                    {p.id === mejorId && (
                      <Badge variant="success" size="sm" className="mb-2">🏆 Mejor opción</Badge>
                    )}
                    <div className="mx-auto h-24 w-24 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mb-2">
                      <Package className="h-10 w-10 text-orange-400" />
                    </div>
                    <p className="font-black text-sm">{p.name}</p>
                    <Link href={`/negocio/${p.businesses.slug}`} className="text-xs text-white/50 hover:text-orange-400">
                      {p.businesses.name} →
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/10">
                <td className="p-3 text-sm font-bold">💰 Precio</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    {p.old_price && <p className="text-xs text-white/40 line-through">${Number(p.old_price).toLocaleString("es-AR")}</p>}
                    <p className="text-lg font-black text-orange-400">${Number(p.price).toLocaleString("es-AR")}</p>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <td className="p-3 text-sm font-bold">🏷️ Categoría</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm capitalize">{p.category || p.businesses?.category || "—"}</td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3 text-sm font-bold">⭐ Rating negocio</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{Number(p.businesses?.rating || 0).toFixed(1)}</span>
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <td className="p-3 text-sm font-bold">📦 Stock</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm">{p.stock ?? "—"}</td>
                ))}
              </tr>
              <tr className="border-b border-white/10">
                <td className="p-3 text-sm font-bold">🔥 SDL Score</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    <span className={`text-2xl font-black ${p.id === mejorId ? "text-green-400" : "text-white"}`}>
                      {p.sdlScore}
                    </span>
                    <p className="text-[10px] text-white/50">/100</p>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 text-sm font-bold">🛒 Acción</td>
                {conScore.map(p => (
                  <td key={p.id} className="p-3 text-center">
                    <Link href={`/negocio/${p.businesses.slug}`}
                      className={`inline-block rounded-xl px-4 py-2 text-xs font-black transition ${
                        p.id === mejorId
                          ? "bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90"
                          : "border border-white/20 hover:bg-white/10"
                      }`}>
                      Ver negocio
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          El SDL Score se calcula en base a precio, descuento, rating del negocio y disponibilidad.
        </p>
      </div>
    </main>
  );
}

export default function CompararPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </main>
    }>
      <CompararContent />
    </Suspense>
  );
}
