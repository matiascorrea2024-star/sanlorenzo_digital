"use client";
// Configuración de 2FA (TOTP) para la cuenta -- se muestra en
// /perfil#cuenta. Flujo Supabase MFA: enroll (QR + secret) → challenge
// → verify. El panel /admin exige AAL2 SOLO si ya hay factor cargado
// (activación gradual: nadie queda afuera de su propio panel).
import { useEffect, useState } from "react";
import Image from "next/image";
import { ShieldCheck, ShieldAlert, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";

type Factor = { id: string; friendly_name?: string | null; status: string };

export default function MfaSettings({ onEnrolled }: { onEnrolled?: () => void } = {}) {
  const { show } = useToast();
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      const { data, error: e } = await supabase().auth.mfa.listFactors();
      if (e) throw e;
      setFactors((data?.all as Factor[]) || []);
    } catch {
      setFactors([]);
    }
  };

  useEffect(() => { cargar(); }, []);

  const empezar = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data, error: e } = await supabase().auth.mfa.enroll({ factorType: "totp" });
      if (e) throw e;
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar la configuración.");
    }
    setBusy(false);
  };

  const verificar = async () => {
    if (!factorId || code.trim().length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      const { data: ch, error: e1 } = await supabase().auth.mfa.challenge({ factorId });
      if (e1) throw e1;
      const { error: e2 } = await supabase().auth.mfa.verify({
        factorId, challengeId: ch.id, code: code.trim(),
      });
      if (e2) throw e2;
      show("2FA activado. Tu cuenta está blindada.", "success");
      setQr(null); setSecret(null); setFactorId(null); setCode("");
      cargar();
      // Verificar el factor durante el enrolamiento ya eleva la sesión a
      // AAL2 (mismo challenge que usa el login) -- si alguien nos pasó un
      // callback (ej. el gate de /admin) puede seguir sin pedir un
      // segundo código aparte.
      onEnrolled?.();
    } catch (err: any) {
      setError(err?.message || "Código incorrecto, probá de nuevo.");
    }
    setBusy(false);
  };

  const sacar = async (id: string) => {
    if (!confirm("¿Desactivar la verificación en dos pasos?")) return;
    setBusy(true);
    try {
      const { error: e } = await supabase().auth.mfa.unenroll({ factorId: id });
      if (e) throw e;
      show("2FA desactivado.", "info");
      cargar();
    } catch (err: any) {
      setError(err?.message || "No se pudo desactivar.");
    }
    setBusy(false);
  };

  const activos = (factors || []).filter((f) => f.status === "verified");

  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${activos.length > 0 ? "bg-[var(--ok)]/15" : "bg-[var(--warn)]/15"}`}>
            {activos.length > 0
              ? <ShieldCheck className="h-5 w-5 text-[var(--ok)]" />
              : <ShieldAlert className="h-5 w-5 text-[var(--warn)]" />}
          </span>
          <div>
            <h3 className="font-display text-xl uppercase tracking-wide text-[var(--text)]">Verificación en dos pasos</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              {activos.length > 0
                ? "Tu cuenta pide un código de tu app autenticadora además de la clave."
                : "Sumá una capa extra: además de tu clave, un código de 6 dígitos de tu celular."}
            </p>
          </div>
        </div>
        {activos.length > 0 && (
          <span className="shrink-0 rounded-xl bg-[var(--ok)]/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--ok)]" style={{ fontFamily: "var(--font-display)" }}>
            Activa
          </span>
        )}
      </div>

      {error && <p className="mt-4 rounded-xl border border-[var(--bad)]/30 bg-[var(--bad)]/10 px-4 py-2.5 text-sm font-bold text-[var(--bad)]">{error}</p>}

      {/* Paso 1: QR */}
      {qr && factorId && (
        <div className="mt-5 rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
            1. Escaneá con Google Authenticator, Authy o la app de tu banco
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qr && (
              <Image src={qr} alt="Código QR de configuración 2FA" width={160} height={160} unoptimized className="rounded-xl bg-white p-2" />
            )}
            <div className="w-full sm:w-auto">
              <p className="text-xs text-[var(--muted)]">O cargá esta clave a mano:</p>
              <code className="mt-1 block break-all rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-2 font-mono text-xs text-[var(--accent)]">{secret}</code>
            </div>
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
            2. Meté el código de 6 dígitos
          </p>
          <div className="mt-2 flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className="w-32 rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <button
              onClick={verificar}
              disabled={busy || code.length !== 6}
              className="btn-hard rounded-xl bg-[var(--accent)] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white disabled:opacity-50"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Confirmar
            </button>
            <button
              onClick={() => { setQr(null); setSecret(null); setFactorId(null); setCode(""); setError(null); }}
              className="rounded-xl border border-[var(--line-strong)] px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-[var(--muted)] hover:border-white/40"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Factores activos */}
      {!qr && activos.length > 0 && (
        <ul className="mt-5 space-y-2">
          {activos.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card-inner)] px-4 py-3">
              <span className="text-sm font-bold text-[var(--text)]">{f.friendly_name || "App autenticadora"}</span>
              <button onClick={() => sacar(f.id)} disabled={busy}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--bad)]/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--bad)] transition hover:bg-[var(--bad)]/10 disabled:opacity-50"
                style={{ fontFamily: "var(--font-display)" }}>
                <Trash2 className="h-3.5 w-3.5" /> Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      {!qr && activos.length === 0 && (
        <button
          onClick={empezar}
          disabled={busy || factors === null}
          className="btn-hard mt-5 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {busy ? "Preparando..." : "Activar 2FA"}
        </button>
      )}
    </div>
  );
}
