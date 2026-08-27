"use client";
// Gate obligatorio para /admin: si la cuenta de administrador todavía no
// tiene un factor TOTP verificado, no entra al panel -- tiene que activar
// 2FA acá mismo primero. Antes esto era opcional ("2FA gradual", ver
// mfa-challenge.tsx); dado el historial de políticas RLS sensibles del
// proyecto, se decidió que un admin sin segundo factor ya no es un caso
// válido.
import { ShieldAlert } from "lucide-react";
import MfaSettings from "@/components/profile/mfa-settings";

export default function MfaEnrollRequired({ onSuccess }: { onSuccess: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-12 text-[var(--text)]">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--warn)]/15">
            <ShieldAlert className="h-7 w-7 text-[var(--warn)]" />
          </span>
          <h1 className="mt-5 font-display text-3xl uppercase tracking-tight">Verificación en dos pasos requerida</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--muted)]">
            Para entrar al panel de administración, tu cuenta necesita un segundo factor (app autenticadora) activo. Configuralo acá abajo -- te toma menos de un minuto.
          </p>
        </div>
        <MfaSettings onEnrolled={onSuccess} />
      </div>
    </main>
  );
}
