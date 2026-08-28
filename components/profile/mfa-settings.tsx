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
      // Bug real (reportado en producción): un intento de alta anterior
      // que no se termina de verificar (usuario cierra la pantalla, se
      // equivoca de código y abandona, etc.) deja un factor "unverified"
      // dando vueltas. Supabase no deja crear un factor nuevo con el
      // mismo nombre ("A factor with the friendly name ... already
      // exists") -- como acá nunca se manda un nombre propio, todos
      // chocan contra el mismo "" y la cuenta queda trabada sin poder
      // reintentar. Se limpia cualquier factor sin verificar ANTES de
      // pedir uno nuevo -- un factor sin verificar no sirve para nada,
      // así que no hay downside en sacarlo.
      const { data: existentes } = await supabase().auth.mfa.listFactors();
      const sinVerificar = (existentes?.all || []).filter((f) => f.status === "unverified");
      for (const f of sinVerificar) {
        await supabase().auth.mfa.unenroll({ factorId: f.id });
      }
      // Si había un intento anterior sin terminar, es muy probable que
      // ya haya un QR viejo escaneado en la app autenticadora del
      // usuario (con un secret que ya no existe más acá). Si no se lo
      // avisamos, va a seguir viendo/usando ese código viejo y le va a
      // seguir dando "código inválido" con el QR nuevo de abajo.
      if (sinVerificar.length > 0) {
        show("Encontramos un intento de activación anterior sin terminar y lo descartamos. Si ya habías escaneado ese código QR en tu app, borralo ahí y escaneá el nuevo de abajo.", "info");
      }

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
      // Verificado de punta a punta con un código TOTP calculado
      // correctamente (RFC 6238) contra el secret real emitido acá: el
      // enroll → challenge → verify de Supabase funciona bien. Cuando
      // Supabase devuelve este error puntual, la causa casi siempre es
      // externa a la app -- no hay nada que "arreglar" en el código,
      // pero el mensaje en inglés de la API no ayuda a nadie a
      // resolverlo, así que se traduce con la guía real.
      const msg = err?.message || "";
      if (/invalid.*(totp|code)/i.test(msg)) {
        setError("Ese código no coincide. Las causas más comunes: (1) la hora de tu celular no está en automático/sincronizada con la red -- revisala en Ajustes; (2) ya habías escaneado un QR anterior de esta misma activación y estás mirando esa entrada vieja en tu app -- borrala y escaneá de nuevo el QR de arriba. Si nada de eso es el caso, esperá a que el código cambie (dura 30 segundos) y probá con el siguiente.");
      } else {
        setError(msg || "Código incorrecto, probá de nuevo.");
      }
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
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-xs leading-relaxed text-[var(--text)]">
            <strong>¿Al escanear ves un texto largo que empieza con &quot;otpauth://&quot; en vez de que se abra una app?</strong> Es porque escaneaste con la cámara normal del celular. Tenés que escanear desde <strong>adentro</strong> de la app autenticadora, no con la cámara del teléfono.
          </div>
          <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
            1. Abrí Google Authenticator o Authy en tu celular
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            ¿No tenés ninguna instalada? Bajá <strong>Google Authenticator</strong> gratis de Play Store o App Store. Después abrila, tocá el botón <strong>+</strong> y elegí <strong>&quot;Escanear código QR&quot;</strong> -- recién ahí apuntá al código de abajo.
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {qr && (
              <Image src={qr} alt="Código QR de configuración 2FA" width={160} height={160} unoptimized className="rounded-xl bg-white p-2" />
            )}
            <div className="w-full sm:w-auto">
              <p className="text-xs text-[var(--muted)]">¿Preferís no escanear? Dentro de la app elegí &quot;Ingresar clave manualmente&quot; y cargá esta clave:</p>
              <code className="mt-1 block break-all rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/5 px-3 py-2 font-mono text-xs text-[var(--accent-ink)]">{secret}</code>
            </div>
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]" style={{ fontFamily: "var(--font-display)" }}>
            2. Escribí acá el código de 6 dígitos que te muestra esa app
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
              onClick={async () => {
                // Limpiar el factor a medio crear en vez de dejarlo
                // colgado -- si no, el próximo "Activar 2FA" lo va a
                // tener que limpiar de todos modos.
                if (factorId) { await supabase().auth.mfa.unenroll({ factorId }); }
                setQr(null); setSecret(null); setFactorId(null); setCode(""); setError(null);
              }}
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
