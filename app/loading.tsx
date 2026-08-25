export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0a0b]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent)] border-t-transparent"></div>
        <p className="text-xs font-black uppercase tracking-[0.35em] text-[#7d6f5c]" style={{ fontFamily: "var(--font-display)" }}>Cargando...</p>
      </div>
    </main>
  );
}
