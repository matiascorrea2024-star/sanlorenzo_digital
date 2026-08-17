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
    return <div className="mb-8 h-40 animate-pulse rounded-3xl border border-[var(--line)] bg-[var(--ov-05)]" />;
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
  const scoreColor = score >= 80 ? "text-green-400" : score >= 50 ? "text-orange-400" : "text-[var(--muted)]";

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
      <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-black text-[var(--text)]">
            💎 Reputación digital
            <InfoTip label="Qué es la reputación digital">Un puntaje de 0 a 100 basado en cosas reales: perfil completo, buenas reseñas, si respondés a clientes, si publicás ofertas y si mantenés el catálogo actualizado.</InfoTip>
          </p>
          <span className={`text-2xl font-black tabular-nums ${scoreColor}`}>{score}<span className="text-sm text-[var(--muted2)]">/100</span></span>
        </div>
        <p className={`mb-3 text-xs font-bold ${scoreColor}`}>{scoreLabel}</p>
        <div className="space-y-1.5">
          {checklist.map((c) => (
            <div key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" /> : <Circle className="h-4 w-4 shrink-0 text-[var(--ov-20)]" />}
              <span className={c.ok ? "text-[var(--text)]/80" : "text-[var(--muted2)]"}>{c.label}</span>
              <span className="ml-auto text-[10px] text-[var(--muted2)]">{c.detalle}</span>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Misión semanal */}
      <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <p className="mb-3 flex items-center gap-1.5 font-black text-[var(--text)]"><Target className="h-4 w-4 text-orange-400" /> Misión de la semana</p>
        <div className="space-y-2.5">
          {misiones.map((m) => (
            <div key={m.label} className={`rounded-xl border p-3 ${m.done ? "border-green-400/40 bg-green-500/10" : "border-[var(--line)] bg-[var(--card-inner)]"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-[var(--text)]">{m.label}</p>
                <span className={`shrink-0 text-[10px] font-black ${m.done ? "text-green-300" : "text-[var(--muted2)]"}`}>
                  {m.done ? "✅ +" + m.pts + "pts" : `${Math.min(m.prog, m.meta)}/${m.meta}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!plan.stats && (datos.ofertasActivas > 0 || datos.seguidoresTotal > 0) && (
          <div className="mt-4 rounded-xl border border-orange-400/30 bg-orange-500/10 p-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-orange-300"><Lock className="h-3.5 w-3.5" /> ¿Vale la pena Plan PRO?</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tenés {datos.seguidoresTotal} seguidor{datos.seguidoresTotal === 1 ? "" : "es"} y {datos.ofertasActivas} oferta{datos.ofertasActivas === 1 ? "" : "s"} activa{datos.ofertasActivas === 1 ? "" : "s"} sin poder ver el detalle de tus visitas.
              Con PRO ves exactamente quién te encuentra y qué funciona mejor.
            </p>
            <Link href="/dashboard/planes" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-orange-400 hover:text-orange-300">
              <TrendingUp className="h-3.5 w-3.5" /> Ver planes →
            </Link>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
