import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0c0a0b] px-4 text-center text-[#f7f3ec]">
      <p className="magenta-glow font-display text-7xl leading-none tracking-tight text-[var(--accent)]">404</p>
      <h1 className="mt-4 font-display text-2xl uppercase tracking-tight sm:text-3xl">Esta página no existe</h1>
      <p className="mt-2 max-w-md text-sm text-[#a99b86]">
        Pero San Lorenzo está lleno de negocios, ofertas y vecinos para descubrir.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-hard rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>🏠 Ir al inicio</Link>
        <Link href="/buscar" className="rounded-xl border border-white/15 px-6 py-3 text-xs font-black uppercase tracking-widest text-[#a99b86] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>🔍 Buscar negocios</Link>
        <Link href="/promociones" className="rounded-xl border border-white/15 px-6 py-3 text-xs font-black uppercase tracking-widest text-[#a99b86] transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>🔥 Ver ofertas</Link>
      </div>
    </main>
  );
}
