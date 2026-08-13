"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
export default function Login() {
  const [mode, setMode] = useState<"login" | "registro">("registro");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");
  async function go(e: React.FormEvent) {
    e.preventDefault(); setMsg("");
    if (mode === "registro") {
      const { error } = await supabase().auth.signUp({ email, password: pass });
      setMsg(error ? "❌ " + error.message : "✅ Cuenta creada. Iniciá sesión.");
      if (!error) setMode("login");
    } else {
      const { error } = await supabase().auth.signInWithPassword({ email, password: pass });
      if (error) setMsg("❌ " + error.message);
      else window.location.href = "/dashboard";
    }
  }
  return (
    <main className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>
        {mode === "registro" ? "Creá tu cuenta" : "Ingresá"}
      </h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Para dueños de negocios de San Lorenzo.</p>
      <form onSubmit={go} className="mt-8 grid gap-3">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com"
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
        <input type="password" required minLength={6} value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Contraseña (mínimo 6)"
          className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]" />
        <button className="rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
          {mode === "registro" ? "Crear cuenta" : "Ingresar"}
        </button>
      </form>
      {msg && <p className="mt-4 text-sm text-[var(--muted)]">{msg}</p>}
      <button onClick={() => setMode(mode === "login" ? "registro" : "login")} className="mt-4 text-sm text-[var(--accent2)] hover:underline">
        {mode === "login" ? "¿No tenés cuenta? Creá una" : "¿Ya tenés cuenta? Ingresá"}
      </button>
    </main>
  );
}
