"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import BusinessCard from "@/components/business/card";
import { supabase } from "@/lib/supabase";

export const NEGOCIOS_PAGE_SIZE = 60;

const COLUMNS = "id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios, destacado";

async function fetchPage({ cat, q, openNow, from, to }: { cat: string | null; q: string; openNow: boolean; from: number; to: number }) {
  let query = supabase().from("businesses").select(COLUMNS, { count: "exact" })
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .or("type.is.null,type.in.(comercio,servicio,profesional)");
  if (cat) query = query.eq("category", cat);
  if (openNow) query = query.eq("open", true);
  const term = q.trim();
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  const { data, count } = await query.order("destacado", { ascending: false }).order("name").range(from, to);
  return { data: data || [], count: count ?? 0 };
}

export default function Negocios({ initial, initialTotal }: { initial: any[]; initialTotal: number }) {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(() => {
    const c = searchParams.get("categoria");
    return c && CATEGORIES.some((x: any) => x.id === c) ? c : null;
  });
  const [openNow, setOpenNow] = useState(false);
  const [list, setList] = useState<any[]>(initial);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [buscando, setBuscando] = useState(false);
  // No refetch en el primerísimo render -- initial ya viene de la
  // página servidor con estos mismos filtros base.
  const primerRender = useRef(true);

  useEffect(() => {
    if (primerRender.current) { primerRender.current = false; return; }
    setBuscando(true);
    const t = setTimeout(async () => {
      const { data, count } = await fetchPage({ cat, q, openNow, from: 0, to: NEGOCIOS_PAGE_SIZE - 1 });
      setList(data);
      setTotal(count);
      setBuscando(false);
    }, q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [cat, q, openNow]);

  const cargarMas = async () => {
    setLoadingMore(true);
    const { data } = await fetchPage({ cat, q, openNow, from: list.length, to: list.length + NEGOCIOS_PAGE_SIZE - 1 });
    setList((prev) => [...prev, ...data]);
    setLoadingMore(false);
  };

  const hasMore = list.length < total;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-orange-300">
        Directorio
      </p>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Negocios de San Lorenzo</h1>
      <p className="mt-2 text-sm text-white/50">
        {total} {total === 1 ? "negocio activo" : "negocios activos"} ahora mismo
        {buscando && <span className="ml-2 text-white/30">buscando...</span>}
      </p>

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
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors duration-300 ${cat === c.id ? "border-transparent bg-gradient-to-r from-orange-500 to-red-600 text-white" : "border-white/[.08] text-white/50 hover:border-white/20 hover:text-white"}`}>
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
      {!buscando && list.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-10 text-center">
            <p className="font-black text-white">No encontramos exactamente eso.</p>
            <p className="mt-1 text-sm text-white/50">Estamos incorporando negocios de esta categoría. ¿Tenés uno? Sumalo.</p>
          </div>
        </div>
      )}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button onClick={cargarMas} disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 transition hover:border-orange-400/40 hover:text-white disabled:opacity-50">
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? "Cargando..." : `Cargar más (${total - list.length} restantes)`}
          </button>
        </div>
      )}
    </main>
  );
}
