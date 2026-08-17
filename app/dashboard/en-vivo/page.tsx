"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, Plus, Lock, Calendar, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import HowItWorks from "@/components/ui/how-it-works";
import InfoTip from "@/components/ui/info-tip";
import { planDe, puedeCrearVivo } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";

const ESTADO_LABEL: Record<string, { t: string; c: string }> = {
  scheduled: { t: "Programado", c: "border-sky-400/30 bg-sky-500/10 text-sky-300" },
  live: { t: "🔴 En vivo", c: "border-red-400/40 bg-red-500/15 text-red-300" },
  ended: { t: "Finalizado", c: "border-white/15 bg-white/5 text-white/50" },
  cancelled: { t: "Cancelado", c: "border-white/10 bg-white/5 text-white/30" },
};

export default function EnVivoDashboard() {
  const { user } = useAuth();
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "", scheduled_at: "" });

  const cargar = async (bizId: string) => {
    const { data } = await supabase().from("live_streams").select("*").eq("business_id", bizId).order("created_at", { ascending: false });
    setStreams(data || []);
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
      setNegocio(biz);
      if (biz) await cargar(biz.id);
      setLoading(false);
    })();
  }, [user]);

  const plan = planDe(negocio);
  const esteMes = new Date(); esteMes.setDate(1); esteMes.setHours(0, 0, 0, 0);
  const vivosEsteMes = streams.filter((s) => new Date(s.created_at) >= esteMes && s.status !== "cancelled").length;
  const puedeCrear = puedeCrearVivo(negocio?.plan, vivosEsteMes);

  const crear = async () => {
    if (!negocio || !form.title.trim() || !puedeCrear) return;
    setCreando(true);
    try {
      const { data, error } = await supabase().from("live_streams").insert({
        business_id: negocio.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category || negocio.category,
        scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
        status: "scheduled",
      }).select().single();
      if (error) throw error;
      show("📅 Transmisión creada", "success");
      window.location.href = `/dashboard/en-vivo/${data.id}`;
    } catch {
      show("❌ No se pudo crear. Probá de nuevo.", "error");
      setCreando(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Cargando...</main>;

  if (!negocio) {
    return (
      <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
        <div className="mx-auto max-w-2xl px-4 py-8">
          <DashboardNav />
          <p className="text-white/50">Necesitás un negocio para transmitir en vivo.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-8 flex items-start gap-3">
          <Radio className="mt-1 h-8 w-8 shrink-0 text-red-400" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Video en vivo</p>
            <h1 className="mt-2 flex items-center gap-1.5 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>
              En vivo
              <InfoTip label="Sobre el video en vivo">
                El video se transmite con infraestructura externa gratuita (LiveKit Cloud), compartida entre todos los negocios de la plataforma. Mientras no se supere el uso gratuito, no tiene costo para vos. Si alguna vez se llegara a un límite, vas a ver un aviso claro acá antes de poder iniciar un nuevo vivo -- nunca se te va a cobrar nada de forma automática.
              </InfoTip>
            </h1>
            <p className="mt-3 text-white/50">Transmití en vivo desde {negocio.name} y mostrá tus productos en tiempo real.</p>
          </div>
        </div>

        <HowItWorks steps={[
          "Creá una transmisión con título y, si querés, programala para más tarde.",
          "Cuando arranques, tocá \"Empezar\" -- te va a pedir permiso de cámara y micrófono.",
          "La gente te ve, te escribe por el chat y puede reservar lo que mostrás, todo en la misma pantalla.",
        ]} />

        <div className="mb-4 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="flex items-center justify-between rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            <p className="text-sm text-white/60">
              {plan.maxVivosPorMes === -1 ? "Vivos ilimitados con tu plan" : `${vivosEsteMes}/${plan.maxVivosPorMes} vivos este mes (Plan ${plan.name})`}
            </p>
            {puedeCrear ? (
              <button onClick={() => setCreando((v) => !v)} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-black">
                <Plus className="h-4 w-4" /> Crear En Vivo
              </button>
            ) : (
              <Link href="/dashboard/planes" className="flex items-center gap-1.5 rounded-full border border-orange-400/40 px-4 py-2 text-sm font-bold text-orange-300">
                <Lock className="h-4 w-4" /> Mejorar plan
              </Link>
            )}
          </div>
        </div>

        {creando && (
          <div className="mb-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="space-y-3 rounded-[1.375rem] border border-white/[.05] bg-black/10 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Título (ej: Liquidación de invierno 🔥)" className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              placeholder="Descripción (opcional)" className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            <div>
              <label className="mb-1 block text-xs font-bold text-white/50">Programar para más tarde (opcional -- si lo dejás vacío, lo podés empezar cuando quieras)</label>
              <input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            <button onClick={crear} disabled={!form.title.trim()} className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 text-sm font-black disabled:opacity-50">
              Crear
            </button>
          </div>
          </div>
        )}

        <div className="space-y-2.5">
          {streams.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-8 text-center text-white/50">Todavía no creaste ninguna transmisión.</div>
            </div>
          ) : streams.map((s) => (
            <Link key={s.id} href={`/dashboard/en-vivo/${s.id}`} className="group block rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] transition-colors group-hover:border-orange-400/30">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.title}</p>
                  <p className="flex items-center gap-2 text-xs text-white/40">
                    {s.scheduled_at && <><Calendar className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</>}
                    {s.status === "ended" && <><Clock className="h-3 w-3" /> {s.total_viewers} espectadores en total</>}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black ${ESTADO_LABEL[s.status]?.c}`}>{ESTADO_LABEL[s.status]?.t}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
