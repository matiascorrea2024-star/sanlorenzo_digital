"use client";
import Link from "next/link";

// Solo se renderiza para el caso "no logueado" (components/layout/header.tsx
// ya resuelve el menú completo del usuario logueado, con los grupos de
// Mi comercio/Mi actividad/Cuenta/Admin).
export default function AuthButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="px-3 py-2 text-sm font-bold text-[#a99b86] hover:text-[#f7f3ec]">Ingresar</Link>
      <Link
        href="/registro"
        className="hidden bg-[var(--accent)] px-4 py-2 text-sm font-bold text-white transition hover:bg-[var(--accent2)] sm:inline-block"
      >
        Crear cuenta
      </Link>
    </div>
  );
}
