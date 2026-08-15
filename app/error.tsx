"use client";

export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#120d09] p-6 text-white">
      <div className="max-w-md text-center">
        <p className="mb-4 text-5xl">😵</p>
        <h1 className="text-2xl font-black">Algo salió mal</h1>
        <p className="mt-2 text-sm text-white/60">
          Ocurrió un error inesperado en esta página. Probá reintentar o volver al inicio.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset}
            className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
            Reintentar
          </button>
          <a href="/"
            className="rounded-xl border border-white/20 px-6 py-3 text-sm font-black hover:bg-white/10">
            Ir al inicio
          </a>
        </div>
      </div>
    </main>
  );
}
