"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmail, resetPassword } from "@/lib/auth-helpers";
import { friendlyError } from "@/lib/friendly-error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgot = async () => {
    if (!email) { setError("Ingresá tu email arriba primero."); return; }
    setError("");
    setForgotLoading(true);
    try {
      await resetPassword(email);
      setForgotSent(true);
    } catch (err: unknown) {
      setError(friendlyError(err, "No se pudo enviar el link de recuperación."));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect || "/dashboard");
    } catch (err: unknown) {
      setError(friendlyError(err, "No se pudo iniciar sesión. Revisá tu email y contraseña."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 text-[var(--text)]">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-[2.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-4 inline-block">
            <span className="text-3xl">🛍️</span>
          </Link>
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">Iniciar sesión</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Entrá a tu cuenta de San Lorenzo Digital</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-white placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Contraseña</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(""); }} className="text-xs font-bold text-[var(--accent)] transition hover:text-white">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-white placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]"
                placeholder="••••••••"
              />
            </div>

            {forgotMode && (
              <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4">
                {forgotSent ? (
                  <p className="text-sm text-[var(--accent)]">✅ Si ese email tiene una cuenta, te mandamos un link para restablecer la contraseña.</p>
                ) : (
                  <>
                    <p className="mb-3 text-sm text-[var(--muted)]">Te mandamos un link a tu email para elegir una nueva contraseña.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleForgot} disabled={forgotLoading}
                        className="btn-hard rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
                        {forgotLoading ? "Enviando…" : "Enviar link"}
                      </button>
                      <button type="button" onClick={() => setForgotMode(false)} className="rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-xs font-bold text-[var(--muted)] transition hover:text-white">
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-sm text-[var(--bad)]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-hard w-full rounded-xl bg-[var(--accent)] py-4 text-xs font-black uppercase tracking-widest text-white"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link href="/registro" className="block text-sm font-bold text-[var(--accent)] transition hover:text-white">
              ¿No tenés cuenta? Registrate
            </Link>
            <Link href="/" className="block text-sm text-[var(--muted)] transition hover:text-[var(--accent)]">
              ← Volver al inicio
            </Link>
          </div>
      </div>
    </main>
  );
}
