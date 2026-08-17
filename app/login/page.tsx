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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0a0b] px-4">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.16), transparent 55%), radial-gradient(circle at 90% 100%, rgba(34,211,238,.1), transparent 55%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
        <div className="rounded-[1.375rem] border border-white/[.05] bg-black/20 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl">🛍️</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Iniciar sesión</h1>
            <p className="mt-2 text-white/60">Entrá a tu cuenta de San Lorenzo Digital</p>
          </div>

      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-semibold text-white/80">Contraseña</label>
                <button type="button" onClick={() => { setForgotMode(true); setError(""); }} className="text-xs font-semibold text-orange-400 hover:text-orange-300">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="••••••••"
              />
            </div>

            {forgotMode && (
              <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-4">
                {forgotSent ? (
                  <p className="text-sm text-orange-200">✅ Si ese email tiene una cuenta, te mandamos un link para restablecer la contraseña.</p>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-white/80">Te mandamos un link a tu email para elegir una nueva contraseña.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={handleForgot} disabled={forgotLoading}
                        className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-black text-white hover:opacity-90 disabled:opacity-50">
                        {forgotLoading ? "Enviando…" : "Enviar link"}
                      </button>
                      <button type="button" onClick={() => setForgotMode(false)} className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-white/70">
                        Cancelar
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link href="/registro" className="block text-sm text-orange-400 hover:text-orange-300">
              ¿No tenés cuenta? Registrate
            </Link>
            <Link href="/" className="block text-sm text-white/50 hover:text-white/70">
              ← Volver al inicio
            </Link>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
