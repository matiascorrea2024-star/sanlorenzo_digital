"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { nivelDe, puntosDe } from "@/lib/levels";

export default function LevelBadge({ businessId, verificado }: { businessId: string; verificado?: boolean }) {
  const [puntos, setPuntos] = useState(0);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { count: seg } = await sb
        .from("followers").select("*", { count: "exact", head: true })
        .eq("business_id", businessId);
      const { count: res } = await sb
        .from("reviews").select("*", { count: "exact", head: true })
        .eq("business_id", businessId).eq("approved", true);
      setPuntos(puntosDe(seg || 0, res || 0, !!verificado));
    })();
  }, [businessId, verificado]);

  const n = nivelDe(puntos);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-black text-orange-300"
      title={n.siguiente ? `${puntos} puntos · faltan ${n.faltan} para ${n.siguiente.nombre}` : `${puntos} puntos · nivel máximo`}
    >
      {n.icon} Nivel {n.nombre}
      {n.siguiente && <span className="font-normal text-white/50">· {n.faltan} pts para {n.siguiente.icon}</span>}
    </span>
  );
}
