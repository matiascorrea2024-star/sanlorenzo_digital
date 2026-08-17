"use client";
import RankBadge from "@/components/ui/rank-badge";
import { RANGOS } from "@/lib/ranks";
import DivisionFrame from "@/components/ui/division-frame";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Flame, Eye, Heart, TrendingUp, TrendingDown, Minus, Activity, Rocket, Crown, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { rangoDe } from "@/lib/ranks";
import { calcReputation, reputationLabel } from "@/lib/reputation";
import RankedAvatar from "@/components/ui/ranked-avatar";
import Badge from "@/components/ui/badge";

const TABS = [
  { k: "dia", l: "🔥 Del día", icon: Zap },
  { k: "reputacion", l: "👑 Reputación", icon: Crown },
  { k: "ligas", l: "🏆 Ligas", icon: Trophy },
  { k: "rating", l: "⭐ Valorados", icon: Star },
  { k: "ofertas", l: "🔥 Ofertas", icon: Flame },
  { k: "vistas", l: "👀 Vistos", icon: Eye },
  { k: "guardados", l: "❤️ Guardados", icon: Heart },
  { k: "activos", l: "⚡ Activos", icon: Activity },
  { k: "crecimiento", l: "📈 Crecimiento", icon: Rocket },
  { k: "semanal", l: "📅 Semana", icon: TrendingUp },
];

