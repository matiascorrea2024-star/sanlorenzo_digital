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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 text-[var(--text)]">
        <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
        <div className="relative w-full max-w-md rounded-[2.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center shadow-2xl">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-display text-2xl uppercase tracking-tight mb-2 sm:text-3xl">¡Cuenta creada!</h2>
          <p className="text-sm text-[var(--muted)]">Redirigiendo…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg)] px-4 py-8 text-[var(--text)]">
      <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[60%] w-[60%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
      <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-[2.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="mb-4 inline-block">
            <span className="text-3xl">🛍️</span>
          </Link>
          <h1 className="font-display text-4xl uppercase tracking-tight sm:text-5xl">Tu próximo descubrimiento empieza acá</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Creá tu cuenta gratis y conectate con lo mejor de San Lorenzo.</p>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Nombre y apellido</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-white placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]"
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
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3.5 text-white placeholder:text-[var(--muted2)] outline-none transition focus:border-[var(--accent)] focus:bg-[var(--ov-10)]"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>Soy...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`rounded-2xl border p-4 text-center transition ${
                    role === "user" ? "border-[var(--accent)]/70 bg-[var(--accent)]/10" : "border-[var(--line-strong)] bg-[var(--ov-05)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-bold text-white">Usuario</div>
                  <div className="text-xs text-[var(--muted2)]">Quiero ofertas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("business_owner")}
                  className={`rounded-2xl border p-4 text-center transition ${
                    role === "business_owner" ? "border-[var(--accent)]/70 bg-[var(--accent)]/10" : "border-[var(--line-strong)] bg-[var(--ov-05)] hover:border-[var(--line-strong)]"
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="text-sm font-bold text-white">Comerciante</div>
                  <div className="text-xs text-[var(--muted2)]">Tengo negocio</div>
                </button>
              </div>
            </div>

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
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <Link href="/login" className="block text-sm font-bold text-[var(--accent)] transition hover:text-white">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
            <Link href="/" className="block text-sm text-[var(--muted)] transition hover:text-[var(--accent)]">
              ← Volver al inicio
            </Link>
          </div>
      </div>
    </main>
  );
}
