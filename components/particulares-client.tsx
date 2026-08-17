"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import BusinessCard from "@/components/business/card";

export default function Particulares({ initial }: { initial: any[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const catsConPublicaciones = useMemo(
    () => CATEGORIES.filter((c: any) => initial.some((b: any) => b.category === c.id)),
    [initial]
  );
  const list = useMemo(() => initial.filter((b: any) =>
    (!cat || b.category === cat) &&
    (!q.trim() || [b.name, b.description, ...(b.tags || [])].join(" ").toLowerCase().includes(q.toLowerCase()))
  ), [initial, q, cat]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/negocios" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        <ArrowLeft className="h-4 w-4" /> Volver a negocios
      </Link>
      <p className="mb-2 mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">
        Entre vecinos
      </p>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Venta entre vecinos</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Lo que venden particulares de San Lorenzo por su cuenta -- sin local, sin negocio. {list.length} publicaci{list.length === 1 ? "ón" : "ones"}.
      </p>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <div className="w-full rounded-[1.1rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar entre lo que venden los vecinos…"
            className="w-full rounded-[.75rem] border border-[var(--ov-05)] bg-[var(--card-inner)] px-4 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted2)] focus:border-cyan-400/40" />
        </div>
      </div>

      {catsConPublicaciones.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {catsConPublicaciones.map((c: any) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-300 ${cat === c.id ? "border-transparent bg-gradient-to-r from-cyan-500 to-sky-500 text-[var(--text)]" : "border-[var(--ov-08)] text-[var(--muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]"}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b: any) => <BusinessCard key={b.id} b={b} />)}
      </div>

      {list.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
          <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-10 text-center">
            <p className="font-black text-[var(--text)]">Todavía no hay publicaciones de particulares.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              ¿Vendés algo por tu cuenta?{" "}
              <Link href="/dashboard/nuevo" className="font-bold text-cyan-300">Publicalo acá →</Link>
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