export default function RankingPage({ initial = [] }: { initial?: any[] }) {
  const [rows, setRows] = useState<any[]>(initial || []);
  const [tab, setTab] = useState("dia");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const desde7 = new Date(Date.now() - 7 * 86400000).toISOString();
      const desde14 = new Date(Date.now() - 14 * 86400000).toISOString();

      const [ligas, views, favBiz, posts] = await Promise.all([
        supabase().from("business_leagues").select("*"),
        // page_views_public (no page_views): la tabla real solo la puede
        // leer el dueño/admin (protege IPs) -- por eso esta pestaña de
        // crecimiento siempre le devolvía vacío a un visitante común.
        // Límite defensivo: esto se agrega client-side en JS, así que si
        // algún día supera esto en serio conviene mover el conteo a una
        // vista/RPC agregada en Postgres en vez de bajar cada fila.
        supabase().from("page_views_public").select("business_id, viewed_at")
          .order("viewed_at", { ascending: false }).limit(20000),
        // Conteo agregado de favoritos: se lee de businesses.favorites_count
        // (mantenido por trigger), no de un SELECT abierto sobre favorites
        // -- esa tabla es privada por diseño (RLS: solo tus propios favoritos).
        supabase().from("businesses").select("id, favorites_count"),
        supabase().from("muro_posts").select("business_id"),
      ]);

      const viewCount: Record<string, number> = {};
      const weekCount: Record<string, number> = {};
      const prevWeekCount: Record<string, number> = {};
      (views.data || []).forEach((v: any) => {
        viewCount[v.business_id] = (viewCount[v.business_id] || 0) + 1;
        if (v.viewed_at >= desde7) weekCount[v.business_id] = (weekCount[v.business_id] || 0) + 1;
        else if (v.viewed_at >= desde14) prevWeekCount[v.business_id] = (prevWeekCount[v.business_id] || 0) + 1;
      });
      const favCount: Record<string, number> = {};
      (favBiz.data || []).forEach((b: any) => { favCount[b.id] = b.favorites_count || 0; });
      const postCount: Record<string, number> = {};
      (posts.data || []).forEach((p: any) => { postCount[p.business_id] = (postCount[p.business_id] || 0) + 1; });

      const merged = (ligas.data || []).map((r: any) => {
        const visitas = viewCount[r.id] || 0;
        const guardados = favCount[r.id] || 0;
        const postsMuro = postCount[r.id] || 0;
        const crecimiento = (weekCount[r.id] || 0) - (prevWeekCount[r.id] || 0);
        return {
          ...r,
          rating: Number(r.rating || 0),
          vistas: visitas,
          vistas7: weekCount[r.id] || 0,
          favs: guardados,
          posts: postsMuro,
          crecimiento,
          actividad: (r.ofertas || 0) + postsMuro,
          reputacion: calcReputation({
            rating: Number(r.rating || 0),
            ofertas: r.ofertas || 0,
            posts: postsMuro,
            visitas,
            guardados,
            verificado: r.status === "verificado",
          }),
        };
      });
      setRows(merged);
      setLoading(false);
    })();
  }, []);

  // Negocio del día: mayor reputación (estable durante el día)
  const negocioDelDia = useMemo(() => {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => b.reputacion - a.reputacion)[0];
  }, [rows]);

  // Negocio de la semana: mayor crecimiento
  const negocioSemana = useMemo(() => {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => b.crecimiento - a.crecimiento)[0];
  }, [rows]);

  const sorted = useMemo(() => {
    const r = [...rows];
    switch (tab) {
      case "reputacion": return r.sort((a, b) => b.reputacion - a.reputacion);
      case "rating": return r.sort((a, b) => b.rating - a.rating);
      case "ofertas": return r.sort((a, b) => b.ofertas - a.ofertas);
      case "vistas": return r.sort((a, b) => b.vistas - a.vistas);
      case "guardados": return r.sort((a, b) => b.favs - a.favs);
      case "activos": return r.sort((a, b) => b.actividad - a.actividad);
      case "crecimiento": return r.sort((a, b) => b.crecimiento - a.crecimiento);
      case "semanal": return r.sort((a, b) => b.vistas7 - a.vistas7);
      default: return r.sort((a, b) => b.puntos - a.puntos);
    }
  }, [rows, tab]);

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Hero editorial: headline gigante + panel de "negocio del día /
            de la semana" al costado -- calco del mockup aprobado. Los
            marcos de rango (DivisionFrame/RankedAvatar) NO se tocan --
            ese sistema visual ya está validado y se mantiene tal cual. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-500">Competencia local</p>
            <h1 className="mt-3 text-6xl font-black uppercase leading-[0.9] tracking-tighter sm:text-7xl" style={{ fontFamily: "var(--font-space)" }}>
              LIGAS DE{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">MERCADO</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/50">
              La jerarquía comercial de San Lorenzo. Reputación basada en actividad real, votos de vecinos y consistencia -- pagar un plan no altera el ranking orgánico.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-4">
            {negocioDelDia && (
              <Link href={`/negocio/${negocioDelDia.slug}`} className="rounded-[2rem] border border-white/[.06] bg-white/[.02] p-1.5 transition hover:-translate-y-1">
                <div className="rounded-[calc(2rem-0.375rem)] border border-white/[.05] bg-black/20 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.3em] text-yellow-300"><Zap className="h-3.5 w-3.5" /> Negocio del día</p>
                  <div className="flex items-center gap-3">
                    <DivisionFrame puntos={negocioDelDia.puntos} categoria={negocioDelDia.category} size={48}>
                      <RankedAvatar slug={negocioDelDia.slug} name={negocioDelDia.name} categoria={negocioDelDia.category} size={44} />
                    </DivisionFrame>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{negocioDelDia.name}</p>
                      <p className="text-xs font-bold text-yellow-300">👑 {negocioDelDia.reputacion}/100 · {reputationLabel(negocioDelDia.reputacion).text}</p>
                    </div>
                  </div>
                </div>
              </Link>
            )}
            {negocioSemana && negocioSemana.crecimiento > 0 && (
              <Link href={`/negocio/${negocioSemana.slug}`} className="rounded-[2rem] border border-white/[.06] bg-white/[.02] p-1.5 transition hover:-translate-y-1">
                <div className="rounded-[calc(2rem-0.375rem)] border border-white/[.05] bg-black/20 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.3em] text-green-300"><Rocket className="h-3.5 w-3.5" /> Negocio de la semana</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-bold">{negocioSemana.name}</span>
                    <span className="shrink-0 text-lg font-black text-green-400">+{negocioSemana.crecimiento}</span>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          {RANGOS.map(r => (
            <span key={r.nombre} title={`Desde ${r.min} puntos`} className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
              style={{ color: r.accent, border: `1px solid ${r.accent}55`, background: "#0c0a0b" }}>
              {r.nombre}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                tab === t.k
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white"
                  : "border border-white/15 bg-white/5 text-white/70 hover:border-orange-400/50"
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="mt-6 space-y-3">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="h-6 w-6 animate-pulse rounded bg-white/10" />
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-white/10" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
              </div>
            ))
          ) : sorted.map((r, i) => {
            const rango = rangoDe(r.puntos);
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            const esTop10 = i >= 3 && i < 10;
            return (
              <Link key={r.id} href={`/negocio/${r.slug}`}
                className={`block rounded-[1.5rem] border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${i === 0 ? "p-2" : "p-1.5"} ${
                  i === 0 ? "border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-transparent hover:border-yellow-400/60" : "border-white/[.06] bg-white/[.02] hover:border-orange-400/30"
                }`}>
                <div className={`flex items-center gap-4 rounded-[1.1rem] border border-white/[.05] bg-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] ${i === 0 ? "p-5 sm:p-6" : "p-3.5"}`}>
                  <div className={`flex shrink-0 flex-col items-center ${i === 0 ? "w-14" : "w-10"}`}>
                    <span className={`text-center font-black ${i === 0 ? "text-4xl" : "text-2xl"}`}>{medal}</span>
                    {esTop10 && <span className="mt-0.5 text-[8px] font-black text-orange-300">TOP 10</span>}
                  </div>
                  {i < 3 ? (
              <DivisionFrame categoria={r.category} puntos={r.puntos} size={i === 0 ? 72 : 44} enFuego={tab === "crecimiento" && i === 0 && r.crecimiento > 0}>
                <RankedAvatar slug={r.slug} name={r.name} size={i === 0 ? 66 : 40} categoria={r.category} />
              </DivisionFrame>
            ) : (
              <RankedAvatar slug={r.slug} name={r.name} size={44} categoria={r.category} />
            )}
                  <div className="min-w-0 flex-1">
                    <p className={`flex items-center gap-2 font-bold ${i === 0 ? "text-xl sm:text-2xl" : ""}`} style={i === 0 ? { fontFamily: "var(--font-space)" } : undefined}>
                      {r.name} <RankBadge puntos={r.puntos} categoria={r.category} />
                      {r.status === "verificado" && <span className="text-[10px] text-green-400">✓</span>}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1 text-xs text-white/50 capitalize">
                      <span>{r.category}</span>
                      <span title="Calificación promedio">· ⭐ {r.rating.toFixed(1)}</span>
                      <span title="Ofertas activas">· 🔥 {r.ofertas}</span>
                      <span title="Visitas al perfil">· 👀 {r.vistas}</span>
                      <span title="Veces guardado como favorito">· ❤️ {r.favs}</span>
                      <span title="Publicaciones en el Muro">· 📰 {r.posts}</span>
                      <span title="Visitas de esta semana vs. la anterior"
                        aria-label={`Tendencia: ${r.crecimiento > 0 ? `subió ${r.crecimiento} visitas` : r.crecimiento < 0 ? `bajó ${Math.abs(r.crecimiento)} visitas` : "sin cambios"} esta semana`}
                        className={`flex items-center gap-0.5 font-bold normal-case ${r.crecimiento > 0 ? "text-green-400" : r.crecimiento < 0 ? "text-red-400" : "text-white/40"}`}>
                        · {r.crecimiento > 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : r.crecimiento < 0 ? <TrendingDown className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                        {r.crecimiento !== 0 && (r.crecimiento > 0 ? `+${r.crecimiento}` : r.crecimiento)}
                      </span>
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-red-600" style={{ width: `${rango.progreso}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    {tab === "reputacion" || tab === "dia" ? (
                      <>
                        <span className="text-2xl font-black text-yellow-300">{r.reputacion}</span>
                        <p className="text-[10px] text-white/50">reputación</p>
                      </>
                    ) : tab === "crecimiento" ? (
                      <>
                        <span className={`text-2xl font-black ${r.crecimiento >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {r.crecimiento >= 0 ? "+" : ""}{r.crecimiento}
                        </span>
                        <p className="text-[10px] text-white/50">vs sem. anterior</p>
                      </>
                    ) : (
                      <>
                        <span
                          className="rounded-full border px-3 py-1 text-xs font-black"
                          style={{ borderColor: `${rango.accent}66`, background: `${rango.accent}1a`, color: rango.accent }}
                        >
                          {rango.rango}{rango.tier ? ` ${rango.tier}` : ""}
                        </span>
                        <p className="mt-1 text-[11px] text-white/50">{r.puntos} pts</p>
                      </>
                    )}
                  </div>
                </div>
                {rango.proximo && tab === "ligas" && (
                  <p className="mt-2 text-[11px] text-white/40">
                    Faltan {rango.faltan} pts para {rango.proximo}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          La reputación se calcula con datos reales: rating, actividad, visitas y verificación.
          <br />Pagar un plan no altera el ranking orgánico.
        </p>
      </div>
    </main>
  );
}