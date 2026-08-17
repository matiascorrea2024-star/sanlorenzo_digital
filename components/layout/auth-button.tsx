"use client";
import Link from "next/link";

// Solo se renderiza para el caso "no logueado" (components/layout/header.tsx
// ya resuelve el menú completo del usuario logueado, con los grupos de
// Mi comercio/Mi actividad/Cuenta/Admin).
export default function AuthButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-[var(--text)]/80 hover:bg-[var(--ov-10)]">Ingresar</Link>
      <Link
        href="/registro"
        className="hidden rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 sm:inline-block"
      >
        Crear cuenta
      </Link>
    </div>
  );
}
