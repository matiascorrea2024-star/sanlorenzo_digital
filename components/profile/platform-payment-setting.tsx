"use client";
import { useEffect, useState } from "react";
import { usePlatformSetting, setPlatformSetting } from "@/lib/hooks/use-platform-settings";

export default function PlatformPaymentSetting() {
  const value = usePlatformSetting("datos_pago");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(value || ""); }, [value]);

  const save = async () => {
    setSaving(true);
    const { error } = await setPlatformSetting("datos_pago", draft);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="rounded-[1.5rem] border border-emerald-400/25 bg-emerald-500/[.06] p-1.5">
      <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <p className="mb-1 font-bold text-[var(--text)]">💳 Datos para transferencias (alias / CBU / Mercado Pago)</p>
        <p className="mb-3 text-xs text-[var(--muted)]">
          Solo vos lo ves. Se muestra a los comercios cuando piden un plan pago, antes de subir el comprobante.
          Si lo dejás vacío, no se muestra ningún dato -- se les pide que te escriban por WhatsApp para coordinar.
        </p>
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ej: Alias: SANLORENZO.DIGITAL — Titular: Tu Nombre"
            rows={2}
            className="flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-emerald-400"
          />
          <button onClick={save} disabled={saving}
            className="self-start rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-black text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "…" : saved ? "✅" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
