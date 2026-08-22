"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signUpWithEmail } from "@/lib/auth-helpers";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendly-error";

export default function RegistroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "business_owner">(
    searchParams.get("role") === "business_owner" ? "business_owner" : "user"
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (name.trim().split(/\s+/).filter(Boolean).length < 2) {
      setError("Escribí nombre y apellido, así te distinguimos de otros vecinos con el mismo nombre.");
      return;
    }

    setLoading(true);

    try {
      const { user } = await signUpWithEmail(email, password, { name, role });
      if (user?.id) {
        await supabase().from("user_profiles").upsert({ user_id: user.id, display_name: name }, { onConflict: "user_id" });

        // Referido: si llegó con un link de invitación (?ref=...), se
        // guarda el vínculo real -- las recompensas se aplican solas
        // por trigger cuando este usuario complete el onboarding.
        try {
          const ref = localStorage.getItem("sld-ref");
          if (ref && ref !== user.id) {
            const response = await fetch("/api/referrals/attribute", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referrer_id: ref }),
            });
            if (response.ok) localStorage.removeItem("sld-ref");
          }
        } catch {}
      }
      setSuccess(true);
      setTimeout(() => router.push(role === "business_owner" ? "/dashboard/nuevo" : "/"), 1500);
    } catch (err: unknown) {
      setError(friendlyError(err, "No se pudo crear tu cuenta. Probá de nuevo."));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="sld-editorial-page min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-[1.75rem] border border-green-400/25 bg-green-500/[.06] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-black text-[var(--text)] mb-2">¡Cuenta creada!</h2>
              <p className="text-[var(--text)]/70 mb-6">Redirigiendo…</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sld-editorial-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.16), transparent 55%), radial-gradient(circle at 90% 100%, rgba(34,211,238,.1), transparent 55%)" }} />
      <div className="relative w-full max-w-md">
        <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl">🛍️</span>
            </Link>
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Tu próximo descubrimiento empieza acá</h1>
            <p className="mt-2 text-[var(--muted)]">Creá tu cuenta gratis y conectate con lo mejor de San Lorenzo.</p>
          </div>

      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text)]/80 mb-2">Nombre y apellido</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-orange-400"
                placeholder="Ej: Juan Pérez"
              />
              {/* Con nombres muy comunes (Matías, Juan, etc.) pedir nombre
                  Y apellido reduce mucho la chance de que dos vecinos se
                  vean idénticos en reseñas/ranking, sin bloquear a nadie
                  por algo que no es realmente un problema de seguridad
                  (los nombres de las personas se repiten en la vida real). */}
              <p className="mt-1.5 text-xs text-[var(--muted2)]">Así te distinguimos de otros vecinos con el mismo nombre.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)]/80 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-orange-400"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)]/80 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3 text-[var(--text)] outline-none focus:border-orange-400"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)]/80 mb-2">Soy...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`rounded-2xl border p-4 text-center transition ${
                    role === "user" ? "border-orange-400/70 bg-orange-500/10" : "border-[var(--line-strong)] bg-[var(--ov-05)]"
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-bold text-[var(--text)]">Usuario</div>
                  <div className="text-xs text-[var(--muted)]">Quiero ofertas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("business_owner")}
                  className={`rounded-2xl border p-4 text-center transition ${
                    role === "business_owner" ? "border-orange-400/70 bg-orange-500/10" : "border-[var(--line-strong)] bg-[var(--ov-05)]"
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="text-sm font-bold text-[var(--text)]">Comerciante</div>
                  <div className="text-xs text-[var(--muted)]">Tengo negocio</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-[var(--bad)]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3.5 font-black text-white shadow-lg shadow-orange-950/20 hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link href="/login" className="block text-sm text-orange-400 hover:text-orange-300">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
            <Link href="/" className="block text-sm text-[var(--muted)] hover:text-[var(--text)]/70">
              ← Volver al inicio
            </Link>
          </div>
        </div>
        </div>
      </div>
    </main>
  );
}
