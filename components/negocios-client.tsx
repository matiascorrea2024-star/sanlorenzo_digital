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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Negocios de San Lorenzo</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">{list.length} {list.length === 1 ? "negocio" : "negocios"}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio…"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]" />
        <label className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--muted)]">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} className="accent-[var(--accent)]" />
          Abierto ahora
        </label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORIES.map((c: any) => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
            className={`rounded-full border px-3 py-1 text-xs ${cat === c.id ? "border-[var(--accent)] bg-[var(--surface2)] text-white" : "border-[var(--line)] text-[var(--muted)] hover:text-white"}`}>
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
        <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          <p className="font-semibold text-[var(--text)]">No encontramos exactamente eso.</p>
          <p className="mt-1 text-sm">Estamos incorporando negocios de esta categoría. ¿Tenés uno? Sumalo.</p>
        </div>
      )}
    </main>
  );
}
