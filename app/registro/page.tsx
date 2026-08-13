"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Registro() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    
    if (pass !== pass2) {
      setMsg({ type: "err", text: "❌ Las contraseñas no coinciden" });
      return;
    }
    if (pass.length < 6) {
      setMsg({ type: "err", text: "❌ La contraseña debe tener al menos 6 caracteres" });
      return;
    }

    setLoading(true);
    const { error } = await supabase().auth.signUp({
      email,
      password: pass,
      options: { data: { nombre } }
    });
    setLoading(false);
    
    if (error) {
      setMsg({ type: "err", text: "❌ " + (error.message.includes("already") ? "Este email ya está registrado" : error.message) });
    } else {
      setMsg({ type: "ok", text: "✅ ¡Cuenta creada! Te enviamos un email para confirmar. Iniciá sesión." });
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0a12] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <span className="text-3xl">🛍️</span>
          <div>
            <h1 className="text-lg font-black text-white leading-tight group-hover:scale-105 transition-transform">
              LA GRAN <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">BARATA</span>
            </h1>
            <p className="text-[10px] text-orange-200/70 uppercase tracking-widest">DIGITAL</p>
          </div>
        </Link>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8">
          <h2 className="text-3xl font-black text-white">Creá tu cuenta</h2>
          <p className="mt-1 text-sm text-white/60">Empezá a vender en San Lorenzo hoy.</p>

          <form onSubmit={go} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Tu nombre</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-orange-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-orange-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-orange-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">Repetir contraseña</label>
              <input
                type="password"
                required
                minLength={6}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
                placeholder="Repetí la contraseña"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-orange-400 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3.5 font-black text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta →"}
            </button>
          </form>

          {msg && (
            <p className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              msg.type === "ok" ? "bg-green-500/15 text-green-300 border border-green-400/30" : "bg-red-500/15 text-red-300 border border-red-400/30"
            }`}>
              {msg.text}
            </p>
          )}

          <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm">
            <p className="text-white/60">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="font-bold text-orange-400 hover:text-orange-300">
                Ingresá
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Al registrarte aceptás nuestros términos y política de privacidad.
        </p>
      </div>
    </main>
  );
}
