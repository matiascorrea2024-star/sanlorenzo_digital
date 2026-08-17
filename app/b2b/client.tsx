"use client";
import Link from "next/link";
import { Factory, Anchor, Cog, Ship, Truck, Briefcase, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge";

const SECTORES = [
  { id: "industria", icon: Factory, titulo: "🏭 Industria", desc: "Plantas industriales, manufactura y producción de la zona.", color: "from-orange-500/20 to-red-500/20" },
  { id: "servicios-industriales", icon: Cog, titulo: "⚙️ Servicios industriales", desc: "Mantenimiento, ingeniería, soldaduras, tornería y más.", color: "from-sky-500/20 to-blue-500/20" },
  { id: "logistica", icon: Truck, titulo: "🚚 Logística", desc: "Transporte de cargas, fletes, distribución y almacenamiento.", color: "from-emerald-500/20 to-green-500/20" },
  { id: "comercio-exterior", icon: Ship, titulo: "🚢 Comercio exterior", desc: "Despachantes de aduana, agencias marítimas, forwarding.", color: "from-cyan-500/20 to-blue-500/20" },
  { id: "portuario", icon: Anchor, titulo: "⚓ Portuario", desc: "Servicios portuarios, terminales y proveedores del puerto.", color: "from-cyan-500/20 to-sky-500/20" },
  { id: "b2b", icon: Briefcase, titulo: "🤝 B2B / Empresas", desc: "Proveedores corporativos, servicios empresariales, consultoría.", color: "from-yellow-500/20 to-orange-500/20" },
];

export default function B2bView() {
  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <section className="relative overflow-hidden border-b border-white/10 py-16">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.18), transparent 55%), radial-gradient(circle at 90% 30%, rgba(34,211,238,.14), transparent 55%)" }} />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge variant="info" size="md">🏭 Para empresas</Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
            Industria y B2B en{" "}
            <span className="bg-gradient-to-r from-orange-400 to-cyan-400 bg-clip-text text-transparent">
              San Lorenzo
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70 md:text-lg">
            El ecosistema industrial, portuario y comercial del Gran San Lorenzo.
            Conectá con proveedores, servicios industriales y empresas B2B de la región.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SECTORES.map(s => (
            <Link key={s.id} href={`/negocios?categoria=${s.id}`}
              className="group rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1">
              <div className={`h-full rounded-[1.375rem] border border-white/[.05] bg-gradient-to-br ${s.color} p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,.08)] transition-colors group-hover:border-orange-400/30`}>
                <s.icon className="h-10 w-10 text-white/80 mb-3" />
                <h2 className="text-xl font-black mb-2">{s.titulo}</h2>
                <p className="text-sm text-white/70 leading-relaxed">{s.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-bold text-orange-400">
                  Explorar sector <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA comercial B2B */}
        <div className="mt-12 rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-cyan-500/[.04] p-1.5">
          <div className="rounded-[1.375rem] border border-white/[.06] bg-black/20 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)] md:p-12">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <Badge variant="info" size="sm">💼 Para empresas y proveedores</Badge>
                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  ¿Sos proveedor industrial o empresa B2B?
                </h2>
                <p className="mt-3 text-white/80">
                  Conectá con otras empresas de San Lorenzo, Puerto San Martín,
                  Fray Luis Beltrán y Capitán Bermúdez. Publicá tus servicios
                  y llegá a nuevos clientes corporativos.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                <Link href="/para-negocios"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-8 py-4 text-base font-black hover:opacity-90 transition">
                  Publicar mi empresa →
                </Link>
                <Link href="/planes"
                  className="rounded-full border border-white/30 px-8 py-4 text-sm font-black hover:bg-white/10 transition">
                  Ver planes para empresas
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
