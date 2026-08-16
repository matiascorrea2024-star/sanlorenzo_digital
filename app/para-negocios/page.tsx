import { createClient } from "@/lib/supabase-server";
import CategoryCover from "@/components/ui/category-cover";

export default async function Page() {
  const sb = await createClient();
  const { data: setting } = await sb.from("platform_settings").select("value").eq("key", "whatsapp_contacto").maybeSingle();
  const whatsapp = setting?.value || null;
  const wa = whatsapp ? "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent("Hola! Quiero sumar mi negocio a San Lorenzo Digital") : null;

  const { data: ejemplos } = await sb.from("businesses")
    .select("slug, name, category")
    .eq("status", "verificado").order("updated_at", { ascending: false }).limit(2);

  const BENEFICIOS: { i: string; t: string; d: string; grad: string }[] = [
    { i: "🏪", t: "Miniweb propia", d: "Tu local digital con color, logo, dirección y horarios. URL única.", grad: "from-orange-500 to-amber-400" },
    { i: "📸", t: "Productos con fotos", d: "Cargás desde el celu. Se publica al instante.", grad: "from-pink-500 to-rose-400" },
    { i: "🔥", t: "Promociones inteligentes", d: "Con vencimiento: solas se apagan cuando terminan.", grad: "from-red-500 to-orange-400" },
    { i: "💬", t: "WhatsApp directo", d: "Cada visita a un toque de escribirte.", grad: "from-emerald-500 to-teal-400" },
    { i: "🔒", t: "Tu negocio, solo tuyo", d: "Protección de cuenta y datos.", grad: "from-sky-500 to-cyan-400" },
    { i: "✅", t: "Sello verificado", d: "Cuando te verificamos, ganás confianza.", grad: "from-amber-500 to-pink-500" },
  ];

  return (
    <main className="bg-[#120d09] text-white">
      {/* Hero editorial -- página de venta, no un listado más */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.22), transparent 55%), radial-gradient(circle at 90% 30%, rgba(34,211,238,.12), transparent 55%)" }} />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.2em] text-orange-300">
            Para comercios de San Lorenzo
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[0.95] tracking-tighter md:text-7xl" style={{ fontFamily: "var(--font-space)" }}>
            Tu negocio, en el{" "}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">mapa digital</span>{" "}
            de la ciudad.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">Miniweb propia, productos con fotos, promociones que se renuevan solas y contacto directo por WhatsApp. Sin saber programar.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="/dashboard/nuevo" className="group/cta flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 py-3 pl-6 pr-2 text-sm font-black text-white transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-95 active:scale-[0.98]">
              Crear mi miniweb gratis
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover/cta:translate-x-0.5">→</span>
            </a>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold hover:bg-white/5">Hablar por WhatsApp</a>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <h2 className="mb-8 text-center text-2xl font-black tracking-tight md:text-3xl" style={{ fontFamily: "var(--font-space)" }}>Qué obtenés</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.t} className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${b.grad} text-2xl shadow-lg`}>{b.i}</div>
                <h3 className="mt-3 font-black">{b.t}</h3>
                <p className="mt-1.5 text-sm text-white/60">{b.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {ejemplos && ejemplos.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="mb-6 text-center text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Mirá miniwebs reales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ejemplos.map((b: any) => (
              <a key={b.slug} href={`/negocio/${b.slug}`}
                className="group overflow-hidden rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-orange-400/30">
                <div className="overflow-hidden rounded-[1.1rem] border border-white/[.05] bg-black/10">
                  <div className="relative h-28 w-full overflow-hidden">
                    <CategoryCover category={b.category} seed={b.slug} className="h-full w-full transition duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-black">{b.name}</h3>
                    <p className="text-sm capitalize text-white/50">{b.category} · ✓ verificado</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-pink-500/[.04] p-1.5">
          <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-8 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] md:p-12">
            <h2 className="text-2xl font-black tracking-tight md:text-3xl" style={{ fontFamily: "var(--font-space)" }}>Fundadores de la plataforma</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/60">Los primeros comercios entran con beneficios de fundador -- se reclama solo, sin esperar a nadie.</p>
            <a href="/dashboard/nuevo" className="mt-6 inline-block rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-95">Crear mi negocio y reclamar</a>
          </div>
        </div>
      </section>
    </main>
  );
}
