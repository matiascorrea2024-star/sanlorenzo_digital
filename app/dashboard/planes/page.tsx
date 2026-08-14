"use client";
import { useEffect, useState } from "react";
import { Check, Crown, Rocket, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { PLANES } from "@/lib/plans";

const CARDS = [
  { k: "gratis", icon: Zap, precio: "$0", features: ["Perfil completo", "1 oferta activa", "Chat con clientes", "Mapa y búsqueda"] },
  { k: "profesional", icon: Rocket, precio: "$9.900/mes", features: ["Ofertas ilimitadas", "Estadísticas completas", "Historias 24h", "Responder reseñas"] },
  { k: "premium", icon: Crown, precio: "$19.900/mes", features: ["Todo lo de Profesional", "Destacado en home y ranking", "Badge ⭐ Premium", "Prioridad en búsqueda"] },
];

export default function PlanesDashboard() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<any>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("*").eq("owner_id", user.id).maybeSingle();
      setNegocio(biz);
    })();
  }, [user]);

  const cambiar = async (plan: string) => {
    if (!negocio) return;
    setSaving(plan);
    // Activar nuevo plan + registrar suscripción (sin pago todavía)
    await supabase().from("businesses").update({ plan }).eq("id", negocio.id);
    await supabase().from("subscriptions").insert({
      business_id: negocio.id,
      plan,
      status: "active",
    });
    setNegocio({ ...negocio, plan });
    setSaving(null);
  };

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[#0a0710] text-white pb-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <DashboardNav />
          <p className="text-white/50">Necesitás un negocio para gestionar tu plan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <DashboardNav />
        <h1 className="text-3xl font-black">💳 Tu plan</h1>
        <p className="mt-1 text-white/60">
          Plan actual de <strong>{negocio.name}</strong>:{" "}
          <span className="font-black text-orange-400">{PLANES[negocio.plan]?.name || "Gratis"}</span>
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CARDS.map(p => {
            const actual = negocio.plan === p.k;
            return (
              <div key={p.k}
                className={`relative flex flex-col rounded-3xl border-2 p-6 ${
                  actual ? "border-orange-400/70 bg-orange-500/10" : "border-white/10 bg-white/5"
                }`}>
                {actual && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-1 text-xs font-black">
                    PLAN ACTUAL
                  </span>
                )}
                <p.icon className={`h-7 w-7 ${actual ? "text-orange-400" : "text-white/50"}`} />
                <h2 className="mt-2 text-lg font-black">{PLANES[p.k].name}</h2>
                <p className="text-2xl font-black text-orange-400">{p.precio}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                      <Check className="h-4 w-4 shrink-0 text-green-400" /> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => cambiar(p.k)} disabled={actual || saving !== null}
                  className={`mt-5 rounded-xl py-2.5 text-sm font-black transition ${
                    actual ? "border border-white/20 text-white/50" : "bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90"
                  }`}>
                  {saving === p.k ? "Cambiando..." : actual ? "Activo" : "Cambiar a este plan"}
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Hoy el cambio de plan es inmediato y sin cargo. Cuando habilitemos pagos,
          se procesará por Mercado Pago / Stripe sin cambiar esta arquitectura.
        </p>
      </div>
    </main>
  );
}
