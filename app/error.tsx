"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6 text-[var(--text)]">
      <div className="max-w-md text-center">
        <p className="mb-4 text-5xl">😵</p>
        <h1 className="magenta-glow font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-7xl">Algo salió mal</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Ocurrió un error inesperado en esta página. Probá reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset}
            className="btn-hard rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}>
            Reintentar
          </button>
          <Link href="/"
            className="rounded-xl border border-[var(--line-strong)] px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:border-[var(--accent)] hover:text-white"
            style={{ fontFamily: "var(--font-display)" }}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
