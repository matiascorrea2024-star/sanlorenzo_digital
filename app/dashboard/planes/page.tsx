"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Clock, Crown, Rocket, Zap, Gift, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { PLANES } from "@/lib/plans";
import { usePlatformSetting } from "@/lib/hooks/use-platform-settings";
import { uploadComprobante } from "@/lib/media";
import { friendlyError } from "@/lib/friendly-error";
import HowItWorks from "@/components/ui/how-it-works";

const CARDS = [
  { k: "gratis", icon: Zap, precio: "$0", features: ["Perfil completo", "3 ofertas activas", "5 productos", "Chat con clientes"] },
  { k: "plus", icon: Star, precio: "$4.900/mes", features: ["8 ofertas activas", "30 productos", "Estadísticas de visitas", "Responder reseñas", "WhatsApp destacado"] },
  { k: "profesional", icon: Rocket, precio: "$9.900/mes", features: ["Ofertas y catálogo ilimitados", "Historias 24h", "Estadísticas avanzadas", "Cupones con código", "Destacar catálogo", "Campañas por barrio"] },
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
  const [campanas, setCampanas] = useState<any[]>([]);
  const [misReclamos, setMisReclamos] = useState<string[]>([]);
  const [reclamando, setReclamando] = useState<string | null>(null);
  const [avisoCampana, setAvisoCampana] = useState("");
  const [pagandoMP, setPagandoMP] = useState<string | null>(null);
  const [avisoMP, setAvisoMP] = useState("");
  const whatsapp = usePlatformSetting("whatsapp_contacto");
  const datosPago = usePlatformSetting("datos_pago");

  // Vuelta desde Mercado Pago (back_urls) -- el plan recién se activa
  // cuando llega el webhook (puede tardar unos segundos), así que esto
  // es solo el mensaje inmediato, no la confirmación final.
  useEffect(() => {
    const pago = new URLSearchParams(window.location.search).get("pago");
    if (pago === "exito") setAvisoMP("✅ Pago recibido -- tu plan se activa en unos segundos.");
    else if (pago === "pendiente") setAvisoMP("⏳ Tu pago está pendiente de acreditarse.");
    else if (pago === "error") setAvisoMP("❌ El pago no se completó. Podés intentar de nuevo.");
  }, []);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const sb = supabase();
      const { data: biz } = await sb.from("businesses")
        .select("*").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      setNegocio(biz);
      if (biz) {
        const [{ data: sub }, { data: camps }, { data: claims }] = await Promise.all([
          sb.from("subscriptions").select("*").eq("business_id", biz.id).eq("status", "pending").maybeSingle(),
          sb.from("campaigns").select("*").eq("active", true).order("created_at", { ascending: false }),
          sb.from("campaign_claims").select("campaign_id").eq("business_id", biz.id),
        ]);
        setPendiente(sub);
        setCampanas((camps || []).filter((c: any) => !c.ends_at || new Date(c.ends_at) > new Date()));
        setMisReclamos((claims || []).map((c: any) => c.campaign_id));
      }
    })();
  }, [user]);

  const reclamarCampana = async (campaignId: string) => {
    if (!negocio) return;
    setReclamando(campaignId);
    setAvisoCampana("");
    try {
      const res = await fetch("/api/campaigns/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, business_id: negocio.id }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "No se pudo reclamar el beneficio.");
      setMisReclamos((prev) => [...prev, campaignId]);
      setNegocio((prev: any) => ({ ...prev, plan: campanas.find((c) => c.id === campaignId)?.grants_plan, plan_expira: j.expira, destacado: campanas.find((c) => c.id === campaignId)?.grants_plan === "premium" }));
    } catch (e: any) {
      setAvisoCampana(e.message);
    }
    setReclamando(null);
  };

  const pagarConMP = async (plan: string) => {
    if (!negocio) return;
    setPagandoMP(plan);
    setAvisoMP("");
    try {
      const res = await fetch("/api/mercadopago/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: negocio.id, plan }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "No se pudo iniciar el pago.");
      window.location.assign(j.init_point);
    } catch (e) {
      setAvisoMP(e instanceof Error ? e.message : "No se pudo iniciar el pago.");
      setPagandoMP(null);
    }
  };

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
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <DashboardNav />
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="font-bold">Necesitás un negocio para gestionar un plan.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Creá tu negocio y después elegís el plan que más te sirva.</p>
              <Link href="/dashboard/nuevo" className="mt-4 inline-block rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-black hover:opacity-90">Crear mi negocio</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <DashboardNav />
        <div className="mb-2 flex items-center gap-3">
          <Crown className="h-8 w-8 text-[var(--accent-ink)]" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Tu plan</h1>
            <p className="text-[var(--muted)]">
              Plan actual de <strong>{negocio.name}</strong>:{" "}
              <span className="font-black text-[var(--accent-ink)]">{PLANES[negocio.plan]?.name || "Gratis"}</span>
              {negocio.plan_expira && (
                <span className="text-[var(--muted2)]"> · vence el {new Date(negocio.plan_expira).toLocaleDateString("es-AR")}</span>
              )}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <HowItWorks steps={[
            "Elegí el plan y subí el comprobante de tu transferencia.",
            "Un admin lo revisa (normalmente el mismo día) y te activa el plan.",
            "Si hay una campaña gratuita disponible, la reclamás con un botón, sin pagar nada.",
          ]} />
        </div>

        {campanas.filter((c) => !misReclamos.includes(c.id)).map((c) => (
          <div key={c.id} className="mt-6 rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-r from-[var(--accent)]/[.08] to-[var(--accent2)]/[.04] p-1.5">
            <div className="flex flex-col items-start justify-between gap-3 rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Gift className="h-6 w-6 shrink-0 text-[var(--accent-ink)]" />
                <div>
                  <p className="font-black">{c.title}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {c.description || `Obtenés ${PLANES[c.grants_plan]?.name} gratis por ${c.grants_dias} días.`}
                  </p>
                </div>
              </div>
              <button onClick={() => reclamarCampana(c.id)} disabled={reclamando === c.id}
                className="shrink-0 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-black disabled:opacity-50">
                {reclamando === c.id ? "Reclamando..." : "Reclamar beneficio"}
              </button>
            </div>
          </div>
        ))}
        {avisoCampana && <p className="mt-3 text-sm text-[var(--bad)]">{avisoCampana}</p>}

        {pendiente && (
          <div className="mt-6 rounded-[1.5rem] border border-[var(--warn)]/25 bg-[var(--warn)]/[.06] p-1.5">
            <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Clock className="h-6 w-6 shrink-0 text-[var(--warn)]" />
              <div>
                <p className="font-bold text-[var(--warn)]">Solicitud de plan {PLANES[pendiente.plan]?.name} en revisión</p>
                <p className="text-xs text-[var(--muted)]">Enviamos tu comprobante. Te activamos el plan en cuanto lo revisemos (normalmente en el día).</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(p => {
            const actual = negocio.plan === p.k;
            const esGratis = p.k === "gratis";
            return (
              <div key={p.k}
                className={`relative rounded-[1.75rem] p-1.5 ${
                  actual ? "border border-[var(--accent)]/50 bg-gradient-to-b from-[var(--accent)]/[.1] to-[var(--accent2)]/[.04]" : "border border-[var(--ov-06)] bg-[var(--ov-02)]"
                }`}>
                {actual && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--accent)] px-4 py-1 text-xs font-black">
                    PLAN ACTUAL
                  </span>
                )}
                <div className={`flex h-full flex-col rounded-[1.375rem] border p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] ${actual ? "border-[var(--ov-08)] bg-[var(--card-inner)]" : "border-[var(--ov-05)] bg-[var(--card-inner)]"}`}>
                  <p.icon className={`h-7 w-7 ${actual ? "text-[var(--accent-ink)]" : "text-[var(--muted)]"}`} />
                  <h2 className="mt-2 text-lg font-black">{PLANES[p.k].name}</h2>
                  <p className="text-2xl font-black text-[var(--accent-ink)]">{p.precio}</p>
                  <ul className="mt-4 flex-1 space-y-2">
                    {p.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[var(--text)]/80">
                        <Check className="h-4 w-4 shrink-0 text-[var(--ok)]" /> {f}
                      </li>
                    ))}
                  </ul>

                  {actual || esGratis || pendiente?.plan === p.k ? (
                    <button disabled className="mt-5 rounded-full border border-[var(--line-strong)] py-2.5 text-sm font-black text-[var(--muted2)]">
                      {actual ? "Activo" : esGratis ? "Plan sin costo" : "Solicitud en curso"}
                    </button>
                  ) : pidiendo === p.k ? (
                    <div className="mt-5 space-y-2 rounded-xl border border-[var(--line)] bg-[var(--card-inner)] p-3">
                      <input type="file" accept="image/*" onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                        className="w-full text-xs text-[var(--muted)] file:mr-2 file:rounded-lg file:border-0 file:bg-[var(--ov-10)] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[var(--text)]" />
                      <button onClick={() => solicitar(p.k)} disabled={enviando}
                        className="w-full rounded-full bg-[var(--accent)] py-2 text-sm font-black hover:opacity-90 disabled:opacity-50">
                        {enviando ? "Enviando…" : "Enviar comprobante"}
                      </button>
                      <button onClick={() => { setPidiendo(null); setArchivo(null); setError(""); }} className="w-full text-xs text-[var(--muted2)] hover:text-[var(--muted)]">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-2">
                      <button onClick={() => pagarConMP(p.k)} disabled={pagandoMP === p.k}
                        className="w-full rounded-full bg-[var(--accent)] py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50">
                        {pagandoMP === p.k ? "Redirigiendo…" : "Pagar con Mercado Pago"}
                      </button>
                      <button onClick={() => setPidiendo(p.k)}
                        className="w-full rounded-full border border-[var(--line-strong)] py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--text)]/80">
                        O transferir y subir comprobante
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="mt-4 text-center text-sm text-[var(--bad)]">❌ {error}</p>}
        {avisoMP && <p className="mt-4 text-center text-sm text-[var(--text)]/70">{avisoMP}</p>}

        <div className="mx-auto mt-8 max-w-xl rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center text-sm text-[var(--muted)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <p className="font-bold text-[var(--text)]/80">¿Cómo se activa un plan pago?</p>
            <p className="mt-1">Con &quot;Pagar con Mercado Pago&quot; se activa solo apenas se acredita. Si preferís transferir, usá &quot;O transferir y subir comprobante&quot; -- un admin lo revisa y te lo activa.</p>
            {datosPago ? (
              <p className="mt-2 whitespace-pre-line rounded-xl bg-[var(--card-inner)] p-3 font-mono text-xs text-[var(--ok)]">{datosPago}</p>
            ) : whatsapp ? (
              <p className="mt-2">
                Escribinos por WhatsApp para coordinar el pago:{" "}
                <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="font-bold text-[var(--accent-ink)]">Contactar</a>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
