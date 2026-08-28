"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Store, Tag, Grid3x3, Flame, Package } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import NotifyMeButton from "@/components/offers/notify-me-button";

export default function SmartSearch({ className = "", placeholder = "Buscá cualquier cosa en San Lorenzo...", onPlainSearch, shortcutSlash = false }: {
  className?: string; placeholder?: string;
  /** Si se pasa, un submit de texto libre (sin ir a un ítem puntual) llama a esto en vez de navegar a /negocios. */
  onPlainSearch?: (q: string) => void;
  /** Foco con la tecla "/" cuando no hay otro input activo (para usar en la hero). */
  shortcutSlash?: boolean;
}) {
  const router = useRouter();
  const { trackSearch } = useAnalytics();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [sinResultados, setSinResultados] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const secuencia = useRef(0);

  useEffect(() => {
    if (!shortcutSlash) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (e.key === "/" && tag !== "input" && tag !== "textarea" && tag !== "select") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutSlash]);

  useEffect(() => {
    try {
      const r = localStorage.getItem("sld-recent");
      if (r) setRecent(JSON.parse(r));
    } catch {}
    // Cargar ciudades activas
    supabase().from("locations").select("name, slug").eq("type", "city").then(({ data }) => {
      if (data) setCiudades(data);
    });
  }, []);

  // Buscar productos, ofertas y negocios cuando el query cambia -- todo
  // server-side. Antes los negocios se matcheaban filtrando en el
  // celular un array con TODOS los negocios activos bajados de una,
  // en cada tecleo, en cada página del sitio (este buscador está en
  // el header, se monta en todos lados).
  useEffect(() => {
    const lower = q.toLowerCase().trim();
    if (lower.length < 2) {
      setProductos([]);
      setOfertas([]);
      setNegocios([]);
      setBuscando(false);
      setSinResultados(false);
      return;
    }
    setBuscando(true);
    setSinResultados(false);
    // Si el usuario tipea rápido, una respuesta vieja puede llegar
    // después de una más nueva y pisar el resultado correcto -- este
    // contador descarta cualquier respuesta que no sea la última pedida.
    const miSecuencia = ++secuencia.current;
    const timer = setTimeout(async () => {
      const [{ data: prods }, { data: offs }, { data: biz }] = await Promise.all([
        supabase().from("products").select("*, businesses(name, slug)").ilike("name", `%${lower}%`).eq("active", true).eq("hidden_by_plan", false).limit(4),
        supabase().from("offers_with_business").select("*").ilike("title", `%${lower}%`).eq("active", true).limit(3),
        supabase().from("businesses").select("id, name, slug, category")
          .in("status", ["verificado", "reclamado"]).eq("activo", true)
          .or(`name.ilike.%${lower}%,category.ilike.%${lower}%`).limit(4),
      ]);
      if (miSecuencia !== secuencia.current) return;
      setProductos(prods || []);
      setOfertas(offs || []);
      setNegocios(biz || []);
      setBuscando(false);

      const hayCategoria = CATEGORIES.some((c) => c.name.toLowerCase().includes(lower));
      const vacio = !(prods && prods.length) && !(offs && offs.length) && !(biz && biz.length) && !hayCategoria;
      setSinResultados(vacio);
      if (vacio) trackSearch(lower, 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [q, trackSearch]);

  // Entrada real del dropdown -- antes aparecía instantáneo, se sentía
  // como un <select> más. Un fade+rise corto comunica "esto reaccionó".
  useGSAP(() => {
    if (!open || !dropRef.current) return;
    gsap.fromTo(dropRef.current, { opacity: 0, y: -8, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out" });
  }, { dependencies: [open] });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const lower = q.toLowerCase().trim();
  
  // Parsing inteligente de query: "pizza en san lorenzo centro"
  const parsedQuery = (() => {
    const parts = lower.split(/\s+(?:en|de|cerca|near)\s+/i);
    const query = parts[0];
    const location = parts[1] || "";
    
    // Detectar ciudad mencionada
    const cityMatch = ciudades.find(c => 
      location.includes(c.name.toLowerCase()) || location.includes(c.slug)
    );
    
    return { query, location, city: cityMatch };
  })();

  // negocios ya viene filtrado y limitado desde el servidor (ver el
  // useEffect de arriba) -- acá solo queda decidir si mostrarlo.
  const matchedBiz = lower ? negocios : [];
  const matchedCats = lower ? CATEGORIES.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 3) : [];

  const go = (url: string, term?: string) => {
    if (term) {
      const newR = [term, ...recent.filter(r => r !== term)].slice(0, 5);
      setRecent(newR);
      try { localStorage.setItem("sld-recent", JSON.stringify(newR)); } catch {}
    }
    setOpen(false);
    setQ("");
    router.push(url);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    const newR = [term, ...recent.filter((r) => r !== term)].slice(0, 5);
    setRecent(newR);
    try { localStorage.setItem("sld-recent", JSON.stringify(newR)); } catch {}
    setOpen(false);
    if (onPlainSearch) { onPlainSearch(term); return; }
    // Si detectó ciudad, ir a esa ciudad con query
    if (parsedQuery.city) {
      go(`/${parsedQuery.city.slug}?q=${encodeURIComponent(parsedQuery.query)}`);
    } else {
      go("/negocios?q=" + encodeURIComponent(term));
    }
  };

  return (
    <div ref={boxRef} className={`relative w-full ${className}`}>
      <form onSubmit={onSubmit} className="hero-search rounded-[1.5rem] border border-[var(--line-strong)] bg-[var(--ov-03)] p-1 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 rounded-[1.25rem] border border-[var(--line)] bg-[var(--surface)]/90 pr-1 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <div className="pl-2.5 text-[var(--accent-ink)] sm:pl-3"><Search className="h-4 w-4 sm:h-5 sm:w-5" /></div>
        <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Buscar ofertas, productos y negocios"
          className="w-full min-w-0 bg-transparent px-2 py-3 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] md:text-base" />
        {shortcutSlash && !q && (
          <kbd className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--ov-05)] text-[10px] font-bold text-[var(--muted2)] md:flex">/</kbd>
        )}
        {q && (
          <button type="button" onClick={() => setQ("")} className="shrink-0 text-[var(--muted)] hover:text-[var(--text)]">
            <X className="h-4 w-4" />
          </button>
        )}
        <button aria-label="Buscar" className="group/btn m-1 flex shrink-0 items-center gap-2 rounded-full bg-[var(--accent)] py-2.5 pl-3 pr-1 text-sm font-black transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-95 active:scale-[0.97] sm:pl-5 sm:pr-2">
          <span className="hidden sm:inline">Buscar</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover/btn:translate-x-0.5"><Search className="h-3 w-3" /></span>
        </button>
      </div>
      </form>

      {open && (lower || recent.length) && (
        <div ref={dropRef} className="absolute left-0 right-0 z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface2)] p-3 shadow-2xl">
          {buscando && (
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ink)]/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" /> Buscando...
            </p>
          )}
          {parsedQuery.city && (
            <div className="mb-3 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30 p-3">
              <p className="text-xs text-[var(--accent-ink)] font-bold">📍 Buscando en {parsedQuery.city.name}</p>
            </div>
          )}
          
          {productos.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]"><Package className="h-3 w-3" /> Productos</p>
              {productos.map(p => (
                <button key={p.id} onClick={() => go(`/negocio/${p.businesses.slug}`, p.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--ov-05)]">
                  <Package className="h-4 w-4 text-[var(--accent-ink)]" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-[var(--accent-ink)] font-bold">${p.price.toLocaleString("es-AR")}</span>
                </button>
              ))}
            </div>
          )}

          {ofertas.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]"><Flame className="h-3 w-3" /> Ofertas</p>
              {ofertas.map(o => (
                <button key={o.id} onClick={() => go(`/oferta/${o.id}`, o.title)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--ov-05)]">
                  <Flame className="h-4 w-4 text-[var(--bad)]" />
                  <span className="flex-1 truncate">{o.title}</span>
                  {o.discount_percent && <span className="text-xs text-[var(--bad)] font-bold">-{o.discount_percent}%</span>}
                </button>
              ))}
            </div>
          )}

          {matchedBiz.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]"><Store className="h-3 w-3" /> Negocios</p>
              {matchedBiz.map(b => (
                <button key={b.id} onClick={() => go(`/negocio/${b.slug}`, b.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--ov-05)]">
                  <Store className="h-4 w-4 text-[var(--accent-ink)]" />
                  <span className="flex-1">{b.name}</span>
                  <span className="text-xs capitalize text-[var(--muted2)]">{b.category}</span>
                </button>
              ))}
            </div>
          )}
          
          {matchedCats.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]"><Grid3x3 className="h-3 w-3" /> Categorías</p>
              {matchedCats.map(c => (
                <button key={c.id} onClick={() => go(`/negocios?cat=${c.id}`, c.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--ov-05)]">
                  <Tag className="h-4 w-4 text-[var(--accent-ink)]" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {!buscando && sinResultados && lower.length >= 2 && (
            <div className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--ov-05)] p-3">
              <p className="text-sm font-bold">No encontramos &ldquo;{q.trim()}&rdquo; todavía.</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Si algún comercio publica algo así, te avisamos.</p>
              <NotifyMeButton
                searchQuery={lower}
                label="🔔 Avisame cuando aparezca"
                className="mt-2.5 w-full text-center"
              />
            </div>
          )}

          {!lower && recent.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Búsquedas recientes</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map(r => (
                  <button key={r} onClick={() => { setQ(r); go(`/negocios?q=${encodeURIComponent(r)}`, r); }}
                    className="rounded-full border border-[var(--line-strong)] bg-[var(--ov-05)] px-3 py-1 text-xs hover:border-[var(--accent)]/50">
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
