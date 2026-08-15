import PageHero from "@/components/ui/page-hero";
import { createClient } from "@/lib/supabase-server";

export default async function Page() {
  const sb = await createClient();
  const { data: setting } = await sb.from("platform_settings").select("value").eq("key", "whatsapp_contacto").maybeSingle();
  const whatsapp = setting?.value || null;
  const wa = whatsapp ? "https://wa.me/" + whatsapp + "?text=" + encodeURIComponent("Hola! Quiero sumar mi negocio a San Lorenzo Digital") : null;

  const { data: ejemplos } = await sb.from("businesses")
    .select("slug, name, category")
    .eq("status", "verificado").order("updated_at", { ascending: false }).limit(2);

  return (
    <main>
      <PageHero title="🏪 Para comercios" subtitle="Tu negocio, en el mapa digital de la ciudad" />
      <section className="px-4 py-20 text-center md:py-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[.25em] text-[var(--accent2)]">Para comercios de San Lorenzo</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>
          Tu negocio, en el <span className="text-[var(--accent)]">mapa digital</span> de la ciudad.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[var(--muted)]">Miniweb propia, productos con fotos, promociones que se renuevan solas y contacto directo por WhatsApp. Sin saber programar.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="/dashboard/nuevo" className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white">Crear mi miniweb gratis</a>
          {wa && <a href={wa} target="_blank" className="rounded-lg border border-[var(--line)] px-6 py-3 text-sm">Hablar por WhatsApp</a>}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-center text-xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Qué obtenés</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[["🏪", "Miniweb propia", "Tu local digital con color, logo, dirección y horarios. URL única."],
            ["📸", "Productos con fotos", "Cargás desde el celu. Se publica al instante."],
            ["🔥", "Promociones inteligentes", "Con vencimiento: solas se apagan cuando terminan."],
            ["💬", "WhatsApp directo", "Cada visita a un toque de escribirte."],
            ["🔒", "Tu negocio, solo tuyo", "Protección de cuenta y datos."],
            ["✅", "Sello verificado", "Cuando te verificamos, ganás confianza."]].map(([i, t, d]) => (
            <div key={t} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6">
              <p className="text-3xl">{i}</p>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{d}</p>
            </div>
          ))}
        </div>
      </section>
      {ejemplos && ejemplos.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10">
          <h2 className="mb-6 text-center text-xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Mirá miniwebs reales</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ejemplos.map((b: any) => (
              <a key={b.slug} href={`/negocio/${b.slug}`} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 hover:border-[var(--accent)]">
                <h3 className="mt-2 font-semibold">{b.name}</h3>
                <p className="text-sm capitalize text-[var(--muted)]">{b.category} · verificado</p>
              </a>
            ))}
          </div>
        </section>
      )}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="rounded-2xl border border-[var(--accent)] bg-gradient-to-br from-[var(--surface)] to-[rgba(139,92,246,.15)] p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Fundadores de la plataforma</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">Los primeros 10 comercios entran con beneficios de fundador.</p>
          {wa ? (
            <a href={wa} target="_blank" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white">Quiero ser fundador</a>
          ) : (
            <a href="/dashboard/nuevo" className="mt-6 inline-block rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white">Quiero ser fundador</a>
          )}
        </div>
      </section>
    </main>
  );
}
