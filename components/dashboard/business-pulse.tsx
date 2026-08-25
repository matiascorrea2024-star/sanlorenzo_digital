"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Target, TrendingUp, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planDe } from "@/lib/plans";
import InfoTip from "@/components/ui/info-tip";

type Props = { negocio: any };

const MISION_META = { ofertas: 3, catalogo: 1, seguidores: 5, resenas: 1 };

export default function BusinessPulse({ negocio }: Props) {
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState<any>(null);

  useEffect(() => {
    if (!negocio?.id) return;
    (async () => {
      const sb = supabase();
      const haceUnaSemana = new Date(Date.now() - 7 * 86400000).toISOString();
      const [
        { count: ofertasActivas },
        { count: productos },
        { data: resenas },
        { count: seguidoresTotal },
        { count: seguidoresSemana },
        { count: ofertasSemana },
      ] = await Promise.all([
        sb.from("offers").select("id", { count: "exact", head: true }).eq("business_id", negocio.id).eq("active", true),
        sb.from("products").select("id", { count: "exact", head: true }).eq("business_id", negocio.id).eq("active", true),
        sb.from("business_reviews").select("rating, reply").eq("business_id", negocio.id).eq("hidden", false),
        sb.from("followers").select("id", { count: "exact", head: true }).eq("business_id", negocio.id),
        sb.from("followers").select("id", { count: "exact", head: true }).eq("business_id", negocio.id).gte("created_at", haceUnaSemana),
        sb.from("offers").select("id", { count: "exact", head: true }).eq("business_id", negocio.id).gte("created_at", haceUnaSemana),
      ]);
      const resenasList = resenas || [];
      const promedioRating = resenasList.length ? resenasList.reduce((a, r) => a + Number(r.rating), 0) / resenasList.length : 0;
      const respondioAlguna = resenasList.some((r) => !!r.reply);
      setDatos({
        ofertasActivas: ofertasActivas || 0,
        productos: productos || 0,
        cantResenas: resenasList.length,
        promedioRating,
        respondioAlguna,
        seguidoresTotal: seguidoresTotal || 0,
        seguidoresSemana: seguidoresSemana || 0,
        ofertasSemana: ofertasSemana || 0,
      });
      setLoading(false);
    })();
  }, [negocio?.id]);

  if (loading || !datos) {
    return <div className="mb-8 h-40 animate-pulse rounded-[2rem] border border-white/5 bg-[#161314]" />;
  }

  const perfilCompleto = !!(negocio.description && negocio.address && negocio.whatsapp && (negocio.schedule || negocio.type !== "comercio") && (negocio.portada_url || negocio.logo_url));

  const checklist = [
    { ok: perfilCompleto, label: "Perfil completo", detalle: "Descripción, dirección, WhatsApp, horarios y foto" },
    { ok: datos.cantResenas > 0 && datos.promedioRating >= 4, label: "Buenas reseñas", detalle: datos.cantResenas > 0 ? `Promedio ${datos.promedioRating.toFixed(1)}/5` : "Todavía sin reseñas" },
    { ok: datos.respondioAlguna, label: "Responde a clientes", detalle: "Respondiste al menos una reseña" },
    { ok: datos.ofertasActivas > 0, label: "Publica ofertas", detalle: `${datos.ofertasActivas} activa${datos.ofertasActivas === 1 ? "" : "s"}` },
    { ok: datos.productos > 0, label: "Actualiza catálogo", detalle: `${datos.productos} producto${datos.productos === 1 ? "" : "s"} cargado${datos.productos === 1 ? "" : "s"}` },
  ];
  const score = Math.round((checklist.filter((c) => c.ok).length / checklist.length) * 100);
  const scoreLabel = score >= 80 ? "Perfil sólido" : score >= 50 ? "Vas por buen camino" : "Recién empezando";
  const scoreColor = score >= 80 ? "text-[var(--ok)]" : score >= 50 ? "text-[var(--accent)]" : "text-[var(--muted)]";

  const misiones = [
    { done: datos.ofertasSemana >= MISION_META.ofertas, label: `Publicá ${MISION_META.ofertas} ofertas esta semana`, prog: datos.ofertasSemana, meta: MISION_META.ofertas, pts: 20 },
    { done: datos.productos >= MISION_META.catalogo, label: "Cargá al menos 1 producto al catálogo", prog: Math.min(datos.productos, 1), meta: MISION_META.catalogo, pts: 10 },
    { done: datos.seguidoresSemana >= MISION_META.seguidores, label: `Conseguí ${MISION_META.seguidores} seguidores nuevos`, prog: datos.seguidoresSemana, meta: MISION_META.seguidores, pts: 15 },
    { done: datos.respondioAlguna, label: "Respondé al menos 1 reseña", prog: datos.respondioAlguna ? 1 : 0, meta: MISION_META.resenas, pts: 10 },
  ];

  const plan = planDe(negocio);

  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-2">
      {/* Reputación digital */}
      <div className="rounded-[2rem] border border-white/5 bg-[#161314] p-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <p className="flex items-center gap-1.5 font-display text-lg uppercase tracking-tight text-[#f7f3ec]">
            💎 Reputación digital
            <InfoTip label="Qué es la reputación digital">Un puntaje de 0 a 100 basado en cosas reales: perfil completo, buenas reseñas, si respondés a clientes, si publicás ofertas y si mantenés el catálogo actualizado.</InfoTip>
          </p>
          <span className={`magenta-glow shrink-0 font-display text-5xl leading-none tabular-nums ${scoreColor}`}>{score}<span className="text-base text-[#7d6f5c]">/100</span></span>
        </div>
        <div className="h-2 rounded-full bg-white/5">
          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${score}%` }} />
        </div>
        <p className={`mb-4 mt-2 text-xs font-black uppercase tracking-widest ${scoreColor}`}>{scoreLabel}</p>
        <div className="space-y-2">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[#34d399]" /> : <Circle className="h-4 w-4 shrink-0 text-white/15" />}
              <span className={c.ok ? "text-[#f7f3ec]/85" : "text-[#7d6f5c]"}>{c.label}</span>
              <span className="ml-auto text-[10px] text-[#7d6f5c]">{c.detalle}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Misión semanal */}
      <div className="rounded-[2rem] border border-white/5 bg-[#161314] p-6">
        <p className="mb-4 flex items-center gap-2 font-display text-lg uppercase tracking-tight text-[#f7f3ec]"><Target className="h-4 w-4 text-[var(--accent)]" /> Misión de la semana</p>
        <div className="space-y-2.5">
          {misiones.map((m) => (
            <div key={m.label} className={`rounded-2xl border p-3 ${m.done ? "border-emerald-400/25 bg-emerald-400/5" : "border-white/5 bg-white/[.02]"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[#f7f3ec]">{m.label}</p>
                <span className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${m.done ? "bg-emerald-400/10 text-[#34d399]" : "text-[#7d6f5c]"}`}>
                  {m.done ? "✅ +" + m.pts + "pts" : `${Math.min(m.prog, m.meta)}/${m.meta}`}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.round((m.prog / m.meta) * 100))}%` }} />
              </div>
            </div>
          ))}
        </div>

        {!plan.stats && (datos.ofertasActivas > 0 || datos.seguidoresTotal > 0) && (
          <div className="mt-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}><Lock className="h-3.5 w-3.5" /> ¿Vale la pena Plan PRO?</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#a99b86]">
              Tenés {datos.seguidoresTotal} seguidor{datos.seguidoresTotal === 1 ? "" : "es"} y {datos.ofertasActivas} oferta{datos.ofertasActivas === 1 ? "" : "s"} activa{datos.ofertasActivas === 1 ? "" : "s"} sin poder ver el detalle de tus visitas.
              Con PRO ves qué canales y contenidos funcionan mejor para tu negocio.
            </p>
            <Link href="/dashboard/planes" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[var(--accent)] transition hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
              <TrendingUp className="h-3.5 w-3.5" /> Ver planes →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
