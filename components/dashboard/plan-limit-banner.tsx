"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Rocket } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { puedePublicarOferta, PLANES } from "@/lib/plans";

export default function PlanLimitBanner() {
  const { user } = useAuth();
  const [info, setInfo] = useState<{ plan: string; activas: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("id, plan").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      if (!biz) return;
      const { count } = await supabase().from("offers")
        .select("*", { count: "exact", head: true })
        .eq("business_id", biz.id).eq("active", true);
      setInfo({ plan: biz.plan || "gratis", activas: count || 0 });
    })();
  }, [user]);

  if (!info) return null;
  if (puedePublicarOferta(info.plan, info.activas)) return null;

  const plan = PLANES[info.plan] || PLANES.gratis;

  return (
    <div className="mb-6 rounded-[2rem] border border-[var(--accent)]/30 bg-[#161314]">
      <div className="flex flex-col items-center justify-between gap-4 p-6 md:flex-row">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10">
            <Lock className="h-5 w-5 text-[var(--accent)]" />
          </span>
          <div>
            <p className="font-display text-lg uppercase tracking-tight text-[#f7f3ec]">
              Llegaste al límite del plan {plan.name} ({info.activas} oferta{info.activas === 1 ? "" : "s"} activa{info.activas === 1 ? "" : "s"})
            </p>
            <p className="mt-0.5 text-sm text-[#a99b86]">
              Pasá a PRO Comerciante para publicar ofertas ilimitadas + estadísticas + historias.
            </p>
          </div>
        </div>
        <Link href="/dashboard/planes"
          className="btn-hard flex shrink-0 items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
          style={{ fontFamily: "var(--font-display)" }}>
          <Rocket className="h-4 w-4" /> Mejorar plan
        </Link>
      </div>
    </div>
  );
}
