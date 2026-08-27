"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { hoyArgentina } from "@/lib/fecha-ar";

function sumarDias(base: string, n: number): string {
  const d = new Date(base + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function generarSlots(desde: string, hasta: string, duracionMin: number): string[] {
  const [hD, mD] = desde.split(":").map(Number);
  const [hH, mH] = hasta.split(":").map(Number);
  const slots: string[] = [];
  let mins = hD * 60 + mD;
  const fin = hH * 60 + mH;
  while (mins + duracionMin <= fin) {
    slots.push(`${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`);
    mins += duracionMin;
  }
  return slots;
}

export default function BookingWidget({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { show } = useToast();
  const router = useRouter();
  const [config, setConfig] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fechaSel, setFechaSel] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<string[]>([]);
  const [reservando, setReservando] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState<{ fecha: string; hora: string } | null>(null);

  const hoy = hoyArgentina();
  const proximosDias = useMemo(() => {
    if (!config) return [];
    const out: string[] = [];
    for (let i = 0; i < 14 && out.length < 7; i++) {
      const f = sumarDias(hoy, i);
      const dow = new Date(f + "T00:00:00").getDay();
      if (config.dias_semana.includes(dow)) out.push(f);
    }
    return out;
  }, [config, hoy]);

  useEffect(() => {
    (async () => {
      const { data: cfg } = await supabase().from("booking_settings").select("*").eq("business_id", businessId).eq("active", true).maybeSingle();
      setConfig(cfg);
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);
      setLoading(false);
    })();
  }, [businessId]);

  useEffect(() => {
    if (!fechaSel) return;
    supabase().from("bookings").select("hora").eq("business_id", businessId).eq("fecha", fechaSel).eq("estado", "confirmado")
      .then(({ data }) => setOcupados((data || []).map((b: any) => b.hora.slice(0, 5))));
  }, [fechaSel, businessId]);

  const reservar = async (hora: string) => {
    if (!user) { router.push("/login"); return; }
    if (!fechaSel) return;
    setReservando(hora);
    const { error } = await supabase().from("bookings").insert({ business_id: businessId, user_id: user.id, fecha: fechaSel, hora });
    if (error) {
      if (error.code === "23505") {
        show("❌ Justo se ocupó ese horario, elegí otro.", "error");
        setOcupados((prev) => [...prev, hora]);
      } else {
        show("❌ No se pudo reservar, probá de nuevo.", "error");
      }
    } else {
      setConfirmado({ fecha: fechaSel, hora });
      show("✅ Turno reservado", "success");
    }
    setReservando(null);
  };

  if (loading || !config) return null;

  const slotsDelDia = fechaSel ? generarSlots(config.hora_desde.slice(0, 5), config.hora_hasta.slice(0, 5), config.duracion_min).filter((h) => !ocupados.includes(h)) : [];

  return (
    <div className="mb-6 rounded-[1.75rem] border border-[var(--place)]/20 bg-gradient-to-br from-[var(--place)]/[.06] to-[var(--place2)]/[.03] p-1.5">
      <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <h3 className="mb-4 flex items-center gap-2 font-black">
          <Calendar className="h-5 w-5 text-[var(--place)]" /> Reservá tu turno
        </h3>

        {confirmado ? (
          <div className="flex items-center gap-3 rounded-xl border border-green-400/30 bg-green-500/10 p-4">
            <Check className="h-6 w-6 shrink-0 text-[var(--ok)]" />
            <p className="text-sm text-[var(--ok)]">
              Turno confirmado para el {new Date(confirmado.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las {confirmado.hora}hs en {businessName}.
            </p>
          </div>
        ) : !user ? (
          <Link href="/login" className="block rounded-xl border border-[var(--line)] bg-[var(--ov-05)] px-4 py-2.5 text-center text-sm font-bold text-[var(--text)]/70 hover:bg-[var(--ov-10)]">
            Iniciá sesión para reservar
          </Link>
        ) : (
          <>
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {proximosDias.map((f) => {
                const d = new Date(f + "T00:00:00");
                const activo = fechaSel === f;
                return (
                  <button key={f} onClick={() => setFechaSel(f)}
                    className={`flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs font-bold transition ${activo ? "bg-gradient-to-r from-[var(--place)] to-[var(--place2)] text-white" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--text)]/70"}`}>
                    <span className="uppercase">{d.toLocaleDateString("es-AR", { weekday: "short" })}</span>
                    <span className="text-base">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>

            {fechaSel && (
              slotsDelDia.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No quedan horarios libres ese día -- probá otra fecha.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slotsDelDia.map((h) => (
                    <button key={h} onClick={() => reservar(h)} disabled={reservando === h}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--place)]/30 bg-[var(--place)]/10 px-3 py-1.5 text-xs font-bold text-[var(--place)] hover:bg-[var(--place)]/20 disabled:opacity-50">
                      <Clock className="h-3 w-3" /> {reservando === h ? "..." : h}
                    </button>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
