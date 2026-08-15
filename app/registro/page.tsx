"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
import { signUpWithEmail } from "@/lib/auth-helpers";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/friendly-error";

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "business_owner">("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
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
            await supabase().from("referrals").insert({ referrer_id: ref, referred_id: user.id });
            localStorage.removeItem("sld-ref");
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
      <main className="bg-[#120d09] min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-green-500/30 bg-green-500/10 p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-black text-white mb-2">¡Cuenta creada!</h2>
            <p className="text-white/70 mb-6">Redirigiendo…</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#120d09] min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <span className="text-3xl">🛍️</span>
            </Link>
            
            <p className="text-white/60 mt-2">Unite a San Lorenzo Digital</p>
          </div>

          <PageHero title="✨ Crear cuenta" subtitle="Sumate a la comunidad de San Lorenzo Digital" />
      <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">¿Cómo te llamas?</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="Tu nombre"
              />
            </div>

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
              <label className="block text-sm font-semibold text-white/80 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">Soy...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("user")}
                  className={`rounded-xl border-2 p-4 text-center transition ${
                    role === "user" ? "border-orange-400 bg-orange-500/10" : "border-white/15 bg-white/5"
                  }`}
                >
                  <div className="text-2xl mb-1">👤</div>
                  <div className="text-sm font-bold text-white">Usuario</div>
                  <div className="text-xs text-white/60">Quiero ofertas</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("business_owner")}
                  className={`rounded-xl border-2 p-4 text-center transition ${
                    role === "business_owner" ? "border-orange-400 bg-orange-500/10" : "border-white/15 bg-white/5"
                  }`}
                >
                  <div className="text-2xl mb-1">🏪</div>
                  <div className="text-sm font-bold text-white">Comerciante</div>
                  <div className="text-xs text-white/60">Tengo negocio</div>
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-600 py-3 font-black text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link href="/login" className="block text-sm text-orange-400 hover:text-orange-300">
              ¿Ya tenés cuenta? Iniciá sesión
            </Link>
            <Link href="/" className="block text-sm text-white/50 hover:text-white/70">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
