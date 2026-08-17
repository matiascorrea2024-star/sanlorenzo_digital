"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RankingSwitch from "@/components/ui/ranking-switch";
import DivisionFrame from "@/components/ui/division-frame";
import Avatar from "@/components/ui/avatar";
import { rangoDeUsuario, ESCALA_PUNTOS_USUARIO } from "@/lib/ranks";

const medalla = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);

export default function VecinosPage() {
  const [vecinos, setVecinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miRank, setMiRank] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      // Antes se armaban los nombres desde "reviews" (tabla huérfana --
      // ver components/business/review-moderation.tsx: hace tiempo que
      // nadie escribe ahí, las reseñas reales van a business_reviews),
      // así que casi ningún vecino mostraba su nombre real. La fuente
      // correcta de nombre es user_profiles.display_name.
      // Solo se necesitan ~30 vecinos distintos (ver slice más abajo) --
      // traer las 3 tablas enteras crece para siempre con la actividad
      // de toda la plataforma. Ordenado por más reciente + un límite
      // generoso alcanza de sobra para juntar 30 ids distintos.
      const [f, r, a] = await Promise.all([
        sb.from("followers").select("user_id").order("created_at", { ascending: false }).limit(300),
        sb.from("business_reviews").select("user_id").order("created_at", { ascending: false }).limit(300),
        sb.from("user_activity").select("user_id").order("created_at", { ascending: false }).limit(300),
      ]);
      const ids = [...new Set([
        ...(f.data || []).map((x: any) => x.user_id),
        ...(r.data || []).map((x: any) => x.user_id),
        ...(a.data || []).map((x: any) => x.user_id),
      ])].filter(Boolean) as string[];

      const nombres: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await sb.from("user_profiles").select("user_id, display_name").in("user_id", ids.slice(0, 30));
        (profs || []).forEach((p: any) => { if (p.display_name) nombres[p.user_id] = p.display_name; });
      }

      const idsTop = ids.slice(0, 30);
      const puntosPorId = await Promise.all(
        idsTop.map((id) => sb.rpc("nivel_usuario", { uid: id }).then(({ data }) => data || 0))
      );
      const lista: any[] = idsTop.map((id, i) => ({
        id,
        nombre: nombres[id] || "Vecino #" + id.slice(0, 4),
        puntos: puntosPorId[i],
      }));
      lista.sort((x, y) => y.puntos - x.puntos);
      setVecinos(lista.slice(0, 10));
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: pts } = await sb.rpc("nivel_usuario", { uid: user.id });
        const mios = pts || 0;
        const puesto = lista.filter((v) => v.puntos > mios).length + 1;
        setMiRank({ puesto, puntos: mios, total: Math.max(lista.length, puesto) });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[#0c0a0b] pb-24 text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <RankingSwitch current="vecinos" />

        <p className="mt-8 text-[10px] font-black uppercase tracking-[.4em] text-orange-500">Comunidad activa</p>
        <h1 className="mt-2 text-5xl font-black uppercase leading-[0.9] tracking-tighter sm:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
          RANKING DE{" "}
          <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">VECINOS</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/50">Los vecinos más activos de San Lorenzo. ¿Llegás al podio?</p>

        {miRank && (
          <div className="mt-8 rounded-[1.75rem] border border-orange-400/20 bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-5 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <p className="text-sm font-black text-orange-300">
                📍 Vas {miRank.puesto}º de {miRank.total} vecinos · {miRank.puntos} puntos
              </p>
              <p className="mt-1 text-xs text-white/50">Seguí sumando para aparecer en el podio 👇</p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {loading && <p className="text-center text-white/50">Cargando vecinos...</p>}
          {!loading &&
            vecinos.map((v, i) => {
              const r = rangoDeUsuario(v.puntos);
              return (
                <div key={v.id} className={`rounded-[1.5rem] border transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 ${i === 0 ? "p-2 border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-transparent" : "p-1.5 border-white/[.06] bg-white/[.02]"}`}>
                  <div className={`flex items-center gap-4 rounded-[1.1rem] border border-white/[.05] bg-black/10 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] ${i === 0 ? "p-5" : "p-3.5"}`}>
                    <span className={`shrink-0 text-center font-black ${i === 0 ? "w-12 text-4xl" : "w-8 text-xl"}`}>{medalla(i)}</span>
                    <DivisionFrame puntos={v.puntos} escala={ESCALA_PUNTOS_USUARIO} size={i === 0 ? 56 : 40}>
                      <Avatar name={v.nombre} size={i === 0 ? 52 : 40} />
                    </DivisionFrame>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-bold capitalize ${i === 0 ? "text-lg" : ""}`} style={i === 0 ? { fontFamily: "var(--font-space)" } : undefined}>{v.nombre}</p>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: r.accent }}>{r.rango}{r.tier && ` ${r.tier}`}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-orange-400" style={{ fontFamily: "var(--font-ticket)" }}>{v.puntos}</p>
                      <p className="text-[10px] uppercase tracking-wider text-white/40">puntos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          {!loading && vecinos.length === 0 && (
            <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <p className="text-lg font-bold">Todavía no hay vecinos en el ranking</p>
                <p className="mt-1 text-sm text-white/50">
                  Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas para sumar puntos.
                </p>
                <Link href="/promociones" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black">
                  Ver ofertas →
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-6 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            <p className="font-black">🎖 ¿Cómo se sube?</p>
            <p className="mt-1 text-sm text-white/50">
              Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas.
            </p>
            <Link href="/perfil" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black">
              Ver mis misiones →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
