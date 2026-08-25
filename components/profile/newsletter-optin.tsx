"use client";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function NewsletterOptIn({ userId, initial }: { userId: string; initial: boolean }) {
  const { show } = useToast();
  const [on, setOn] = useState(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setOn(initial); }, [initial]);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    const { error } = await supabase().from("user_profiles").update({ newsletter_opt_in: next }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      setOn(!next);
      show(`❌ ${friendlyError(error, "No se pudo guardar el cambio.")}`, "error");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-4">
      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 shrink-0 text-[var(--accent)]" />
        <div>
          <p className="font-bold text-[var(--text)]">Novedades por mail</p>
          <p className="text-xs text-[var(--muted)]">Un resumen semanal con las ofertas y negocios nuevos de tu zona. Podés desactivarlo cuando quieras.</p>
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
