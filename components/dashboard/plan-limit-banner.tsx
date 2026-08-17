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
        .select("id, plan").eq("owner_id", user.id).maybeSingle();
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
    <div className="mb-6 rounded-[1.75rem] border border-orange-400/30 bg-gradient-to-r from-orange-500/[.1] to-red-600/[.06] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-black text-[var(--text)]">
                Llegaste al límite del plan {plan.name} ({info.activas} oferta{info.activas === 1 ? "" : "s"} activa{info.activas === 1 ? "" : "s"})
              </p>
              <p className="text-sm text-[var(--muted)]">
                Pasá a PRO Comerciante para publicar ofertas ilimitadas + estadísticas + historias.
              </p>
            </div>
          </div>
          <Link href="/dashboard/planes"
            className="flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-black hover:opacity-90">
            <Rocket className="h-4 w-4" /> Mejorar plan
          </Link>
        </div>
      </div>
    </div>
  );
}
