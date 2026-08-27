"use client";
import RankBadge from "@/components/ui/rank-badge";
import { RANGOS } from "@/lib/ranks";
import DivisionFrame from "@/components/ui/division-frame";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Trophy, Star, Flame, Eye, Heart, TrendingUp, TrendingDown, Minus, Activity, Rocket, Crown, Zap, SlidersHorizontal, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { rangoDe } from "@/lib/ranks";
import { calcReputation, reputationLabel } from "@/lib/reputation";
import RankedAvatar from "@/components/ui/ranked-avatar";

// 10 formas de ordenar era demasiada decisión de una sola vez (la
// crítica real: "hay demasiada información, se pierde"). Las 4 que más
// se usan quedan siempre a la vista; el resto se agrupa en "Más filtros"
// -- sigue estando todo, pero no compite por atención de entrada.
const TABS_PRINCIPALES = [
  { k: "dia", l: "🔥 Del día", icon: Zap },
  { k: "ligas", l: "🏆 Ligas", icon: Trophy },
  { k: "rating", l: "⭐ Valorados", icon: Star },
  { k: "ofertas", l: "🔥 Ofertas", icon: Flame },
];
const TABS_MAS = [
  { k: "reputacion", l: "👑 Reputación", icon: Crown },
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
  const [error, setError] = useState("");
  const [masAbierto, setMasAbierto] = useState(false);
  const masRef = useRef<HTMLDivElement>(null);
  const tabMasActivo = TABS_MAS.find((t) => t.k === tab);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (masRef.current && !masRef.current.contains(e.target as Node)) setMasAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      if (ligas.error) {
        setError("No pudimos cargar el ranking. Intentá de nuevo más tarde.");
        setLoading(false);
        return;
      }

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
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Hero editorial: headline gigante + panel de "negocio del día /
            de la semana" al costado. Los marcos de rango
            (DivisionFrame/RankedAvatar) NO se tocan -- ese sistema visual
            ya está validado y se mantiene tal cual. */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Competencia local</p>
            <h1 className="mt-3 font-display text-6xl uppercase leading-[0.9] tracking-tight text-[var(--text)] sm:text-7xl">
              LIGAS DE{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-[#fbbf24] bg-clip-text text-transparent">MERCADO</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[var(--muted)]">
              La jerarquía comercial de San Lorenzo. Reputación basada en actividad real, votos de vecinos y consistencia -- pagar un plan no altera el ranking orgánico.
            </p>
          </div>
          <div className="flex flex-col gap-4 lg:col-span-4">
            {negocioDelDia && (
              <Link href={`/negocio/${negocioDelDia.slug}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[#fbbf24]" style={{ fontFamily: "var(--font-display)" }}><Zap className="h-3.5 w-3.5" /> Negocio del día</p>
                <div className="flex items-center gap-3">
                  <DivisionFrame puntos={negocioDelDia.puntos} categoria={negocioDelDia.category} size={48}>
                    <RankedAvatar slug={negocioDelDia.slug} name={negocioDelDia.name} categoria={negocioDelDia.category} size={44} />
                  </DivisionFrame>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{negocioDelDia.name}</p>
                    <p className="text-xs font-bold text-[#fbbf24]">👑 {negocioDelDia.reputacion}/100 · {reputationLabel(negocioDelDia.reputacion).text}</p>
                  </div>
                </div>
              </Link>
            )}
            {negocioSemana && negocioSemana.crecimiento > 0 && (
              <Link href={`/negocio/${negocioSemana.slug}`} className="block rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
                <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}><Rocket className="h-3.5 w-3.5" /> Negocio de la semana</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-bold">{negocioSemana.name}</span>
                  <span className="shrink-0 font-display text-2xl text-[var(--ok)]">+{negocioSemana.crecimiento}</span>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3">
          {RANGOS.map(r => (
            <span key={r.nombre} title={`Desde ${r.min} puntos`} className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider"
              style={{ color: r.accent, border: `1px solid ${r.accent}55`, background: "var(--bg)" }}>
              {r.nombre}
            </span>
          ))}
        </div>

        {/* Tabs: las 4 más usadas siempre visibles + "Más filtros" agrupa
            el resto en un desplegable. */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {TABS_PRINCIPALES.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); setMasAbierto(false); }}
              style={{ fontFamily: "var(--font-display)" }}
              className={`shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                tab === t.k
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
              }`}>
              {t.l}
            </button>
          ))}
          <div className="relative" ref={masRef}>
            <button onClick={() => setMasAbierto(v => !v)}
              style={{ fontFamily: "var(--font-display)" }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition ${
                tabMasActivo
                  ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                  : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"
              }`}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {tabMasActivo ? tabMasActivo.l : "Más filtros"}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${masAbierto ? "rotate-180" : ""}`} />
            </button>
            {masAbierto && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-20 w-56 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                {TABS_MAS.map(t => (
                  <button key={t.k} onClick={() => { setTab(t.k); setMasAbierto(false); }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${
                      tab === t.k ? "bg-[var(--accent)]/15 text-[var(--accent)]" : "text-[var(--muted)] hover:bg-[var(--ov-05)] hover:text-[var(--text)]"
                    }`}>
                    {t.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista */}
        {error && <div role="alert" className="mt-6 rounded-xl border border-[var(--bad)]/20 bg-[var(--bad)]/10 px-4 py-3 text-sm text-[var(--bad)]">{error}</div>}
        <div className="mt-6 space-y-3">
          {loading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <div className="h-6 w-6 animate-pulse rounded bg-[var(--ov-05)]" />
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[var(--ov-05)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--ov-05)]" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-[var(--ov-05)]" />
                </div>
                <div className="h-6 w-16 animate-pulse rounded-full bg-[var(--ov-05)]" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-8 text-center text-sm text-[var(--muted)]">
              Todavía no hay datos suficientes para ordenar el ranking.
            </div>
          ) : sorted.map((r, i) => {
            const rango = rangoDe(r.puntos);
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            const esTop10 = i >= 3 && i < 10;
            return (
              <Link key={r.id} href={`/negocio/${r.slug}`}
                style={{ animationDelay: `${Math.min(i * 45, 450)}ms` }}
                className={`ranked-row block rounded-2xl border p-4 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)] ${
                  i === 0 ? "border-[#fbbf24]/25 bg-gradient-to-br from-[#fbbf24]/5 to-transparent" : "border-[var(--line)] bg-[var(--surface)]"
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`flex shrink-0 flex-col items-center ${i === 0 ? "w-16" : "w-12"}`}>
                    <span className={`text-center leading-none ${i === 0 ? "gold-glow font-display text-4xl text-[#fbbf24]" : i < 3 ? "text-3xl text-[#fbbf24]" : "font-display text-2xl text-[var(--accent)]"}`}>{medal}</span>
                    {esTop10 && <span className="mt-0.5 text-[8px] font-black uppercase tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>TOP 10</span>}
                  </div>
                  {i < 3 ? (
                    <DivisionFrame categoria={r.category} puntos={r.puntos} size={i === 0 ? 72 : 44} enFuego={tab === "crecimiento" && i === 0 && r.crecimiento > 0}>
                      <RankedAvatar slug={r.slug} name={r.name} size={i === 0 ? 66 : 40} categoria={r.category} />
                    </DivisionFrame>
                  ) : (
                    <RankedAvatar slug={r.slug} name={r.name} size={44} categoria={r.category} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold ${i === 0 ? "text-xl sm:text-2xl" : ""}`}>
                      {r.name} <RankBadge puntos={r.puntos} categoria={r.category} />
                      {r.status === "verificado" && <span className="text-[10px] text-[var(--ok)]">✓</span>}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-[var(--muted)] capitalize">
                      <span>{r.category}</span>
                      <span title="Calificación promedio" className="text-[#fbbf24]">· ⭐ {r.rating.toFixed(1)}</span>
                      <span title="Ofertas activas">· 🔥 {r.ofertas}</span>
                      <span title="Visitas al perfil" className="hidden sm:inline">· 👀 {r.vistas}</span>
                      <span title="Veces guardado como favorito" className="hidden sm:inline">· ❤️ {r.favs}</span>
                      <span title="Publicaciones en el Muro" className="hidden sm:inline">· 📰 {r.posts}</span>
                      <span title="Visitas de esta semana vs. la anterior"
                        aria-label={`Tendencia: ${r.crecimiento > 0 ? `subió ${r.crecimiento} visitas` : r.crecimiento < 0 ? `bajó ${Math.abs(r.crecimiento)} visitas` : "sin cambios"} esta semana`}
                        className={`flex items-center gap-0.5 font-bold normal-case ${r.crecimiento > 0 ? "text-[var(--ok)]" : r.crecimiento < 0 ? "text-[var(--bad)]" : "text-[var(--muted2)]"}`}>
                        · {r.crecimiento > 0 ? <TrendingUp className="h-3 w-3" aria-hidden /> : r.crecimiento < 0 ? <TrendingDown className="h-3 w-3" aria-hidden /> : <Minus className="h-3 w-3" aria-hidden />}
                        {r.crecimiento !== 0 && (r.crecimiento > 0 ? `+${r.crecimiento}` : r.crecimiento)}
                      </span>
                    </p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ov-05)]">
                      <div className="h-full bg-gradient-to-r from-[var(--accent)] to-[#fbbf24]" style={{ width: `${rango.progreso}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    {tab === "reputacion" || tab === "dia" ? (
                      <>
                        <span className={`font-display text-3xl ${i === 0 ? "gold-glow text-[#fbbf24]" : i < 3 ? "text-[#fbbf24]" : "text-[var(--accent)]"}`}>{r.reputacion}</span>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">reputación</p>
                      </>
                    ) : tab === "crecimiento" ? (
                      <>
                        <span className={`font-display text-3xl ${r.crecimiento >= 0 ? "text-[var(--ok)]" : "text-[var(--bad)]"}`}>
                          {r.crecimiento >= 0 ? "+" : ""}{r.crecimiento}
                        </span>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">vs sem. anterior</p>
                      </>
                    ) : (
                      <>
                        <span
                          className="rounded-full border px-3 py-1 text-xs font-black"
                          style={{ borderColor: `${rango.accent}66`, background: `${rango.accent}1a`, color: rango.accent }}
                        >
                          {rango.rango}{rango.tier ? ` ${rango.tier}` : ""}
                        </span>
                        <p className="mt-1 text-[11px] text-[var(--muted2)]">{r.puntos} pts</p>
                      </>
                    )}
                  </div>
                </div>
                {rango.proximo && tab === "ligas" && (
                  <p className="mt-2 text-[11px] text-[var(--muted2)]">
                    Faltan {rango.faltan} pts para {rango.proximo}
                  </p>
                )}
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--muted2)]">
          La reputación se calcula con datos reales: rating, actividad, visitas y verificación.
          <br />Pagar un plan no altera el ranking orgánico.
        </p>
      </div>
    </main>
  );
}
