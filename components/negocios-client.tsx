"use client";
import RankedAvatar from "@/components/ui/ranked-avatar";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import BusinessCard from "@/components/business/card";
export default function Negocios({ initial }: { initial: any[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [openNow, setOpenNow] = useState(false);
  // El directorio por rubro es para negocios de verdad -- los vendedores
  // particulares (venta entre vecinos, sin local) tienen su propio
  // espacio en /particulares para que no se mezclen en la misma búsqueda.
  const negocios = useMemo(() => initial.filter((b: any) => !b.type || b.type === "comercio" || b.type === "servicio" || b.type === "profesional"), [initial]);
  const list = useMemo(() => negocios.filter((b: any) =>
    (!cat || b.category === cat) &&
    (!openNow || b.open) &&
    (!q.trim() || [b.name, b.description, ...b.tags].join(" ").toLowerCase().includes(q.toLowerCase()))
  // Destacado Semanal (plan pago) va primero -- es lo que paga esa posición.
  ).sort((a: any, b: any) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)), [negocios, q, cat, openNow]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-orange-300">
        Directorio
      </p>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Negocios de San Lorenzo</h1>
      <p className="mt-2 text-sm text-white/50">{list.length} {list.length === 1 ? "negocio" : "negocios"} activos ahora mismo</p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="w-full rounded-[1.1rem] border border-white/[.06] bg-white/[.02] p-1">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio…"
            className="w-full rounded-[.75rem] border border-white/[.05] bg-black/20 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-400/40" />
        </div>
        <label className="flex shrink-0 items-center gap-2 rounded-[1.1rem] border border-white/[.06] bg-white/[.02] px-4 py-3 text-sm text-white/60">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} className="accent-orange-500" />
          Abierto ahora
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c: any) => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-300 ${cat === c.id ? "border-transparent bg-gradient-to-r from-orange-500 to-pink-500 text-white" : "border-white/[.08] text-white/50 hover:border-white/20 hover:text-white"}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Entrada a particulares -- a propósito distinta a los chips de
          rubro de arriba, para que se note que es otro espacio, no un
          rubro más. */}
      <Link
        href="/particulares"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-500/[.06] px-4 py-3 text-sm transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
      >
        <span>
          <span className="font-bold text-cyan-300">🙋 ¿Buscás algo de un particular?</span>
          <span className="ml-1.5 text-[var(--muted)]">Venta entre vecinos, sin local ni negocio.</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-cyan-300" />
      </Link>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b: any) => <BusinessCard key={b.id} b={b} />)}
      </div>
      {list.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-10 text-center">
            <p className="font-black text-white">No encontramos exactamente eso.</p>
            <p className="mt-1 text-sm text-white/50">Estamos incorporando negocios de esta categoría. ¿Tenés uno? Sumalo.</p>
          </div>
        </div>
      )}
    </main>
  );
}
