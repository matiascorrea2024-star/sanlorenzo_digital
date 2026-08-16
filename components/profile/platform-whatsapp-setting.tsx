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
      <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
        <p className="mb-1 font-bold">⚙️ WhatsApp de contacto de la plataforma</p>
        <p className="mb-3 text-xs text-white/60">Solo vos lo ves. Se usa como número de contacto oficial (ej. consultas de Plan Premium). Formato: 549 + código de área + número, sin espacios.</p>
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="5493476341344"
            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-orange-400"
          />
          <button onClick={save} disabled={saving}
            className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black text-white hover:opacity-90 disabled:opacity-50">
            {saving ? "…" : saved ? "✅" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
