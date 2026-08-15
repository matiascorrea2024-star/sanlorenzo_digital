"use client";
import { useEffect, useState } from "react";
import { Check, Clock, Crown, Rocket, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { PLANES } from "@/lib/plans";
import { usePlatformSetting } from "@/lib/hooks/use-platform-settings";
import { uploadComprobante } from "@/lib/media";
import { friendlyError } from "@/lib/friendly-error";

const CARDS = [
  { k: "gratis", icon: Zap, precio: "$0", features: ["Perfil completo", "3 ofertas activas", "Chat con clientes", "Mapa y búsqueda"] },
  { k: "profesional", icon: Rocket, precio: "$9.900/mes", features: ["Ofertas ilimitadas", "Estadísticas completas", "Historias 24h", "Responder reseñas"] },
  { k: "premium", icon: Crown, precio: "$19.900 / 7 días", features: ["Todo lo de PRO Comerciante", "Posición destacada fija (7 días)", "Cupo limitado a 5 negocios", "Badge de destacado"] },
];

export default function PlanesDashboard() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<any>(null);
  const [pendiente, setPendiente] = useState<any>(null);
  const [pidiendo, setPidiendo] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  const datosPago = usePlatformSetting("datos_pago");

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("*").eq("owner_id", user.id).maybeSingle();
      setNegocio(biz);
      if (biz) {
        const { data: sub } = await supabase().from("subscriptions")
          .select("*").eq("business_id", biz.id).eq("status", "pending").maybeSingle();
        setPendiente(sub);
      }
    })();
  }, [user]);

  const solicitar = async (plan: string) => {
    if (!negocio || !archivo) { setError("Subí el comprobante de pago para continuar."); return; }
    setEnviando(true);
    setError("");
    try {
      const url = await uploadComprobante(archivo, negocio.id);
      const { data, error: insError } = await supabase().from("subscriptions")
        .insert({ business_id: negocio.id, plan, status: "pending", comprobante_url: url })
        .select().single();
      if (insError) throw insError;
      setPendiente(data);
      setPidiendo(null);
      setArchivo(null);
    } catch (err: unknown) {
      setError(friendlyError(err, "No se pudo enviar la solicitud. Probá de nuevo."));
    } finally {
      setEnviando(false);
    }
  };

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[#120d09] text-white pb-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <DashboardNav />
          <p className="text-white/50">Necesitás un negocio para gestionar tu plan.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <DashboardNav />
        <h1 className="text-3xl font-black">💳 Tu plan</h1>
        <p className="mt-1 text-white/60">
          Plan actual de <strong>{negocio.name}</strong>:{" "}
          <span className="font-black text-orange-400">{PLANES[negocio.plan]?.name || "Gratis"}</span>
          {negocio.plan_expira && (
            <span className="text-white/40"> · vence el {new Date(negocio.plan_expira).toLocaleDateString("es-AR")}</span>
          )}
        </p>

        {pendiente && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4">
            <Clock className="h-6 w-6 shrink-0 text-yellow-400" />
            <div>
              <p className="font-bold text-yellow-200">Solicitud de plan {PLANES[pendiente.plan]?.name} en revisión</p>
              <p className="text-xs text-white/60">Enviamos tu comprobante. Te activamos el plan en cuanto lo revisemos (normalmente en el día).</p>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {CARDS.map(p => {
            const actual = negocio.plan === p.k;
            const esGratis = p.k === "gratis";
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

                {actual || esGratis || pendiente ? (
                  <button disabled className="mt-5 rounded-xl border border-white/20 py-2.5 text-sm font-black text-white/40">
                    {actual ? "Activo" : esGratis ? "Plan sin costo" : "Solicitud en curso"}
                  </button>
                ) : pidiendo === p.k ? (
                  <div className="mt-5 space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
                    <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                      className="w-full text-xs text-white/60 file:mr-2 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
                    <button onClick={() => solicitar(p.k)} disabled={enviando}
                      className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-2 text-sm font-black hover:opacity-90 disabled:opacity-50">
                      {enviando ? "Enviando…" : "Enviar comprobante"}
                    </button>
                    <button onClick={() => { setPidiendo(null); setArchivo(null); setError(""); }} className="w-full text-xs text-white/40 hover:text-white/60">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setPidiendo(p.k)}
                    className="mt-5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-black hover:opacity-90">
                    Quiero este plan
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-red-300">❌ {error}</p>}

        <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center text-sm text-white/60">
          <p className="font-bold text-white/80">¿Cómo se activa un plan pago?</p>
          <p className="mt-1">Transferí el importe y subí el comprobante desde el botón &quot;Quiero este plan&quot;. Un admin lo revisa y te lo activa.</p>
          {datosPago ? (
            <p className="mt-2 whitespace-pre-line rounded-xl bg-black/20 p-3 font-mono text-xs text-emerald-300">{datosPago}</p>
          ) : whatsapp ? (
            <p className="mt-2">
              Escribinos por WhatsApp para coordinar el pago:{" "}
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-400">Contactar</a>
            </p>
          ) : null}
          <p className="mt-3 text-xs text-white/30">Pago automático con Mercado Pago: próximamente.</p>
        </div>
      </div>
    </main>
  );
}
