"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      // /auth/callback ya canjeó el código por una sesión antes de
      // redirigir acá -- si no hay sesión, el link es viejo/inválido.
      const { data: { session } } = await supabase().auth.getSession();
      setReady(!!session);
    })();
  }, []);

  const submit = async () => {
    setError("");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    const { error: err } = await supabase().auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.push("/perfil"), 1500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.16), transparent 55%), radial-gradient(circle at 90% 100%, rgba(34,211,238,.1), transparent 55%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Restablecer contraseña</h1>
            <p className="mt-2 text-[var(--muted)]">Elegí una nueva contraseña para tu cuenta</p>
          </div>

          {!ready ? (
            <div className="text-center text-sm text-[var(--muted)]">
              <p>Este link ya expiró o no es válido.</p>
              <Link href="/login" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver a iniciar sesión</Link>
            </div>
          ) : done ? (
            <p className="text-center text-sm text-[var(--ok)]">✅ Contraseña actualizada. Redirigiendo…</p>
          ) : (
            <div className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-orange-400" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetir nueva contraseña"
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-orange-400" />
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                  <p className="text-sm text-[var(--bad)]">{error}</p>
                </div>
              )}
              <button onClick={submit} disabled={saving}
                className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 font-black text-[var(--text)] hover:opacity-90 disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
