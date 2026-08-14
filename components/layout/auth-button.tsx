"use client";
import Link from "next/link";

// Solo se renderiza para el caso "no logueado" (components/layout/header.tsx
// ya resuelve el menú completo del usuario logueado, con los grupos de
// Mi comercio/Mi actividad/Cuenta/Admin).
export default function AuthButton() {
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="rounded-xl px-3 py-2 text-sm font-bold text-white/80 hover:bg-white/10">Ingresar</Link>
      <Link href="/registro" className="rounded-xl bg-white px-4 py-2 text-sm font-black text-orange-600 hover:bg-orange-100">Crear cuenta</Link>
    </div>
  );
}
