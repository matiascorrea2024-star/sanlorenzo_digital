"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import RankingSwitch from "@/components/ui/ranking-switch";

const icono = (p: number) => (p >= 600 ? "👑" : p >= 300 ? "🔎" : p >= 150 ? "🧭" : p >= 50 ? "🚶" : "🌱");
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

      const lista: any[] = [];
      for (const id of ids.slice(0, 30)) {
        const { data: pts } = await sb.rpc("nivel_usuario", { uid: id });
        lista.push({
          id,
          nombre: nombres[id] || "Vecino #" + id.slice(0, 4),
          puntos: pts || 0,
        });
      }
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
    <main className="min-h-screen bg-[#120d09] pb-24 text-white">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <RankingSwitch current="vecinos" />

        <h1 className="mt-6 text-3xl font-black">Ranking de vecinos</h1>
        <p className="mt-1 text-sm text-white/60">Los vecinos más activos de San Lorenzo. ¿Llegás al podio?</p>

        {miRank && (
          <div className="mt-6 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 text-center">
            <p className="text-sm font-black text-orange-300">
              📍 Vas {miRank.puesto}º de {miRank.total} vecinos · {miRank.puntos} puntos
            </p>
            <p className="mt-1 text-xs text-white/60">Seguí sumando para aparecer en el podio 👇</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading && <p className="text-center text-white/50">Cargando vecinos...</p>}
          {!loading &&
            vecinos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <span className="w-10 text-center text-xl font-black">{medalla(i)}</span>
                <span className="text-2xl">{icono(v.puntos)}</span>
                <div className="flex-1">
                  <p className="font-bold capitalize">{v.nombre}</p>
                  <p className="text-xs text-white/50">Vecino de San Lorenzo</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-400">{v.puntos}</p>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">puntos</p>
                </div>
              </div>
            ))}
          {!loading && vecinos.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[.03] p-10 text-center">
              <p className="text-lg font-bold">Todavía no hay vecinos en el ranking</p>
              <p className="mt-1 text-sm text-white/50">
                Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas para sumar puntos.
              </p>
              <Link href="/promociones" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black">
                Ver ofertas →
              </Link>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[.03] p-6 text-center">
          <p className="font-black">🎖 ¿Cómo se sube?</p>
          <p className="mt-1 text-sm text-white/60">
            Seguí negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas.
          </p>
          <Link href="/perfil" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black">
            Ver mis misiones →
          </Link>
        </div>
      </div>
    </main>
  );
}
