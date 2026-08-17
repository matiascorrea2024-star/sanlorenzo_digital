"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, ThumbsUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hoyArgentina } from "@/lib/fecha-ar";

export default function VotoDelDia() {
  const router = useRouter();
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [votos, setVotos] = useState<Record<string, number>>({});
  const [miVoto, setMiVoto] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargar = async () => {
    const sb = supabase();
    const { data: { user } } = await sb.auth.getUser();
    setUser(user);

    const { data: offs } = await sb.from("offers_with_business")
      .select("*").eq("active", true).eq("valid_until", hoyArgentina()).limit(20);
    setOfertas(offs || []);

    const { data: v } = await sb.from("daily_votes").select("offer_id, user_id").eq("vote_date", hoyArgentina());
    const counts: Record<string, number> = {};
    (v || []).forEach((r: any) => { counts[r.offer_id] = (counts[r.offer_id] || 0) + 1; });
    setVotos(counts);
    if (user) setMiVoto((v || []).find((r: any) => r.user_id === user.id)?.offer_id || null);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const votar = async (offerId: string) => {
    if (!user) { router.push("/login"); return; }
    const sb = supabase();
    if (miVoto) {
      await sb.from("daily_votes").delete().eq("user_id", user.id).eq("vote_date", hoyArgentina());
    }
    if (miVoto !== offerId) {
      await sb.from("daily_votes").insert({ offer_id: offerId, user_id: user.id, vote_date: hoyArgentina() });

      // Si esta oferta pasa a liderar la votación, se avisa una sola vez
      // al negocio (no en cada voto, para no llenarlo de notificaciones).
      const nuevoTotal = (votos[offerId] || 0) + 1;
      const lider = Object.entries({ ...votos, [offerId]: nuevoTotal }).sort((a, b) => b[1] - a[1])[0];
      if (lider?.[0] === offerId && nuevoTotal > Math.max(0, ...Object.entries(votos).filter(([k]) => k !== offerId).map(([, n]) => n))) {
        const oferta = ofertas.find((o) => o.id === offerId);
        if (oferta?.business_id) {
          const { data: biz } = await sb.from("businesses").select("owner_id").eq("id", oferta.business_id).maybeSingle();
          if (biz?.owner_id) {
            await sb.from("notifications").insert({
              user_id: biz.owner_id,
              business_id: oferta.business_id,
              type: "voto_dia",
              title: "🏆 ¡Tu oferta está ganando el Voto del día!",
              body: oferta.title,
              link: `/oferta/${offerId}`,
            });
          }
        }
      }
    }
    cargar();
  };

  if (loading || ofertas.length === 0) return null;

  const maxVotos = Math.max(1, ...Object.values(votos));
  const ranking = [...ofertas].sort((a, b) => (votos[b.id] || 0) - (votos[a.id] || 0)).slice(0, 5);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-3xl border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/5 p-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-yellow-300">Voto del día</p>
        </div>
        <h2 className="mt-2 text-2xl font-black">¿Cuál es la mejor oferta de hoy?</h2>
        <p className="mt-1 text-sm text-white/50">Votá y ayudá a elegir la oferta destacada de San Lorenzo. Un voto por día.</p>

        <div className="mt-5 space-y-2">
          {ranking.map((o, i) => {
            const v = votos[o.id] || 0;
            const yo = miVoto === o.id;
            return (
              <div key={o.id} className={`rounded-2xl border p-3 transition ${i === 0 && v > 0 ? "border-yellow-400/50 bg-yellow-500/10" : "border-white/10 bg-white/[0.02]"}`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-black text-white/40">{i === 0 && v > 0 ? "🏆" : i + 1}</span>
                  <Link href={`/oferta/${o.id}`} className="min-w-0 flex-1 hover:text-orange-300">
                    <p className="truncate text-sm font-bold">{o.title}</p>
                    <p className="truncate text-xs text-white/40">{o.business_name}</p>
                  </Link>
                  <button onClick={() => votar(o.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black transition ${yo ? "bg-orange-500 text-white" : "border border-white/15 text-white/70 hover:border-orange-400/50"}`}>
                    <ThumbsUp className="h-3.5 w-3.5" /> {v}
                  </button>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" style={{ width: `${(v / maxVotos) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
