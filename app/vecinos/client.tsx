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
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <RankingSwitch current="vecinos" />

        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Comunidad activa</p>
        <h1 className="mt-2 font-display text-5xl uppercase leading-[0.9] tracking-tight text-[var(--text)] sm:text-6xl">
          RANKING DE{" "}
          <span className="bg-gradient-to-r from-[var(--accent)] to-[#fbbf24] bg-clip-text text-transparent">VECINOS</span>
        </h1>
        <p className="mt-4 max-w-lg text-lg text-[var(--muted)]">Los vecinos más activos de San Lorenzo. ¿Llegás al podio?</p>

        {miRank && (
          <div className="mt-8 rounded-2xl border border-[var(--accent)]/20 bg-[var(--surface)] p-5 text-center">
            <p className="text-sm font-black text-[var(--accent)]">
              📍 Vas {miRank.puesto}º de {miRank.total} vecinos · {miRank.puntos} puntos
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">Seguí sumando para aparecer en el podio 👇</p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          {loading && <p className="text-center text-[var(--muted)]">Cargando vecinos...</p>}
          {!loading &&
            vecinos.map((v, i) => {
              const r = rangoDeUsuario(v.puntos);
              return (
                <div key={v.id} className={`rounded-2xl border p-4 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)] ${i === 0 ? "border-[#fbbf24]/25 bg-gradient-to-br from-[#fbbf24]/5 to-transparent" : "border-[var(--line)] bg-[var(--surface)]"}`}>
                  <div className="flex items-center gap-4">
                    <span className={`shrink-0 text-center leading-none ${i === 0 ? "gold-glow w-14 font-display text-4xl text-[#fbbf24]" : i < 3 ? "w-12 text-3xl text-[#fbbf24]" : "w-10 font-display text-2xl text-[var(--accent)]"}`}>{medalla(i)}</span>
                    <DivisionFrame puntos={v.puntos} escala={ESCALA_PUNTOS_USUARIO} size={i === 0 ? 56 : 40}>
                      <Avatar name={v.nombre} size={i === 0 ? 52 : 40} />
                    </DivisionFrame>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-bold capitalize ${i === 0 ? "text-lg" : ""}`}>{v.nombre}</p>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: r.accent }}>{r.rango}{r.tier && ` ${r.tier}`}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-display text-3xl ${i === 0 ? "gold-glow text-[#fbbf24]" : i < 3 ? "text-[#fbbf24]" : "text-[var(--accent)]"}`}>{v.puntos}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">puntos</p>
                    </div>
                  </div>
                </div>
              );
            })}
          {!loading && vecinos.length === 0 && (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center">
              <p className="text-lg font-bold">Todavía no hay vecinos en el ranking</p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas para sumar puntos.
              </p>
              <Link href="/promociones" className="btn-hard mt-4 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                Ver ofertas →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-center">
          <p className="font-display text-xl uppercase tracking-tight text-[var(--text)]">🎖 ¿Cómo se sube?</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas.
          </p>
          <Link href="/perfil" className="btn-hard mt-4 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
            Ver mis misiones →
          </Link>
        </div>
      </div>
    </main>
  );
}
