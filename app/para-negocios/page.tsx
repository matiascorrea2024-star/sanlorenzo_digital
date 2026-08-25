import Link from "next/link";
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
    { i: "🏪", t: "Miniweb propia", d: "Tu local digital con color, logo, dirección y horarios. URL única.", grad: "from-[var(--accent)] to-[var(--accent2)]" },
    { i: "📸", t: "Productos con fotos", d: "Cargás desde el celu. Se publica al instante.", grad: "from-[var(--accent2)] to-[#861642]" },
    { i: "🔥", t: "Promociones inteligentes", d: "Con vencimiento: solas se apagan cuando terminan.", grad: "from-[var(--accent)] to-[#861642]" },
    { i: "💬", t: "WhatsApp directo", d: "Cada visita a un toque de escribirte.", grad: "from-emerald-600 to-teal-400" },
    { i: "🔒", t: "Tu negocio, solo tuyo", d: "Protección de cuenta y datos.", grad: "from-[#f6a5be] to-[var(--accent2)]" },
    { i: "✅", t: "Sello verificado", d: "Cuando te verificamos, ganás confianza.", grad: "from-[var(--accent)] to-[var(--accent2)]" },
  ];

  return (
    <main className="bg-[#0c0a0b] text-[#f7f3ec]">
      {/* Hero editorial -- página de venta, no un listado más */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute left-[-10%] top-[-15%] h-[70%] w-[70%] rounded-full bg-[#d12f68] opacity-[0.08] blur-[180px]" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-[-30%] right-[-5%] h-[50%] w-[50%] rounded-full bg-[#d12f68] opacity-[0.06] blur-[140px]" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
          <p className="mb-5 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
            Para comercios de San Lorenzo
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-5xl leading-[0.95] tracking-tight md:text-7xl">
            Tu negocio, en el{" "}
            <span className="knockout-text magenta-glow">mapa digital</span>{" "}
            de la ciudad.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#a99b86] md:text-lg">Miniweb propia, productos con fotos, promociones que se renuevan solas y contacto directo por WhatsApp. Sin saber programar.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard/nuevo" className="btn-hard group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>
              Crear mi miniweb gratis
              <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
            {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-xl border border-white/15 px-6 py-3 text-xs font-black uppercase tracking-widest transition hover:border-[var(--accent)] hover:text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Hablar por WhatsApp</a>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h2 className="mb-10 text-center font-display text-3xl tracking-tight md:text-4xl">Qué obtenés</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFICIOS.map((b) => (
            <div key={b.t} className="rounded-[2rem] border border-white/5 bg-[#161314] p-7 transition-colors duration-300 hover:border-[var(--accent)]/40">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br ${b.grad} text-2xl shadow-lg`}>{b.i}</div>
              <h3 className="mt-5 font-display text-lg tracking-tight">{b.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#a99b86]">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {ejemplos && ejemplos.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="mb-8 text-center font-display text-3xl tracking-tight">Mirá miniwebs reales</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {ejemplos.map((b: any) => (
              <a key={b.slug} href={`/negocio/${b.slug}`}
                className="group overflow-hidden rounded-[2rem] border border-white/5 bg-[#161314] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent)]/50">
                <div className="relative h-32 w-full overflow-hidden border-b border-white/5">
                  <CategoryCover category={b.category} seed={b.slug} className="h-full w-full transition duration-500 group-hover:scale-110" />
                </div>
                <div className="p-6">
                  <h3 className="font-display text-xl tracking-tight">{b.name}</h3>
                  <p className="mt-1 text-sm capitalize text-[#a99b86]">{b.category} · ✓ verificado</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 pb-24 pt-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[.12] to-transparent p-8 text-center md:p-14">
          <div className="pointer-events-none absolute left-1/2 top-[-60%] h-[80%] w-[80%] -translate-x-1/2 rounded-full bg-[#d12f68] opacity-[0.08] blur-[140px]" aria-hidden="true" />
          <h2 className="relative font-display text-3xl tracking-tight md:text-4xl">Fundadores de la plataforma</h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#a99b86]">Los primeros comercios entran con beneficios de fundador -- se reclama solo, sin esperar a nadie.</p>
          <Link href="/dashboard/nuevo" className="btn-hard relative mt-7 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white" style={{ fontFamily: "var(--font-display)" }}>Crear mi negocio y reclamar</Link>
        </div>
      </section>
    </main>
  );
}
