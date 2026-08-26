"use client";
// Challenge de 2FA para entrar al panel de administración: se muestra
// cuando la cuenta tiene factor TOTP verificado pero esta sesión aún
// no pasó el segundo paso (nivel AAL1 en vez de AAL2).
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MfaChallenge({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase().auth.mfa.listFactors();
      const activo = (data?.all || []).find((f) => f.status === "verified");
      if (e || !activo) {
        setError("No se encontró el factor de verificación. Entrá a tu perfil para revisarlo.");
        return;
      }
      setFactorId(activo.id);
    })();
  }, []);

  const entrar = async () => {
    if (!factorId || code.trim().length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { data: ch, error: e1 } = await supabase().auth.mfa.challenge({ factorId });
      if (e1) throw e1;
      const { error: e2 } = await supabase().auth.mfa.verify({ factorId, challengeId: ch.id, code: code.trim() });
      if (e2) throw e2;
      onSuccess();
    } catch {
      setError("Código incorrecto, probá de nuevo.");
    }
    setBusy(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 text-[var(--text)]">
      <div className="w-full max-w-sm rounded-[2.5rem] border border-[var(--line-strong)] bg-[var(--surface)] p-8 shadow-2xl">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent)]/15">
          <ShieldCheck className="h-7 w-7 text-[var(--accent)]" />
        </span>
        <h1 className="mt-5 text-center font-display text-3xl uppercase tracking-tight">Último paso</h1>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">
          Meté el código de 6 dígitos de tu app autenticadora para abrir el panel.
        </p>

        {error && <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-center text-sm font-bold text-[var(--bad)]">{error}</p>}

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="000000"
          aria-label="Código de verificación"
          className="mt-6 w-full rounded-2xl border border-[var(--line-strong)] bg-black/30 px-4 py-4 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={entrar}
          disabled={busy || code.length !== 6}
          className="btn-hard mt-4 w-full rounded-xl bg-[var(--accent)] py-3.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {busy ? "Verificando..." : "Entrar al panel"}
        </button>
        <Link href="/perfil#cuenta" className="mt-4 block text-center text-xs font-bold text-[var(--muted2)] transition hover:text-[var(--accent)]">
          Problemas con el código →
        </Link>
      </div>
    </main>
  );
}
