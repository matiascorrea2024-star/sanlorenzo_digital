"use client";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MessageCircle, Search } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/data";
import CategoryCover from "@/components/ui/category-cover";
import RankedAvatar from "@/components/ui/ranked-avatar";
import FavoriteButton from "@/components/ui/favorite-button";
import { supabase } from "@/lib/supabase";
import { sanitizeSearchQuery } from "@/lib/sanitize";
import { expandirBusqueda } from "@/lib/sinonimos";
import { ExpandableFilterGroup, FilterGroup, CheckRow, RadioRow } from "@/components/ui/filter-sidebar";

export const NEGOCIOS_PAGE_SIZE = 60;

const COLUMNS = "id, name, slug, category, rating, reviews, open, description, portada_url, address, whatsapp, plan, status, type, hace_envios, destacado, updated_at, neighborhood_id";

type Sort = "destacado" | "rating" | "reciente";
type Estado = "cualquiera" | "abierto" | "cerrado";

async function fetchPage({ cats, barrios, q, estado, mode, delivery, minRating, soloDestacados, soloVerificados, sort, from, to }: {
  cats: string[]; barrios: string[]; q: string; estado: Estado; mode: string; delivery: boolean; minRating: number;
  soloDestacados: boolean; soloVerificados: boolean; sort: Sort; from: number; to: number;
}) {
  let query = supabase().from("businesses").select(COLUMNS, { count: "exact" })
    .in("status", ["verificado", "reclamado"])
    .eq("activo", true)
    .or("type.is.null,type.in.(comercio,servicio,profesional)");
  if (cats.length > 0) query = query.in("category", cats);
  if (barrios.length > 0) query = query.in("neighborhood_id", barrios);
  if (estado === "abierto" || mode === "ahora" || mode === "esta-noche") query = query.eq("open", true);
  else if (estado === "cerrado") query = query.eq("open", false);
  if (delivery) query = query.eq("hace_envios", true);
  if (minRating > 0) query = query.gte("rating", minRating);
  if (soloDestacados) query = query.eq("destacado", true);
  if (soloVerificados) query = query.eq("status", "verificado");
  const term = sanitizeSearchQuery(q).trim();
  if (term) {
    // Expansión con sinónimos ("choper" encuentra "cerveza"): el término
    // original va primero, cada variante pasa por el mismo sanitize.
    const condiciones = expandirBusqueda(term).flatMap((t) => {
      const seguro = sanitizeSearchQuery(t);
      return [`name.ilike.%${seguro}%`, `description.ilike.%${seguro}%`];
    });
    query = query.or(condiciones.join(","));
  }
  if (sort === "rating") query = query.order("rating", { ascending: false }).order("name");
  else if (sort === "reciente") query = query.order("updated_at", { ascending: false });
  else query = query.order("destacado", { ascending: false }).order("name");
  const { data, count, error } = await query.range(from, to);
  if (error) throw error;
  return { data: data || [], count: count ?? 0 };
}

