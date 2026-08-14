"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { puntosDe, nivelDe, proximoNivel, progresoDe } from "@/lib/levels";

export default function LevelBadge({ businessId, verificado }: { businessId: string; verificado?: boolean }) {
  const [puntos, setPuntos] = useState(0);
  const [seguidores, setSeguidores] = useState(0);
  const [resenas, setResenas] = useState(0);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { count: seg } = await sb
        .from("followers").select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      const { count: res } = await sb
        .from("reviews").select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      const { count: ofe } = await sb
        .from("offers").select("*", { count: "exact", head: true })
        .eq("business_id", businessId).eq("active", true);
      const { count: can } = await sb
        .from("coupons").select("*", { count: "exact", head: true })
        .eq("business_id", businessId).eq("status", "redeemed");
      
      const s = seg || 0;
      const r = res || 0;
      const o = ofe || 0;
      const c = can || 0;
      setSeguidores(s);
      setResenas(r);
      setPuntos(puntosDe(s, r, !!verificado, o, c));
    })();
  }, [businessId, verificado]);

  const nivel = nivelDe(puntos);
  const prox = proximoNivel(puntos);
  const prog = progresoDe(puntos);

  return (
    <div className="inline-flex flex-col gap-1">
      <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300">
        {nivel.icon} {nivel.nombre} · {puntos} pts
      </span>
      {prox ? (
        <div className="w-40">
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${prog}%` }} />
          </div>
          <p className="text-[10px] text-white/40 mt-0.5">
            → {prox.icon} {prox.nombre} (faltan {prox.min - puntos})
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-yellow-300">👑 División máxima</p>
      )}
    </div>
  );
}
