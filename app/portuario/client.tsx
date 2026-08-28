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
      {/* Banner atmosférico fijo (fondo siempre oscuro, sea cual sea el
          tema del sitio -- es una ambientación tipo "puerto de noche",
          no una superficie que deba responder al toggle). El texto acá
          adentro va con color fijo claro, no con el token --text. */}
      <section className="relative overflow-hidden border-b border-[var(--line-strong)] bg-[var(--bg)] py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(209,47,104,0.14),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <Badge size="md" className="border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent-ink)]">
            <Anchor className="mr-1 h-3 w-3" /> Sector portuario
          </Badge>
          <h1 className="mt-4 font-display text-4xl uppercase leading-[0.9] tracking-tight text-white md:text-6xl">
            Puerto de{" "}
            <span className="magenta-glow bg-gradient-to-r from-[var(--accent)] to-[var(--accent2)] bg-clip-text text-transparent">
              San Lorenzo
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[var(--muted)] md:text-lg">
            El cordón portuario más importante del Paraná.
            Servicios portuarios, logística fluvial y comercio exterior
            en un solo lugar.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <h2 className="mb-6 font-display text-2xl uppercase tracking-tight">Servicios del sector</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SERVICIOS.map(s => (
            <Link key={s.titulo} href="/negocios?categoria=portuario"
              className="group rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-5 transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10">
                  <s.icon className="h-6 w-6 text-[var(--accent-ink)]" />
                </div>
                <div className="flex-1">
                  <p className="font-display text-lg uppercase tracking-tight">{s.titulo}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{s.desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--accent-ink)] transition duration-300 group-hover:translate-x-1" />
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
            <div key={s.l} className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-4 text-center transition-all duration-700 ease-[cubic-bezier(0.165,0.84,0.44,1)] hover:-translate-y-2 hover:border-[var(--accent)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(209,47,104,0.1)]">
              <p className="magenta-glow font-display text-3xl text-[var(--accent-ink)]">{s.v}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--muted2)]" style={{ fontFamily: "var(--font-display)" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* CTA con el mismo gradiente naranja/rojo que usa TODO el resto
            del sitio (home, /planes, /b2b) -- antes era cian/azul, el
            único botón de "publicar" de toda la web que no llevaba la
            marca. El cian de arriba (ambientación "puerto de noche") se
            mantiene tal cual; lo que cambia es solo este cierre, que es
            donde importa que se reconozca la marca para convertir. */}
        <div className="mt-10 rounded-3xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center">
          <p className="text-sm text-[var(--muted)]">¿Brindás servicios portuarios?</p>
          <h3 className="mt-2 font-display text-2xl uppercase tracking-tight">Publicá tu empresa en el ecosistema</h3>
          <Link href="/para-negocios"
            className="btn-hard mt-4 inline-block rounded-xl bg-[var(--accent)] px-6 py-3 text-xs font-black uppercase tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}>
            Registrar empresa portuaria →
          </Link>
        </div>
      </div>
    </main>
  );
}
