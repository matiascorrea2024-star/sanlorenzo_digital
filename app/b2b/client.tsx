"use client";
import Link from "next/link";
import { Factory, Anchor, Cog, Ship, Truck, Briefcase, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge";

const SECTORES = [
  { id: "industria", icon: Factory, titulo: "🏭 Industria", desc: "Plantas industriales, manufactura y producción de la zona.", color: "from-orange-500/20 to-red-500/20" },
  { id: "servicios-industriales", icon: Cog, titulo: "⚙️ Servicios industriales", desc: "Mantenimiento, ingeniería, soldaduras, tornería y más.", color: "from-sky-500/20 to-blue-500/20" },
  { id: "logistica", icon: Truck, titulo: "🚚 Logística", desc: "Transporte de cargas, fletes, distribución y almacenamiento.", color: "from-emerald-500/20 to-green-500/20" },
  { id: "comercio-exterior", icon: Ship, titulo: "🚢 Comercio exterior", desc: "Despachantes de aduana, agencias marítimas, forwarding.", color: "from-indigo-500/20 to-purple-500/20" },
  { id: "portuario", icon: Anchor, titulo: "⚓ Portuario", desc: "Servicios portuarios, terminales y proveedores del puerto.", color: "from-cyan-500/20 to-sky-500/20" },
  { id: "b2b", icon: Briefcase, titulo: "🤝 B2B / Empresas", desc: "Proveedores corporativos, servicios empresariales, consultoría.", color: "from-yellow-500/20 to-orange-500/20" },
];

export default function B2bView() {
  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-900/50 via-[#120d09] to-indigo-900/30 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.15),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge variant="info" size="md">🏭 Para empresas</Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Industria y B2B en{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
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
            <Link key={s.id} href={`/categoria/${s.id}`}
              className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${s.color} p-6 transition hover:border-orange-400/50 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]`}>
              <s.icon className="h-10 w-10 text-white/80 mb-3" />
              <h2 className="text-xl font-black mb-2">{s.titulo}</h2>
              <p className="text-sm text-white/70 leading-relaxed">{s.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-sm font-bold text-orange-400">
                Explorar sector <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA comercial B2B */}
        <div className="mt-12 rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-8 md:p-12">
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
                className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-8 py-4 text-base font-black hover:opacity-90 transition">
                Publicar mi empresa →
              </Link>
              <Link href="/planes"
                className="rounded-xl border border-white/30 px-8 py-4 text-sm font-black hover:bg-white/10 transition">
                Ver planes para empresas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
