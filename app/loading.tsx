export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0a0b]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
        <p className="text-sm font-bold text-white/60">Cargando...</p>
      </div>
    </main>
  );
}
