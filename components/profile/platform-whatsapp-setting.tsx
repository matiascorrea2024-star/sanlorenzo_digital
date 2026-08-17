"use client";
import { useEffect, useState } from "react";
import { usePlatformSetting, setPlatformSetting } from "@/lib/hooks/use-platform-settings";

export default function PlatformWhatsappSetting() {
  const value = usePlatformSetting("whatsapp_contacto");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setDraft(value || ""); }, [value]);

  const save = async () => {
    setSaving(true);
    const { error } = await setPlatformSetting("whatsapp_contacto", draft.replace(/\D/g, ""));
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  };

  return (
    <div className="rounded-[1.5rem] border border-orange-400/25 bg-orange-500/[.06] p-1.5">
      <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <p className="mb-1 font-bold text-[var(--text)]">⚙️ WhatsApp de contacto de la plataforma</p>
        <p className="mb-3 text-xs text-[var(--muted)]">Solo vos lo ves. Se usa como número de contacto oficial (ej. consultas de Plan Premium). Formato: 549 + código de área + número, sin espacios.</p>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="5493476341344"
            className="flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2.5 text-sm text-[var(--text)] outline-none focus:border-orange-400"
          />
          <button onClick={save} disabled={saving}
            className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "…" : saved ? "✅" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
