"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Store, Tag, Grid3x3, MapPin, Flame, Package } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CATEGORIES } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export default function SmartSearch({ className = "", placeholder = "Buscá cualquier cosa en San Lorenzo...", onPlainSearch, shortcutSlash = false }: {
  className?: string; placeholder?: string;
  /** Si se pasa, un submit de texto libre (sin ir a un ítem puntual) llama a esto en vez de navegar a /negocios. */
  onPlainSearch?: (q: string) => void;
  /** Foco con la tecla "/" cuando no hay otro input activo (para usar en la hero). */
  shortcutSlash?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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
      return;
    }
    setBuscando(true);
    const timer = setTimeout(async () => {
      const { data: prods } = await supabase().from("products").select("*, businesses(name, slug)").ilike("name", `%${lower}%`).eq("active", true).limit(4);
      setProductos(prods || []);
      const { data: offs } = await supabase().from("offers_with_business").select("*").ilike("title", `%${lower}%`).eq("active", true).limit(3);
      setOfertas(offs || []);
      const { data: biz } = await supabase().from("businesses").select("id, name, slug, category")
        .in("status", ["verificado", "reclamado"]).eq("activo", true)
        .or(`name.ilike.%${lower}%,category.ilike.%${lower}%`).limit(4);
      setNegocios(biz || []);
      setBuscando(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

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
      <form onSubmit={onSubmit} className="rounded-[1.5rem] border border-white/15 bg-white/[.03] p-1 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-2 rounded-[1.25rem] border border-white/10 bg-black/70 pr-1 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
        <div className="pl-3 text-orange-400"><Search className="h-5 w-5" /></div>
        <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-3 text-sm outline-none placeholder:text-white/50 md:text-base" />
        {shortcutSlash && !q && (
          <kbd className="mr-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/5 text-[10px] font-bold text-white/40 md:flex">/</kbd>
        )}
        {q && (
          <button type="button" onClick={() => setQ("")} className="text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
        <button className="group/btn m-1 flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-2.5 pl-5 pr-2 text-sm font-black transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:opacity-95 active:scale-[0.97]">
          Buscar
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/15 transition-transform duration-300 group-hover/btn:translate-x-0.5"><Search className="h-3 w-3" /></span>
        </button>
      </div>
      </form>

      {open && (lower || recent.length) && (
        <div ref={dropRef} className="absolute left-0 right-0 z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#1c1819] p-3 shadow-2xl">
          {buscando && (
            <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-orange-300/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" /> Buscando...
            </p>
          )}
          {parsedQuery.city && (
            <div className="mb-3 rounded-xl bg-orange-500/10 border border-orange-400/30 p-3">
              <p className="text-xs text-orange-300 font-bold">📍 Buscando en {parsedQuery.city.name}</p>
            </div>
          )}
          
          {productos.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40"><Package className="h-3 w-3" /> Productos</p>
              {productos.map(p => (
                <button key={p.id} onClick={() => go(`/negocio/${p.businesses.slug}`, p.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5">
                  <Package className="h-4 w-4 text-orange-400" />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-xs text-orange-400 font-bold">${p.price.toLocaleString("es-AR")}</span>
                </button>
              ))}
            </div>
          )}

          {ofertas.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40"><Flame className="h-3 w-3" /> Ofertas</p>
              {ofertas.map(o => (
                <button key={o.id} onClick={() => go(`/oferta/${o.id}`, o.title)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5">
                  <Flame className="h-4 w-4 text-red-400" />
                  <span className="flex-1 truncate">{o.title}</span>
                  {o.discount_percent && <span className="text-xs text-red-400 font-bold">-{o.discount_percent}%</span>}
                </button>
              ))}
            </div>
          )}

          {matchedBiz.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40"><Store className="h-3 w-3" /> Negocios</p>
              {matchedBiz.map(b => (
                <button key={b.id} onClick={() => go(`/negocio/${b.slug}`, b.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5">
                  <Store className="h-4 w-4 text-orange-400" />
                  <span className="flex-1">{b.name}</span>
                  <span className="text-xs capitalize text-white/40">{b.category}</span>
                </button>
              ))}
            </div>
          )}
          
          {matchedCats.length > 0 && (
            <div className="mb-3">
              <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40"><Grid3x3 className="h-3 w-3" /> Categorías</p>
              {matchedCats.map(c => (
                <button key={c.id} onClick={() => go(`/negocios?cat=${c.id}`, c.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/5">
                  <Tag className="h-4 w-4 text-orange-400" />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          )}
          
          {!lower && recent.length > 0 && (
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">Búsquedas recientes</p>
              <div className="flex flex-wrap gap-1.5">
                {recent.map(r => (
                  <button key={r} onClick={() => { setQ(r); go(`/negocios?q=${encodeURIComponent(r)}`, r); }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs hover:border-orange-400/50">
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
