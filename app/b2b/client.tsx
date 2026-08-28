"use client";
import Link from "next/link";
import { Factory, Anchor, Cog, Ship, Truck, Briefcase, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge";

const SECTORES = [
  { id: "industria", icon: Factory, titulo: "🏭 Industria", desc: "Plantas industriales, manufactura y producción de la zona.", color: "from-[var(--accent)]/20 to-[var(--accent2)]/20" },
  { id: "servicios-industriales", icon: Cog, titulo: "⚙️ Servicios industriales", desc: "Mantenimiento, ingeniería, soldaduras, tornería y más.", color: "from-sky-500/20 to-blue-500/20" },
  { id: "logistica", icon: Truck, titulo: "🚚 Logística", desc: "Transporte de cargas, fletes, distribución y almacenamiento.", color: "from-emerald-500/20 to-green-500/20" },
  { id: "comercio-exterior", icon: Ship, titulo: "🚢 Comercio exterior", desc: "Despachantes de aduana, agencias marítimas, forwarding.", color: "from-cyan-500/20 to-blue-500/20" },
  { id: "portuario", icon: Anchor, titulo: "⚓ Portuario", desc: "Servicios portuarios, terminales y proveedores del puerto.", color: "from-cyan-500/20 to-sky-500/20" },
  { id: "b2b", icon: Briefcase, titulo: "🤝 B2B / Empresas", desc: "Proveedores corporativos, servicios empresariales, consultoría.", color: "from-yellow-500/20 to-[#890809]/20" },
];

export default function B2bView() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--line)] py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(209,47,104,.16), transparent 55%), radial-gradient(circle at 90% 30%, rgba(169,31,85,.10), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge variant="info" size="md">🏭 Para empresas</Badge>
          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight md:text-6xl">
            Industria y B2B en{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[#890809] bg-clip-text text-transparent">
              San Lorenzo
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)] md:text-lg">
            El ecosistema industrial, portuario y comercial del Gran San Lorenzo.
            Conectá con proveedores, servicios industriales y empresas B2B de la región.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTORES.map(s => (
            <Link key={s.id} href={`/negocios?categoria=${s.id}`}
              className="group rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
              <s.icon className="mb-3 h-10 w-10 text-[var(--accent-ink)]" />
              <h2 className="mb-2 font-display text-xl uppercase tracking-tight">{s.titulo}</h2>
              <p className="text-sm leading-relaxed text-[var(--muted)]">{s.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-black uppercase tracking-wide text-[var(--accent-ink)]">
                Explorar sector <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA comercial B2B */}
        <div className="mt-12 rounded-[2rem] border border-[var(--accent)]/25 bg-[var(--surface)] p-8 shadow-[0_0_40px_rgba(209,47,104,0.08)] md:p-12">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <Badge variant="info" size="sm">💼 Para empresas y proveedores</Badge>
              <h2 className="mt-3 font-display text-3xl uppercase tracking-tight md:text-4xl">
                ¿Sos proveedor industrial o empresa B2B?
              </h2>
              <p className="mt-3 text-[var(--muted)]">
                Conectá con otras empresas de San Lorenzo, Puerto San Martín,
                Fray Luis Beltrán y Capitán Bermúdez. Publicá tus servicios
                y llegá a nuevos clientes corporativos.
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <Link href="/para-negocios"
                className="btn-hard inline-block rounded-xl bg-[var(--accent)] px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition" style={{ fontFamily: "var(--font-display)" }}>
                Publicar mi empresa →
              </Link>
              <Link href="/planes"
                className="inline-block rounded-full border border-[var(--line-strong)] px-8 py-4 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-white" style={{ fontFamily: "var(--font-display)" }}>
                Ver planes para empresas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
