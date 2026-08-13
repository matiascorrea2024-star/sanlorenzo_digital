"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const icono = (p: number) => (p >= 600 ? "👑" : p >= 300 ? "🔎" : p >= 150 ? "🧭" : p >= 50 ? "🚶" : "🌱");
const medalla = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);

export default function VecinosPage() {
  const [vecinos, setVecinos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [miRank, setMiRank] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const [f, r, a] = await Promise.all([
        sb.from("followers").select("user_id"),
        sb.from("reviews").select("user_id, user_email"),
        sb.from("user_activity").select("user_id"),
      ]);
      const emails: Record<string, string> = {};
      (r.data || []).forEach((x: any) => {
        if (x.user_id && x.user_email) emails[x.user_id] = x.user_email;
      });
      const ids = [...new Set([
        ...(f.data || []).map((x: any) => x.user_id),
        ...(r.data || []).map((x: any) => x.user_id),
        ...(a.data || []).map((x: any) => x.user_id),
      ])].filter(Boolean) as string[];

      const lista: any[] = [];
      for (const id of ids.slice(0, 30)) {
        const { data: pts } = await sb.rpc("nivel_usuario", { uid: id });
        lista.push({
          id,
          nombre: emails[id] ? emails[id].split("@")[0] : "Vecino #" + id.slice(0, 4),
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
    <main className="bg-[#0d0a12] text-white min-h-screen pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">👥 Ranking de vecinos</h1>
        <p className="text-white/60 mt-1">Los vecinos más activos de San Lorenzo. ¿Llegás al podio?</p>
      </div>

      {miRank && (
        <div className="mx-auto max-w-3xl px-4 mb-6">
          <div className="rounded-2xl border border-orange-400/50 bg-orange-500/10 p-4 text-center">
            <p className="text-sm font-black text-orange-300">📍 Vas {miRank.puesto}º de {miRank.total} vecinos · {miRank.puntos} puntos</p>
            <p className="text-xs text-white/50 mt-1">Seguí sumando para aparecer en el podio 👆</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4">
        {loading ? (
          <p className="text-center text-white/50 py-16">Cargando vecinos…</p>
        ) : (
          <div className="grid gap-3">
            {vecinos.map((v, i) => (
              <div key={v.id} className={`rounded-2xl border p-4 flex items-center gap-4 ${i === 0 ? "border-yellow-400/50 bg-yellow-500/10" : "border-white/10 bg-white/5"}`}>
                <span className="w-10 text-center text-2xl font-black">{medalla(i)}</span>
                <div className="flex-1">
                  <p className="font-bold">{icono(v.puntos)} {v.nombre}</p>
                  <p className="text-xs text-white/50">Vecino de San Lorenzo</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-orange-400">{v.puntos}</p>
                  <p className="text-[10px] uppercase text-white/40">puntos</p>
                </div>
              </div>
            ))}
            {vecinos.length === 0 && (
              <p className="text-center text-white/50 py-16">Todavía no hay vecinos activos. ¡Sé el primero!</p>
            )}
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <h2 className="text-xl font-black">🎖 ¿Cómo se sube?</h2>
          <p className="mt-2 text-sm text-white/60">Visitá negocios, contactá por WhatsApp, compartí ofertas y dejá reseñas.</p>
          <Link href="/perfil" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
            Ver mis misiones →
          </Link>
        </div>
      </div>
    </main>
  );
}
