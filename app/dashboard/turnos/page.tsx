"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Calendar, Save, X, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";
import { hoyArgentina } from "@/lib/fecha-ar";

const DIAS = [
  { v: 0, l: "Dom" }, { v: 1, l: "Lun" }, { v: 2, l: "Mar" }, { v: 3, l: "Mié" },
  { v: 4, l: "Jue" }, { v: 5, l: "Vie" }, { v: 6, l: "Sáb" },
];

export default function TurnosPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
  const [horaDesde, setHoraDesde] = useState("09:00");
  const [horaHasta, setHoraHasta] = useState("18:00");
  const [duracion, setDuracion] = useState("30");
  const [active, setActive] = useState(true);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarTurnos = async (businessId: string) => {
    const { data: reservas } = await supabase().from("bookings")
      .select("*").eq("business_id", businessId).eq("estado", "confirmado")
      .gte("fecha", hoyArgentina()).order("fecha").order("hora");
    if (!reservas || reservas.length === 0) { setTurnos([]); return; }
    const userIds = Array.from(new Set(reservas.map((r: any) => r.user_id)));
    const { data: perfiles } = await supabase().from("user_profiles").select("user_id, display_name").in("user_id", userIds);
    const nombres = Object.fromEntries((perfiles || []).map((p: any) => [p.user_id, p.display_name]));
    setTurnos(reservas.map((r: any) => ({ ...r, nombre: nombres[r.user_id] || "Vecino" })));
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses").select("id, name").eq("owner_id", user.id).maybeSingle();
      if (biz) {
        setNegocio(biz);
        const { data: cfg } = await supabase().from("booking_settings").select("*").eq("business_id", biz.id).maybeSingle();
        if (cfg) {
          setConfig(cfg);
          setDiasSemana(cfg.dias_semana);
          setHoraDesde(cfg.hora_desde?.slice(0, 5) || "09:00");
          setHoraHasta(cfg.hora_hasta?.slice(0, 5) || "18:00");
          setDuracion(String(cfg.duracion_min));
          setActive(cfg.active);
        }
        await cargarTurnos(biz.id);
      }
      setLoading(false);
    })();
  }, [user]);

  const toggleDia = (v: number) => {
    setDiasSemana((prev) => prev.includes(v) ? prev.filter((d) => d !== v) : [...prev, v].sort());
  };

  const guardar = async () => {
    if (!negocio || diasSemana.length === 0) return;
    setGuardando(true);
    const { data, error } = await supabase().from("booking_settings")
      .upsert({
        business_id: negocio.id, dias_semana: diasSemana, hora_desde: horaDesde,
        hora_hasta: horaHasta, duracion_min: Number(duracion), active,
      }, { onConflict: "business_id" })
      .select().single();
    if (data && !error) {
      setConfig(data);
      show("✅ Horario de turnos guardado", "success");
    } else {
      show(`❌ ${friendlyError(error, "No se pudo guardar.")}`, "error");
    }
    setGuardando(false);
  };

  const cancelar = async (id: string) => {
    const { error } = await supabase().from("bookings").update({ estado: "cancelado" }).eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo cancelar.")}`, "error"); return; }
    setTurnos((prev) => prev.filter((t) => t.id !== id));
    show("Turno cancelado", "info");
  };

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-24 text-center text-white/50">Cargando...</main>;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <DashboardNav />
      <h1 className="mb-1 flex items-center gap-2 text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>
        <Calendar className="h-6 w-6 text-orange-400" /> Turnos
      </h1>
      <p className="mb-8 text-sm text-white/50">
        Definí tu horario de atención y los vecinos reservan directo desde tu ficha, sin ida y vuelta por WhatsApp.
      </p>

      {!negocio ? (
        <p className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white/60">Primero necesitás tener un negocio creado.</p>
      ) : (
        <div className="space-y-8">
          <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <h2 className="mb-4 font-black">Horario de atención</h2>

              <p className="mb-1.5 text-xs font-bold text-white/60">Días</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {DIAS.map((d) => (
                  <button key={d.v} onClick={() => toggleDia(d.v)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${diasSemana.includes(d.v) ? "bg-gradient-to-r from-orange-500 to-red-600" : "border border-white/15 bg-white/5 text-white/60"}`}>
                    {d.l}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/60">Desde</label>
                  <input type="time" value={horaDesde} onChange={(e) => setHoraDesde(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/60">Hasta</label>
                  <input type="time" value={horaHasta} onChange={(e) => setHoraHasta(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none focus:border-orange-400" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white/60">Duración del turno (min)</label>
                  <select value={duracion} onChange={(e) => setDuracion(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 outline-none focus:border-orange-400">
                    {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
                  </select>
                </div>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
                Reservas activas (visible en mi ficha)
              </label>

              <button onClick={guardar} disabled={guardando || diasSemana.length === 0}
                className="mt-5 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">
                <Save className="h-4 w-4" /> {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {config && (
            <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <h2 className="mb-4 flex items-center gap-2 font-black">
                  <Clock className="h-5 w-5 text-sky-400" /> Próximos turnos ({turnos.length})
                </h2>
                {turnos.length === 0 ? (
                  <p className="text-sm text-white/50">Todavía no tenés turnos reservados.</p>
                ) : (
                  <div className="space-y-2">
                    {turnos.map((t) => (
                      <div key={t.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <div>
                          <p className="text-sm font-bold">{t.nombre}</p>
                          <p className="text-xs text-white/50">{new Date(t.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })} · {t.hora.slice(0, 5)}hs</p>
                        </div>
                        <button onClick={() => cancelar(t.id)} aria-label="Cancelar turno"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
