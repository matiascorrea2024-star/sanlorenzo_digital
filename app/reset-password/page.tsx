"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageHero from "@/components/ui/page-hero";
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
    <main className="bg-[#120d09] min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md">
          <PageHero title="🔑 Restablecer contraseña" subtitle="Elegí una nueva contraseña para tu cuenta" />

          {!ready ? (
            <div className="text-center text-sm text-white/60">
              <p>Este link ya expiró o no es válido.</p>
              <Link href="/login" className="mt-4 inline-block text-orange-400 hover:text-orange-300">← Volver a iniciar sesión</Link>
            </div>
          ) : done ? (
            <p className="text-center text-sm text-green-400">✅ Contraseña actualizada. Redirigiendo…</p>
          ) : (
            <div className="space-y-4">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 8 caracteres)"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400" />
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetir nueva contraseña"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-orange-400" />
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3">
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
              <button onClick={submit} disabled={saving}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 font-black text-white hover:opacity-90 disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
