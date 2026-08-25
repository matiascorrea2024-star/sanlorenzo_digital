"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { subscribeToPush } from "@/lib/push";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

// Quien ya completó el onboarding antes de que existiera este feature
// nunca vuelve a ver ese flujo -- sin este toggle en el perfil, no
// tenía forma de activar push nunca.
export default function PushNotificationsToggle({ userId, initial }: { userId: string; initial: boolean }) {
  const { show } = useToast();
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setOn(initial);
    setSupported(typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined");
  }, [initial]);

  const toggle = async () => {
    if (!supported) return;
    setSaving(true);
    if (!on) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setSaving(false);
        show("❌ No diste permiso de notificaciones -- podés activarlo desde la configuración del navegador.", "error");
        return;
      }
      const ok = await subscribeToPush(userId);
      if (!ok) {
        setSaving(false);
        show("❌ No se pudo activar. Probá de nuevo.", "error");
        return;
      }
    }
    const { error } = await supabase().from("user_profiles").update({ notifications_opt_in: !on }).eq("user_id", userId);
    setSaving(false);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo guardar el cambio.")}`, "error"); return; }
    setOn(!on);
  };

  if (!supported) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-4">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="font-bold text-[var(--text)]">Notificaciones push</p>
          <p className="text-xs text-[var(--muted)]">Avisos en el celu/PC de mensajes y ofertas de negocios que seguís, aunque no tengas la web abierta.</p>
        </div>
      </div>
      <button onClick={toggle} disabled={saving}
        role="switch" aria-checked={on}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[var(--accent)]" : "bg-[var(--ov-15)]"} disabled:opacity-50`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? "left-5" : "left-0.5"}`} />
      </button>
    </div>
  );
}
