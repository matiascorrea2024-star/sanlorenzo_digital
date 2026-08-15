"use client";
import Link from "next/link";
import { Anchor, Ship, Warehouse, Truck, MapPin, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/badge";

const SERVICIOS = [
  { icon: Anchor, titulo: "Terminales portuarias", desc: "Operadores de terminales del cordón industrial." },
  { icon: Ship, titulo: "Agencias marítimas", desc: "Despachantes, agentes marítimos y operadores logísticos." },
  { icon: Warehouse, titulo: "Almacenamiento", desc: "Depósitos fiscales, zonas francas y acopio." },
  { icon: Truck, titulo: "Transporte de cargas", desc: "Fletes pesados, cargas especiales y distribución." },
  { icon: MapPin, titulo: "Servicios en puerto", desc: "Mantenimiento naval, practicaje y servicios portuarios." },
];

export default function PortuarioView() {
  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-cyan-900/30 via-[#120d09] to-blue-900/30 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.15),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge size="md" className="bg-cyan-500/20 border-cyan-400/40 text-cyan-200">
            <Anchor className="h-3 w-3 mr-1" /> Sector portuario
          </Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            Puerto de{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
              San Lorenzo
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/70 md:text-lg">
            El cordón portuario más importante del Paraná.
            Servicios portuarios, logística fluvial y comercio exterior
            en un solo lugar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="text-2xl font-black mb-6">Servicios del sector</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICIOS.map(s => (
            <Link key={s.titulo} href="/categoria/portuario"
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 hover:border-cyan-400/50 transition">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
                <s.icon className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{s.titulo}</p>
                <p className="text-sm text-white/60 mt-1">{s.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0 mt-1" />
            </Link>
          ))}
        </div>

        {/* Dato estratégico */}
        <div className="mt-10 grid grid-cols-3 gap-3">
          {[
            { v: "40+", l: "Terminales en el cordón" },
            { v: "150+", l: "Empresas del sector" },
            { v: "#1", l: "Puerto agroexportador" },
          ].map(s => (
            <div key={s.l} className="rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-4 text-center">
              <p className="text-3xl font-black text-cyan-300">{s.v}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/60">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 p-8 text-center">
          <p className="text-sm text-white/70">¿Brindás servicios portuarios?</p>
          <h3 className="mt-2 text-2xl font-black">Publicá tu empresa en el ecosistema</h3>
          <Link href="/para-negocios"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-black hover:opacity-90 transition">
            Registrar empresa portuaria →
          </Link>
        </div>
      </div>
    </main>
  );
}
