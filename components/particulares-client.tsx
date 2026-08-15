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
      <Link href="/negocios" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Volver a negocios
      </Link>
      <h1 className="mt-3 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Venta entre vecinos</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Lo que venden particulares de San Lorenzo por su cuenta -- sin local, sin negocio. {list.length} publicaci{list.length === 1 ? "ón" : "ones"}.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar entre lo que venden los vecinos…"
          className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm outline-none focus:border-[var(--accent)]" />
      </div>

      {catsConPublicaciones.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {catsConPublicaciones.map((c: any) => (
            <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
              className={`rounded-full border px-3 py-1 text-xs ${cat === c.id ? "border-[var(--accent)] bg-[var(--surface2)] text-white" : "border-[var(--line)] text-[var(--muted)] hover:text-white"}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b: any) => <BusinessCard key={b.id} b={b} />)}
      </div>

      {list.length === 0 && (
        <div className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-10 text-center text-[var(--muted)]">
          <p className="font-semibold text-[var(--text)]">Todavía no hay publicaciones de particulares.</p>
          <p className="mt-1 text-sm">
            ¿Vendés algo por tu cuenta?{" "}
            <Link href="/dashboard/nuevo" className="font-bold text-[var(--accent)]">Publicalo acá →</Link>
          </p>
        </div>
      )}
    </main>
  );
}
