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
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <section className="relative overflow-hidden border-b border-[var(--line)] bg-gradient-to-br from-cyan-900/30 via-[#0c0a0b] to-blue-900/30 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.15),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge size="md" className="bg-cyan-500/20 border-cyan-400/40 text-cyan-200">
            <Anchor className="h-3 w-3 mr-1" /> Sector portuario
          </Badge>
          <h1 className="mt-4 text-4xl font-black md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
            Puerto de{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400 bg-clip-text text-transparent">
              San Lorenzo
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--text)]/70 md:text-lg">
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
            <Link key={s.titulo} href="/negocios?categoria=portuario"
              className="group rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
              <div className="flex items-start gap-4 rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)] transition-colors group-hover:border-cyan-400/30">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
                  <s.icon className="h-6 w-6 text-cyan-300" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">{s.titulo}</p>
                  <p className="text-sm text-[var(--muted)] mt-1">{s.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-cyan-400 shrink-0 mt-1 transition duration-300 group-hover:translate-x-1" />
              </div>
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
            <div key={s.l} className="rounded-[1.5rem] border border-cyan-400/25 bg-cyan-500/[.04] p-1.5">
              <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <p className="text-3xl font-black text-cyan-300">{s.v}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{s.l}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[.08] to-blue-500/[.04] p-1.5">
          <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <p className="text-sm text-[var(--text)]/70">¿Brindás servicios portuarios?</p>
            <h3 className="mt-2 text-2xl font-black">Publicá tu empresa en el ecosistema</h3>
            <Link href="/para-negocios"
              className="mt-4 inline-block rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 text-sm font-black hover:opacity-90 transition">
              Registrar empresa portuaria →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
