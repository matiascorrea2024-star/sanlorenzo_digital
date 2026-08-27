"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendly-error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
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
      setChecking(false);
    })();
  }, []);

  const submit = async () => {
    setError("");
    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setSaving(true);
    const { error: err } = await supabase().auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(friendlyError(err, "No se pudo actualizar la contraseña. Probá de nuevo.")); return; }
    setDone(true);
    setTimeout(() => router.push("/perfil"), 1500);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 text-[var(--text)]">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-[2.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">Restablecer contraseña</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Elegí una nueva contraseña para tu cuenta</p>
        </div>

          {checking ? (
            <p className="text-center text-sm text-[var(--muted)]">Verificando el link…</p>
          ) : !ready ? (
            <div className="text-center text-sm text-[var(--muted)]">
              <p>Este link ya expiró o no es válido.</p>
              <Link href="/login" className="mt-4 inline-block font-bold text-[var(--accent)] transition hover:text-white">← Volver a iniciar sesión</Link>
            </div>
          ) : done ? (
            <p className="text-center text-sm text-[var(--ok)]">✅ Contraseña actualizada. Redirigiendo…</p>
          ) : (
            <div className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-[var(--text)] placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetir nueva contraseña"
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-[var(--text)] placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]" />
              {error && (
                <div className="rounded-2xl border border-[var(--bad)]/30 bg-[var(--bad)]/10 p-3">
                  <p className="text-sm text-[var(--bad)]">{error}</p>
                </div>
              )}
              <button onClick={submit} disabled={saving}
                className="btn-hard w-full rounded-xl bg-[var(--accent)] py-4 text-xs font-black uppercase tracking-widest text-white"
                style={{ fontFamily: "var(--font-display)" }}>
                {saving ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </div>
          )}
      </div>
    </main>
  );
}
