"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/data";
import { useAllBusinesses } from "@/lib/use-businesses";

const CATEGORY_IMAGES: Record<string, string> = {
  calzado: "https://images.unsplash.com/photo-1495555961986-6d4c1ecb7be3?auto=format&fit=crop&w=900&q=85",
  gastronomia: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85",
  ferreteria: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=900&q=85",
  belleza: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85",
  ropa: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=900&q=85",
  automotor: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
  profesionales: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=85",
  tecnologia: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=85",
};
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=900&q=85";

function NegociosContent() {
  const searchParams = useSearchParams();
  const todos = useAllBusinesses();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [cat, setCat] = useState<string | null>(searchParams.get("cat"));

  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setCat(searchParams.get("cat"));
  }, [searchParams]);

  const list = todos.filter((b) => {
    const okCat = !cat || b.category === cat;
    const okQ = !q.trim() ||
      [b.name, b.description, b.category, ...(b.tags || [])].join(" ").toLowerCase().includes(q.toLowerCase());
    return okCat && okQ;
  });

  const catName = CATEGORIES.find((c) => c.id === cat)?.name;

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300 mb-4 inline-block">← Volver al inicio</Link>
        <h1 className="text-3xl font-black md:text-4xl">
          {catName ? catName : q ? `Resultados para "${q}"` : "Todos los negocios"}
        </h1>
        <p className="text-white/60 mt-1">{list.length} {list.length === 1 ? "negocio encontrado" : "negocios encontrados"}</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 mb-8">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Buscar..." className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-sm outline-none focus:border-orange-400" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setCat(null)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${!cat ? "bg-orange-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>Todos</button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id === cat ? null : c.id)} className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${cat === c.id ? "bg-orange-500 text-white" : "bg-white/5 text-white/70 hover:bg-white/10"}`}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4">
        {list.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-bold">No encontramos resultados</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {list.map((b) => {
              const img = b.portada_url || CATEGORY_IMAGES[b.category] || FALLBACK_IMAGE;
              return (
                <Link key={b.id} href={"/negocio/" + b.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-orange-400/60">
                  <div className="relative h-32">
                    <img src={img} alt={b.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    {b.logo_url && (
                      <img src={b.logo_url} alt="" className="absolute left-3 bottom-3 h-10 w-10 rounded-lg border-2 border-white/20 object-cover" />
                    )}
                    {b.demo ? (
                      <span className="absolute right-3 top-3 rounded-lg bg-orange-500/90 px-2 py-0.5 text-[10px] font-black">DEMO</span>
                    ) : (
                      <span className="absolute right-3 top-3 rounded-lg bg-green-500/90 px-2 py-0.5 text-[10px] font-black">🟢 REAL</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold">{b.name}</p>
                    <p className="mt-0.5 text-xs capitalize text-white/50">{b.category}</p>
                    <p className="mt-2 text-xs text-white/70 truncate">{b.description || "Negocio de San Lorenzo"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function NegociosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center">Cargando...</div>}>
      <NegociosContent />
    </Suspense>
  );
}
