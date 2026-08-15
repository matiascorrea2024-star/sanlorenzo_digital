"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ChangePassword({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    setError("");
    if (next.length < 8) { setError("La nueva contraseña debe tener al menos 8 caracteres."); return; }
    if (next !== confirm) { setError("Las contraseñas nuevas no coinciden."); return; }
    setSaving(true);
    const sb = supabase();
    // Re-autentica con la contraseña actual para confirmarla antes de cambiarla.
    const { error: authErr } = await sb.auth.signInWithPassword({ email, password: current });
    if (authErr) {
      setError("La contraseña actual no es correcta.");
      setSaving(false);
      return;
    }
    const { error: updateErr } = await sb.auth.updateUser({ password: next });
    setSaving(false);
    if (updateErr) { setError(updateErr.message); return; }
    setDone(true);
    setCurrent(""); setNext(""); setConfirm("");
    setTimeout(() => { setDone(false); setOpen(false); }, 2500);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm font-bold hover:border-orange-400/50 hover:bg-white/10 transition">
        🔑 Cambiar contraseña
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="mb-3 font-bold">🔑 Cambiar contraseña</p>
      <div className="space-y-2">
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
          placeholder="Contraseña actual"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)}
          placeholder="Nueva contraseña (mín. 8 caracteres)"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repetir nueva contraseña"
          className="w-full rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {done && <p className="mt-2 text-xs text-green-400">✅ Contraseña actualizada.</p>}
      <div className="mt-3 flex gap-2">
        <button onClick={submit} disabled={saving || !current || !next || !confirm}
          className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-black disabled:opacity-50">
          {saving ? "Guardando…" : "Guardar"}
        </button>
        <button onClick={() => { setOpen(false); setError(""); }} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold">
          Cancelar
        </button>
      </div>
    </div>
  );
}
