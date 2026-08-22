"use client";
import Link from "next/link";

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6 text-[var(--text)]">
      <div className="max-w-md text-center">
        <p className="mb-4 text-5xl">😵</p>
        <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Algo salió mal</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Ocurrió un error inesperado en esta página. Probá reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90">
            Reintentar
          </button>
          <Link href="/"
            className="rounded-xl border border-[var(--line-strong)] px-6 py-3 text-sm font-black hover:bg-[var(--ov-10)]">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