export default function Negocios({ initial, initialTotal }: { initial: any[]; initialTotal: number }) {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get("q") || "");
  const [cats, setCats] = useState<string[]>(() => {
    const c = searchParams.get("categoria") || searchParams.get("cat");
    return c && CATEGORIES.some((x: any) => x.id === c) ? [c] : [];
  });
  const [estado, setEstado] = useState<Estado>(() => searchParams.get("abierto") === "1" ? "abierto" : "cualquiera");
  const [mode, setMode] = useState(() => searchParams.get("modo") || "");
  const [delivery, setDelivery] = useState(() => searchParams.get("envios") === "1");
  const [minRating, setMinRating] = useState(() => Number(searchParams.get("rating") || 0));
  const [soloDestacados, setSoloDestacados] = useState(false);
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [sort, setSort] = useState<Sort>("destacado");
  const [barrios, setBarrios] = useState<string[]>([]);
  const [barriosDisponibles, setBarriosDisponibles] = useState<{ id: string; name: string }[]>([]);
  const [list, setList] = useState<any[]>(initial);
  const [total, setTotal] = useState(initialTotal);
  const [loadingMore, setLoadingMore] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const [recomendados, setRecomendados] = useState<any[]>([]);

  // Barrios reales de San Lorenzo (lib/data no los tiene -- viven en
  // la tabla locations, cargados una sola vez, no dependen de filtros).
  useEffect(() => {
    supabase().from("locations").select("id, name").eq("type", "neighborhood").eq("active", true).order("name")
      .then(({ data }) => setBarriosDisponibles((data || []).map((l: any) => ({ id: l.id, name: l.name }))));
  }, []);

  // Recomendados: los mejor valorados de la plataforma, independiente
  // de los filtros activos -- para que la pantalla nunca quede "seca"
  // aunque el filtro puesto tenga pocos o ningún resultado.
  useEffect(() => {
    supabase().from("businesses").select(COLUMNS)
      .in("status", ["verificado", "reclamado"]).eq("activo", true).gt("rating", 0)
      .order("rating", { ascending: false }).limit(4)
      .then(({ data }) => setRecomendados(data || []));
  }, []);
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
        const { data, count } = await fetchPage({ cats, barrios, q, estado, mode, delivery, minRating, soloDestacados, soloVerificados, sort, from: 0, to: NEGOCIOS_PAGE_SIZE - 1 });
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
  }, [cats, barrios, q, estado, mode, delivery, minRating, soloDestacados, soloVerificados, sort]);

  const cargarMas = async () => {
    setLoadingMore(true);
    try {
      const { data } = await fetchPage({ cats, barrios, q, estado, mode, delivery, minRating, soloDestacados, soloVerificados, sort, from: list.length, to: list.length + NEGOCIOS_PAGE_SIZE - 1 });
      setList((prev) => [...prev, ...data]);
    } catch {
      setError("No pudimos cargar más negocios.");
    }
    setLoadingMore(false);
  };

  const hasMore = list.length < total;
  const toggleCat = (id: string) => setCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  const toggleBarrio = (id: string) => setBarrios((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] bg-[var(--bg)] px-4 py-8 pb-24 text-[var(--text)] sm:px-6">
      <p className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Directorio</p>
      <h1 className="font-display text-3xl uppercase leading-[0.95] tracking-tight sm:text-4xl">Negocios de San Lorenzo</h1>

      {error && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-[var(--bad)]">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="font-bold underline">Cerrar</button>
        </div>
      )}

      <div className="mt-6 flex items-start gap-8">
        {/* ── Sidebar de filtros: denso, siempre visible en desktop ── */}
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <ExpandableFilterGroup title="Rubro" items={CATEGORIES} selected={cats} onToggle={toggleCat} visibleCount={8} />
          {barriosDisponibles.length > 0 && (
            <ExpandableFilterGroup title="Barrio" items={barriosDisponibles} selected={barrios} onToggle={toggleBarrio} visibleCount={6} />
          )}
          <FilterGroup title="Valoración mínima">
            {[{ v: 0, l: "Cualquiera" }, { v: 4, l: "★★★★ y más" }, { v: 4.5, l: "★★★★½ y más" }].map((o) => (
              <label key={o.v} className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--muted)] transition hover:text-[var(--text)]">
                <input type="radio" name="rating" checked={minRating === o.v} onChange={() => setMinRating(o.v)} className="h-4 w-4 shrink-0 accent-[var(--accent)]" />
                {o.l}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup title="Estado">
            {[{ v: "cualquiera" as Estado, l: "Cualquiera" }, { v: "abierto" as Estado, l: "Abierto ahora" }, { v: "cerrado" as Estado, l: "Cerrado ahora" }].map((o) => (
              <RadioRow key={o.v} name="estado" checked={estado === o.v} onChange={() => setEstado(o.v)} label={o.l} />
            ))}
            <CheckRow checked={delivery} onChange={() => setDelivery((v) => !v)} label="Hace envíos" />
          </FilterGroup>
          <FilterGroup title="Destacar">
            <CheckRow checked={soloVerificados} onChange={() => setSoloVerificados((v) => !v)} label="Solo verificados" />
            <CheckRow checked={soloDestacados} onChange={() => setSoloDestacados((v) => !v)} label="Solo destacados" />
          </FilterGroup>

          <Link href="/particulares" className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-3.5 py-3 text-xs transition hover:border-[var(--accent)]">
            <span><span className="font-bold text-[var(--text)]">🙋 De particulares</span><br /><span className="text-[var(--muted)]">Venta entre vecinos</span></span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          </Link>
        </aside>

        {/* ── Resultados ── */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar negocio…"
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-[var(--muted2)] focus:border-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {([["", "Todo"], ["ahora", "Ahora"], ["esta-noche", "Esta noche"]] as const).map(([value, label]) => (
                <button key={value} type="button" onClick={() => setMode(value)} className={`shrink-0 rounded-full border px-4 py-2 font-black uppercase tracking-wide transition-colors ${mode === value ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]"}`}>
                  {label}
                </button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-2 text-xs text-[var(--muted)]">
              Ordenar
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-lg border border-[var(--line-strong)] bg-[var(--ov-05)] px-2.5 py-2 text-xs font-bold text-[var(--text)] outline-none focus:border-[var(--accent)]">
                <option value="destacado">Relevancia</option>
                <option value="rating">Mejor valorados</option>
                <option value="reciente">Actualizados recién</option>
              </select>
            </label>
          </div>

          {/* Chips de rubro para mobile (sin sidebar ahí) */}
          <div className="custom-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {CATEGORIES.map((c: any) => (
              <button key={c.id} onClick={() => toggleCat(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-colors ${cats.includes(c.id) ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] text-[var(--muted)]"}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-[var(--muted)]">
            {total} {total === 1 ? "negocio" : "negocios"}{buscando && <span className="ml-2 text-[var(--muted2)]">buscando...</span>}
          </p>

          <div className="mt-3 space-y-3">
            {list.map((b: any) => {
              const isOpen = !!b.open;
              const isVerified = b.status === "verificado";
              const rating = Number(b.rating || 0);
              const cat = CATEGORIES.find((c: any) => c.id === b.category);
              return (
                <Link key={b.id} href={`/negocio/${b.slug}`}
                  className="group flex gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3.5 transition hover:border-[var(--accent)]/50 sm:p-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                    {b.portada_url ? (
                      <Image src={b.portada_url} alt={b.name} fill quality={85} sizes="112px" className="object-cover" />
                    ) : (
                      <CategoryCover category={b.category} seed={String(b.id || b.slug)} className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-bold text-[var(--text)] transition group-hover:text-[var(--accent)] sm:text-base">{b.name}</h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-[var(--muted)]">
                          <RankedAvatar slug={b.slug} name={b.name} categoria={b.category} size={16} />
                          <span className="capitalize">{cat?.name || b.category}{b.address ? ` · ${b.address}` : ""}</span>
                        </p>
                      </div>
                      <div className="shrink-0"><FavoriteButton itemType="business" itemId={b.id} /></div>
                    </div>

                    {rating > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
                        <span className="font-bold text-[var(--warn)]">★ {rating.toFixed(1)}</span>
                        <span>({b.reviews || 0} reseñas)</span>
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {isVerified && <span className="rounded-md bg-[var(--ok)]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--ok)]">✓ Verificado</span>}
                      {b.destacado && <span className="rounded-md bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">🔥 Destacado</span>}
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${isOpen ? "bg-[var(--ok)]/15 text-[var(--ok)]" : "bg-[var(--bad)]/15 text-[var(--bad)]"}`}>{isOpen ? "Abierto" : "Cerrado"}</span>
                      {b.hace_envios && <span className="rounded-md bg-sky-500/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--place)]">🚚 Envíos</span>}
                    </div>

                    {b.description && <p className="mt-2 line-clamp-1 text-xs text-[var(--muted)] sm:line-clamp-2">{b.description}</p>}
                  </div>

                  {b.whatsapp && (
                    <a
                      onClick={(e) => e.stopPropagation()}
                      href={`https://wa.me/${String(b.whatsapp).replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, vi ${b.name} en La Gran Barata Digital`)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="hidden shrink-0 items-center gap-1.5 self-center rounded-xl bg-green-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-green-600 sm:flex"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                </Link>
              );
            })}
          </div>

          {!buscando && list.length === 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface)] p-8 text-center">
              <p className="font-display text-xl uppercase tracking-tight text-[var(--text)]">No encontramos exactamente eso.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Estamos incorporando negocios de esta categoría. ¿Tenés uno? Sumalo.</p>
            </div>
          )}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button onClick={cargarMas} disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] px-6 py-3 text-xs font-black uppercase tracking-widest text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] disabled:opacity-50">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? "Cargando..." : `Cargar más (${total - list.length} restantes)`}
              </button>
            </div>
          )}

          {/* Recomendados: mejor valorados de la plataforma, siempre
              presentes -- para que la pantalla nunca quede vacía de
              descubrimiento aunque el filtro puesto dé pocos resultados. */}
          {recomendados.length > 0 && (
            <div className="mt-12 border-t border-[var(--line)] pt-8">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[.2em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>Los mejor valorados de San Lorenzo</p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {recomendados.map((b: any) => (
                  <Link key={b.id} href={`/negocio/${b.slug}`}
                    className="group flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-3 transition hover:border-[var(--accent)]/50">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      {b.portada_url ? (
                        <Image src={b.portada_url} alt={b.name} fill quality={80} sizes="56px" className="object-cover" />
                      ) : (
                        <CategoryCover category={b.category} seed={String(b.id || b.slug)} className="h-full w-full" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[var(--text)] transition group-hover:text-[var(--accent)]">{b.name}</p>
                      <p className="text-xs font-bold text-[var(--warn)]">★ {Number(b.rating).toFixed(1)} <span className="font-normal text-[var(--muted)]">({b.reviews || 0})</span></p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
