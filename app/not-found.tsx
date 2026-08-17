import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a0b] px-4 text-center text-white">
      <p className="text-7xl font-black text-orange-400">404</p>
      <h1 className="mt-4 text-2xl font-black">Esta página no existe</h1>
      <p className="mt-2 max-w-md text-sm text-white/60">
        Pero San Lorenzo está lleno de negocios, ofertas y vecinos para descubrir.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 text-sm font-black hover:opacity-90">🏠 Ir al inicio</Link>
        <Link href="/buscar" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/5">🔍 Buscar negocios</Link>
        <Link href="/promociones" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/5">🔥 Ver ofertas</Link>
      </div>
    </main>
  );
}
