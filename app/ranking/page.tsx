"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/data";
import { nivelDe } from "@/lib/levels";

type Fila = {
  id: string; name: string; slug: string; category: string; status: string;
  seguidores: number; resenas: number; puntos: number;
};

export default function RankingPage() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cat, setCat] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: neg } = await sb.from("businesses").select("id, name, slug, category, status");
      const { data: fol } = await sb.from("followers").select("business_id");
      const { data: rev } = await sb.from("reviews").select("business_id").eq("approved", true);
      const lista = (neg || []).map((b: any) => {
        const seg = (fol || []).filter((f: any) => f.business_id === b.id).length;
        const res = (rev || []).filter((r: any) => r.business_id === b.id).length;
        const puntos = seg * 5 + res * 3 + (b.status === "verificado" ? 10 : 0);
        return { ...b, seguidores: seg, resenas: res, puntos };
      }).sort((a: any, b: any) => b.puntos - a.puntos);
      setFilas(lista);
    })();
  }, []);

  const lista = cat ? filas.filter((f) => f.category === cat) : filas;
  const medalla = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`);

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-16">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">🏆 Ranking de San Lorenzo</h1>
        <p className="text-white/60 mt-1">
          Los puntos se ganan con seguidores, reseñas y verificación. <strong className="text-orange-300">No con plata.</strong>
        </p>
        <Link href="/vecinos" className="mt-3 inline-block rounded-xl border border-orange-400/40 bg-orange-500/10 px-4 py-2 text-sm font-black text-orange-300 hover:bg-orange-500/20">👥 Ver ranking de vecinos →</Link>
      </div>

      <div className="mx-auto max-w-4xl px-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCat(null)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${!cat ? "bg-orange-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
             General
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id === cat ? null : c.id)} className={`rounded-full px-4 py-1.5 text-xs font-bold ${cat === c.id ? "bg-orange-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4">
        <div className="grid gap-3">
          {lista.map((f, i) => (
            <Link key={f.id} href={"/negocio/" + f.slug} className={`rounded-2xl border p-4 flex items-center gap-4 transition hover:border-orange-400/60 ${i === 0 ? "border-yellow-400/50 bg-yellow-500/10" : "border-white/10 bg-white/5"}`}>
              <span className="w-10 text-center text-2xl font-black">{medalla(i)}</span>
              <div className="flex-1">
                <p className="font-bold">
                  {f.name} {f.status === "verificado" && <span className="text-green-400 text-xs">✓</span>}
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black text-orange-300">
                    {nivelDe(f.puntos).icon} {nivelDe(f.puntos).nombre}
                  </span>
                </p>
                <p className="text-xs text-white/50 capitalize">
                  {f.category} · ❤️ {f.seguidores} seguidores · ⭐ {f.resenas} reseñas
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-orange-400">{f.puntos}</p>
                <p className="text-[10px] uppercase text-white/40">puntos</p>
              </div>
            </Link>
          ))}
          {lista.length === 0 && (
            <p className="text-center text-white/50 py-16">Todavía no hay negocios en esta categoría.</p>
          )}
        </div>

        <div className="mt-10 rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <h2 className="text-xl font-black">🚀 Subí en el ranking</h2>
          <p className="mt-2 text-sm text-white/60">Conseguí seguidores y reseñas de tus clientes para escalar posiciones.</p>
          <Link href="/para-negocios" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
            Quiero mi negocio acá →
          </Link>
        </div>
      </div>
    </main>
  );
}
