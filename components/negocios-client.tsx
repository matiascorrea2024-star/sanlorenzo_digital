"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import BusinessCard from "@/components/business/card";
import { supabase } from "@/lib/supabase";
import { sanitizeSearchQuery } from "@/lib/sanitize";

export const NEGOCIOS_PAGE_SIZE = 60;

const COLUMNS = "id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios, destacado, updated_at";

async function fetchPage({ cat, q, openNow, mode, delivery, minRating, from, to }: { cat: string | null; q: string; openNow: boolean; mode: string; delivery: boolean; minRating: number; from: number; to: number }) {
  let query = supabase().from("businesses").select(COLUMNS, { count: "exact" })
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .or("type.is.null,type.in.(comercio,servicio,profesional)");
  if (cat) query = query.eq("category", cat);
  if (openNow || mode === "ahora" || mode === "esta-noche") query = query.eq("open", true);
  if (delivery) query = query.eq("hace_envios", true);
  if (minRating > 0) query = query.gte("rating", minRating);
  const term = sanitizeSearchQuery(q).trim();
  if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  const { data, count, error } = await query.order("destacado", { ascending: false }).order("name").range(from, to);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export default function Negocios({ initial, initialTotal }: { initial: any[]; initialTotal: number }) {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [cat, setCat] = useState<string | null>(() => {
    const c = searchParams.get("categoria") || searchParams.get("cat");
    return c && CATEGORIES.some((x: any) => x.id === c) ? c : null;
  });
  const [openNow, setOpenNow] = useState(() => searchParams.get("abierto") === "1");
  const [mode, setMode] = useState(() => searchParams.get("modo") || "");
  const [delivery, setDelivery] = useState(() => searchParams.get("envios") === "1");
  const [minRating, setMinRating] = useState(() => Number(searchParams.get("rating") || 0));
  const [list, setList] = useState<any[]>(initial);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  // Si el usuario tipea rápido, una respuesta vieja puede tardar más y
  // llegar DESPUÉS de una más nueva, pisando el resultado correcto con
  // uno de una búsqueda ya descartada. Este contador de secuencia
  // descarta cualquier respuesta que no sea la última pedida.
  const secuencia = useRef(0);

  useEffect(() => {
    setBuscando(true);
    setError("");
    const miSecuencia = ++secuencia.current;
    const t = setTimeout(async () => {
      try {
        const { data, count } = await fetchPage({ cat, q, openNow, mode, delivery, minRating, from: 0, to: NEGOCIOS_PAGE_SIZE - 1 });
        if (miSecuencia !== secuencia.current) return;
        setList(data);
        setTotal(count);
      } catch {
        if (miSecuencia === secuencia.current) setError("No pudimos cargar el directorio. Revisá tu conexión e intentá de nuevo.");
      } finally {
        if (miSecuencia === secuencia.current) setBuscando(false);
      }
    }, q.trim() ? 300 : 0);
    return () => clearTimeout(t);
  }, [cat, q, openNow, mode, delivery, minRating]);

  const cargarMas = async () => {
    setLoadingMore(true);
    try {
      const { data } = await fetchPage({ cat, q, openNow, mode, delivery, minRating, from: list.length, to: list.length + NEGOCIOS_PAGE_SIZE - 1 });
      setList((prev) => [...prev, ...data]);
    } catch {
      setError("No pudimos cargar más negocios.");
    }
    setLoadingMore(false);
  };

  const hasMore = list.length < total;

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-[#0c0a0b] px-4 py-10 pb-24 text-[#f7f3ec] md:py-14" aria-busy={buscando}>
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
        Directorio
      </p>
      <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight md:text-6xl">Negocios de <span className="knockout-text magenta-glow">San Lorenzo</span></h1>
      <p className="mt-2 text-sm text-[#a99b86]">
        {total} {total === 1 ? "negocio activo" : "negocios activos"} ahora mismo
        {buscando && <span className="ml-2 text-[#7d6f5c]">buscando...</span>}
      </p>
      {error && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--bad)]">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="font-bold underline">Cerrar</button>
        </div>
      )}

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="w-full">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio…"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-[#7d6f5c] focus:border-[var(--accent)]" />
        </div>
        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#a99b86]">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} className="accent-[var(--accent)]" />
          Abierto ahora
        </label>
        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#a99b86]">
          <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="accent-[var(--accent)]" />
          Hace envíos
        </label>
        <label className="flex min-h-12 items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#a99b86]">
          <span>Rating mínimo</span>
          <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="bg-transparent font-bold text-white outline-none">
            <option value={0}>Cualquiera</option>
            <option value={4}>4+</option>
            <option value={4.5}>4,5+</option>
          </select>
        </label>
      </div>
      <div className="custom-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
        {([["", "Todo"], ["ahora", "Ahora"], ["esta-noche", "Esta noche"]] as const).map(([value, label]) => (
          <button key={value} type="button" onClick={() => setMode(value)} className={`shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${mode === value ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/10 text-[#a99b86] hover:border-[var(--accent)] hover:text-white"}`}>
            {label}
          </button>
        ))}
        {CATEGORIES.map((c: any) => (
          <button key={c.id} onClick={() => setCat(cat === c.id ? null : c.id)}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-colors ${cat === c.id ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-white/10 text-[#a99b86] hover:border-[var(--accent)] hover:text-white"}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      {/* Entrada a particulares -- a propósito distinta a los chips de
          rubro de arriba, para que se note que es otro espacio, no un
          rubro más. */}
      <Link
        href="/particulares"
        className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm transition hover:border-[var(--accent)] hover:bg-white/[.07]"
      >
        <span>
          <span className="font-bold text-[#f7f3ec]">🙋 ¿Buscás algo de un particular?</span>
          <span className="ml-1.5 text-[#a99b86]">Venta entre vecinos, sin local ni negocio.</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--accent)]" />
      </Link>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((b: any) => <BusinessCard key={b.id} b={b} />)}
      </div>
      {!buscando && list.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-white/10 bg-[#161314] p-8 text-center">
          <p className="font-display text-xl uppercase tracking-tight text-[#f7f3ec]">No encontramos exactamente eso.</p>
          <p className="mt-1 text-sm text-[#a99b86]">Estamos incorporando negocios de esta categoría. ¿Tenés uno? Sumalo.</p>
        </div>
      )}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button onClick={cargarMas} disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-xs font-black uppercase tracking-widest text-[#a99b86] transition hover:border-[var(--accent)] hover:text-white disabled:opacity-50">
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            {loadingMore ? "Cargando..." : `Cargar más (${total - list.length} restantes)`}
          </button>
        </div>
      )}
    </main>
  );
}
