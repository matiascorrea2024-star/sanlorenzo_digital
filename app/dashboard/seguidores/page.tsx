"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Send, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import HowItWorks from "@/components/ui/how-it-works";
import { planDe } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";

const MAX_DESTINATARIOS = 500;

export default function SeguidoresPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [nuevosMes, setNuevosMes] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const sb = supabase();
      const { data: biz } = await sb.from("businesses").select("*").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      if (biz) {
        setNegocio(biz);
        const desdeMes = new Date(Date.now() - 30 * 86400000).toISOString();
        const [{ count: t }, { count: nm }] = await Promise.all([
          sb.from("followers").select("id", { count: "exact", head: true }).eq("business_id", biz.id),
          sb.from("followers").select("id", { count: "exact", head: true }).eq("business_id", biz.id).gte("created_at", desdeMes),
        ]);
        setTotal(t || 0);
        setNuevosMes(nm || 0);
      }
      setLoading(false);
    })();
  }, [user]);

  const plan = planDe(negocio);

  const enviarNovedad = async () => {
    if (!negocio || !mensaje.trim()) return;
    setEnviando(true);
    try {
      const sb = supabase();
      const { data: seguidores } = await sb.from("followers").select("user_id").eq("business_id", negocio.id).limit(MAX_DESTINATARIOS);
      const filas = (seguidores || []).map((s) => ({
        user_id: s.user_id,
        business_id: negocio.id,
        type: "business_news",
        title: `📣 Novedad de ${negocio.name}`,
        body: mensaje.trim().slice(0, 200),
        link: `/negocio/${negocio.slug}`,
      }));
      if (filas.length > 0) {
        const { error } = await sb.from("notifications").insert(filas);
        if (error) throw error;
      }
      show(`✅ Enviado a ${filas.length} seguidor${filas.length === 1 ? "" : "es"}`, "success");
      setMensaje("");
    } catch {
      show("❌ No se pudo enviar. Probá de nuevo.", "error");
    }
    setEnviando(false);
  };

  if (loading) {
    return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;
  }

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <DashboardNav />
          <p className="text-[var(--muted)]">Necesitás un negocio para ver tus seguidores.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <DashboardNav />
        <div className="mb-6 flex items-center gap-3">
          <Heart className="h-8 w-8 text-[var(--accent-ink)]" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Tus seguidores</h1>
            <p className="text-[var(--muted)]">La audiencia propia de {negocio.name} dentro de la plataforma</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black text-[var(--accent-ink)]">{total}</p>
              <p className="text-xs text-[var(--muted)]">Seguidores totales</p>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="text-3xl font-black text-[var(--ok)]">+{nuevosMes}</p>
              <p className="text-xs text-[var(--muted)]">Nuevos este mes</p>
            </div>
          </div>
        </div>

        <HowItWorks steps={[
          "Escribí una novedad corta: una oferta nueva, un producto que llegó, un cambio de horario.",
          "Se la mandamos como notificación a todos tus seguidores dentro de la plataforma.",
          "Usalo con criterio -- es tu audiencia, no un lugar para spamear todos los días.",
        ]} />

        {plan.campanas ? (
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <p className="mb-3 font-black">Enviar novedad a tus seguidores</p>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Ej: Llegó stock nuevo de zapatillas talle 42 👟"
              className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            />
            <p className="mt-1 text-right text-[10px] text-[var(--muted2)]">{mensaje.length}/200</p>
            <button
              onClick={enviarNovedad}
              disabled={enviando || !mensaje.trim() || total === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 text-sm font-black disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {enviando ? "Enviando..." : total === 0 ? "Todavía no tenés seguidores" : `Enviar a ${Math.min(total, MAX_DESTINATARIOS)} seguidor${total === 1 ? "" : "es"}`}
            </button>
          </div>
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[.08] to-[var(--accent2)]/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Lock className="mx-auto mb-2 h-7 w-7 text-[var(--accent-ink)]" />
              <p className="font-black">Enviar novedades es una herramienta de Plan PRO</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Construí tu propia audiencia y avisale directo cuando tengas algo nuevo.</p>
              <Link href="/dashboard/planes" className="mt-4 inline-block rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-black hover:opacity-90">Ver planes →</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
