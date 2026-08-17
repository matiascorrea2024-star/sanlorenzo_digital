"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Clock, TrendingUp, Sparkles, Search, PieChart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/data";
import PageHero from "@/components/ui/page-hero";

const fmt = (n: number) => "$" + n.toLocaleString("es-AR");

export default function PulsoClient() {
  const [loading, setLoading] = useState(true);
  const [categoriaTop, setCategoriaTop] = useState<{ nombre: string; icon: string; busquedas: number } | null>(null);
  const [vencenHoy, setVencenHoy] = useState<any[]>([]);
  const [recienPublicado, setRecienPublicado] = useState<any[]>([]);
  const [negocioEnAlza, setNegocioEnAlza] = useState<{ name: string; slug: string; crecimiento: number } | null>(null);
  const [ofertasSemana, setOfertasSemana] = useState(0);
  const [negociosSemana, setNegociosSemana] = useState(0);
  const [categoriasConMas, setCategoriasConMas] = useState<{ nombre: string; icon: string; cant: number }[]>([]);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const hoy = new Date().toISOString().slice(0, 10);
      const desdeHoy00 = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const desde48h = new Date(Date.now() - 2 * 86400000).toISOString();
      const desde7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const desde14 = new Date(Date.now() - 14 * 86400000).toISOString();

      const [
        { data: busquedasHoy },
        { data: ofertasVencenHoy },
        { data: nuevas },
        { data: vistas },
        { data: ofertasNuevas7d },
        { data: negociosNuevos7d },
        { data: todosNegocios },
      ] = await Promise.all([
        sb.from("analytics_events").select("metadata").eq("event_type", "search").gte("created_at", desdeHoy00),
        sb.from("offers_with_business").select("*").eq("active", true).eq("valid_until", hoy).limit(6),
        sb.from("offers_with_business").select("*").eq("active", true).gte("created_at", desde48h).order("created_at", { ascending: false }).limit(6),
        sb.from("page_views_public").select("business_id, viewed_at"),
        sb.from("offers").select("id", { count: "exact", head: true }).gte("created_at", desde7),
        sb.from("businesses").select("id", { count: "exact", head: true }).eq("status", "verificado").gte("created_at", desde7),
        sb.from("businesses").select("category"),
      ]);

      // Categoría más buscada hoy: match simple de texto contra el
      // catálogo real de rubros -- sin esto, no hay forma honesta de
      // "adivinar" qué categoría buscó cada uno.
      const conteoCategoria: Record<string, number> = {};
      (busquedasHoy || []).forEach((e: any) => {
        const q = String(e.metadata?.query || "").toLowerCase();
        const cat = CATEGORIES.find((c) => q.includes(c.id) || q.includes(c.name.toLowerCase()));
        if (cat) conteoCategoria[cat.id] = (conteoCategoria[cat.id] || 0) + 1;
      });
      const topCatId = Object.entries(conteoCategoria).sort((a, b) => b[1] - a[1])[0];
      if (topCatId) {
        const cat = CATEGORIES.find((c) => c.id === topCatId[0]);
        if (cat) setCategoriaTop({ nombre: cat.name, icon: cat.icon, busquedas: topCatId[1] });
      }

      setVencenHoy(ofertasVencenHoy || []);
      setRecienPublicado(nuevas || []);

      // Negocio en alza: mismo cálculo que /ranking (semana vs semana
      // anterior), reusando page_views_public.
      const semana: Record<string, number> = {};
      const semanaPrev: Record<string, number> = {};
      (vistas || []).forEach((v: any) => {
        if (v.viewed_at >= desde7) semana[v.business_id] = (semana[v.business_id] || 0) + 1;
        else if (v.viewed_at >= desde14) semanaPrev[v.business_id] = (semanaPrev[v.business_id] || 0) + 1;
      });
      const crecimientos = Object.keys(semana).map((id) => ({ id, crecimiento: semana[id] - (semanaPrev[id] || 0) }));
      const top = crecimientos.sort((a, b) => b.crecimiento - a.crecimiento)[0];
      if (top && top.crecimiento > 0) {
        const { data: biz } = await sb.from("businesses").select("name, slug").eq("id", top.id).maybeSingle();
        if (biz) setNegocioEnAlza({ name: biz.name, slug: biz.slug, crecimiento: top.crecimiento });
      }

      setOfertasSemana(ofertasNuevas7d?.length ?? 0);
      setNegociosSemana(negociosNuevos7d?.length ?? 0);

      const porCategoria: Record<string, number> = {};
      (todosNegocios || []).forEach((b: any) => { if (b.category) porCategoria[b.category] = (porCategoria[b.category] || 0) + 1; });
      const top3 = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 3)
        .map(([id, cant]) => { const c = CATEGORIES.find((x) => x.id === id); return c ? { nombre: c.name, icon: c.icon, cant } : null; })
        .filter(Boolean) as { nombre: string; icon: string; cant: number }[];
      setCategoriasConMas(top3);

      setLoading(false);
    })();
  }, []);

  const hayAlgo = categoriaTop || vencenHoy.length > 0 || recienPublicado.length > 0 || negocioEnAlza || ofertasSemana > 0 || negociosSemana > 0;

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <PageHero title="¿Qué está pasando hoy en San Lorenzo?" subtitle="El pulso comercial de la ciudad, con datos reales de la plataforma" />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />)}
          </div>
        ) : !hayAlgo ? (
          <div className="sld-card rounded-2xl p-10 text-center">
            <Sparkles className="mx-auto mb-3 h-8 w-8 text-orange-400" />
            <p className="font-bold">Todavía no hay suficiente actividad para mostrar tendencias.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/50">
              Esta página se va llenando sola a medida que la ciudad usa la plataforma -- buscá, mirá ofertas, volvé mañana.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categoriaTop && (
              <div className="rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
                <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-orange-300"><Search className="h-3.5 w-3.5" /> Categoría más buscada hoy</p>
                  <p className="mt-2 text-2xl font-black">{categoriaTop.icon} {categoriaTop.nombre}</p>
                  <p className="mt-1 text-sm text-white/50">{categoriaTop.busquedas} búsqueda{categoriaTop.busquedas === 1 ? "" : "s"} hoy</p>
                </div>
              </div>
            )}

            {negocioEnAlza && (
              <div className="rounded-[1.75rem] border border-green-400/25 bg-gradient-to-br from-green-500/[.08] to-emerald-500/[.04] p-1.5">
                <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-green-300"><TrendingUp className="h-3.5 w-3.5" /> Negocio en alza esta semana</p>
                  <Link href={`/negocio/${negocioEnAlza.slug}`} className="mt-2 block text-2xl font-black hover:text-green-300">{negocioEnAlza.name}</Link>
                  <p className="mt-1 text-sm text-white/50">+{negocioEnAlza.crecimiento} visitas vs la semana anterior</p>
                </div>
              </div>
            )}

            <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-300"><PieChart className="h-3.5 w-3.5" /> Tendencia de la semana</p>
                <p className="mt-2 text-2xl font-black">{ofertasSemana} oferta{ofertasSemana === 1 ? "" : "s"} nueva{ofertasSemana === 1 ? "" : "s"}</p>
                <p className="mt-1 text-sm text-white/50">{negociosSemana} negocio{negociosSemana === 1 ? "" : "s"} nuevo{negociosSemana === 1 ? "" : "s"} esta semana</p>
              </div>
            </div>

            {categoriasConMas.length > 0 && (
              <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
                <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-white/40">Rubros con más negocios</p>
                  <div className="space-y-1.5">
                    {categoriasConMas.map((c) => (
                      <div key={c.nombre} className="flex items-center justify-between text-sm">
                        <span>{c.icon} {c.nombre}</span>
                        <span className="text-white/40">{c.cant}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {vencenHoy.length > 0 && (
              <div className="rounded-[1.75rem] border border-red-400/25 bg-gradient-to-br from-red-500/[.08] to-orange-500/[.04] p-1.5 md:col-span-2">
                <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-red-300"><Clock className="h-3.5 w-3.5" /> {vencenHoy.length} oferta{vencenHoy.length === 1 ? "" : "s"} vence{vencenHoy.length === 1 ? "" : "n"} hoy</p>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {vencenHoy.map((o: any) => (
                      <Link key={o.id} href={`/oferta/${o.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-red-400/40">
                        <p className="truncate text-sm font-bold">{o.title}</p>
                        <p className="text-xs text-white/50">{o.business_name}</p>
                        {o.offer_price && <p className="mt-1 text-sm font-black text-orange-400">{fmt(Number(o.offer_price))}</p>}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {recienPublicado.length > 0 && (
              <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5 md:col-span-2">
                <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="mb-3 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-300"><Flame className="h-3.5 w-3.5" /> Recién publicado</p>
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {recienPublicado.map((o: any) => (
                      <Link key={o.id} href={`/oferta/${o.id}`} className="rounded-xl border border-white/10 bg-black/20 p-3 hover:border-sky-400/40">
                        <p className="truncate text-sm font-bold">{o.title}</p>
                        <p className="text-xs text-white/50">{o.business_name}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
