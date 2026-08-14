"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Flame, Sparkles, PartyPopper, Store, Package, Megaphone, Share2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAllBusinesses } from "@/lib/use-businesses";
import { BUSINESSES as demoBusinesses } from "@/lib/data";
import Avatar from "@/components/ui/avatar";
import RankedAvatar from "@/components/ui/ranked-avatar";
import Badge from "@/components/ui/badge";

const TIPOS: Record<string, { icon: any; label: string; color: string }> = {
  oferta: { icon: Flame, label: "Oferta", color: "text-red-400 bg-red-500/15 border-red-400/40" },
  novedad: { icon: Sparkles, label: "Novedad", color: "text-sky-400 bg-sky-500/15 border-sky-400/40" },
  evento: { icon: PartyPopper, label: "Evento", color: "text-purple-400 bg-purple-500/15 border-purple-400/40" },
  apertura: { icon: Store, label: "Apertura", color: "text-green-400 bg-green-500/15 border-green-400/40" },
  producto: { icon: Package, label: "Nuevo producto", color: "text-orange-400 bg-orange-500/15 border-orange-400/40" },
  anuncio: { icon: Megaphone, label: "Anuncio", color: "text-yellow-400 bg-yellow-500/15 border-yellow-400/40" },
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `hace ${Math.max(1, Math.floor(s / 60))} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} días`;
}

export default function MuroPage() {
  const negocios = useAllBusinesses();
  const [posts, setPosts] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<string>("todos");
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const l = JSON.parse(localStorage.getItem("sld-muro-likes") || "{}");
      setLiked(l);
    } catch {}
    (async () => {
      const { data } = await supabase().from("muro_posts")
        .select("*").order("created_at", { ascending: false }).limit(50);
      setPosts(data || []);
    })();
  }, []);

  // Posts automáticos desde promos demo (para que el muro tenga vida desde el día 1)
  const demoPosts = (demoBusinesses || []).flatMap((b: any) =>
    (Array.isArray(b.promotions) ? b.promotions : [])
      .filter((p: any) => p.title)
      .map((p: any, i: number) => ({
        id: `demo-${b.slug}-${i}`,
        business_id: b.id,
        business_name: b.name,
        business_slug: b.slug,
        type: "oferta",
        title: p.title,
        body: p.discount ? `Con ${p.discount}% de descuento. ¡Aprovechá antes de que se acabe!` : null,
        image_url: b.portada_url,
        likes: 0,
        created_at: new Date(Date.now() - (i + 2) * 3600000).toISOString(),
        auto: true,
      }))
  );

  // Combinar reales + demo, con nombre del negocio
  const todos = [...posts.map(p => ({
    ...p,
    business_name: (negocios.find((b: any) => b.id === p.business_id) as any)?.name || "Negocio",
    business_slug: (negocios.find((b: any) => b.id === p.business_id) as any)?.slug || "",
  })), ...demoPosts]
    .filter(p => filtro === "todos" || p.type === filtro)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const like = (id: string) => {
    const isLiked = !!liked[id];
    const nuevo = { ...liked, [id]: !isLiked };
    delete nuevo[id === id && isLiked ? id : "__none__"];
    if (isLiked) delete nuevo[id];
    setLiked(nuevo);
    try { localStorage.setItem("sld-muro-likes", JSON.stringify(nuevo)); } catch {}
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1)) } : p));
  };

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">📰 Muro local</h1>
            <p className="text-white/60 mt-1">Lo que está pasando en el comercio de San Lorenzo</p>
          </div>
          <Link href="/dashboard/muro"
            className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-black hover:opacity-90">
            + Publicar
          </Link>
        </div>

        {/* Filtros por tipo */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFiltro("todos")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              filtro === "todos" ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5 text-white/70"
            }`}>
            Todo
          </button>
          {Object.entries(TIPOS).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filtro === k ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5 text-white/70"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          {todos.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/50">
              Todavía no hay publicaciones de este tipo.
            </div>
          )}
          {todos.map(p => {
            const t = TIPOS[p.type] || TIPOS.anuncio;
            const isLiked = !!liked[p.id];
            return (
              <article key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                {/* Header del post */}
                <div className="flex items-center gap-3">
                  <RankedAvatar slug={p.business_slug} name={p.business_name} size={44} />
                  <div className="flex-1">
                    <Link href={`/negocio/${p.business_slug}`} className="font-bold hover:text-orange-400">
                      {p.business_name}
                    </Link>
                    <p className="text-xs text-white/40">{timeAgo(p.created_at)}</p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black ${t.color}`}>
                    <t.icon className="h-3 w-3" /> {t.label}
                  </span>
                </div>

                {/* Contenido */}
                <h2 className="mt-3 text-lg font-black">{p.title}</h2>
                {p.body && <p className="mt-1 text-sm text-white/70 leading-relaxed">{p.body}</p>}
                {p.image_url && (
                  <img src={p.image_url} alt={p.title} loading="lazy"
                    className="mt-3 max-h-72 w-full rounded-xl object-cover" />
                )}

                {/* Acciones */}
                <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3">
                  <button onClick={() => like(p.id)}
                    className={`flex items-center gap-1.5 text-sm font-bold transition ${isLiked ? "text-red-400" : "text-white/60 hover:text-red-400"}`}>
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    {(p.likes || 0) + (isLiked && !p.auto ? 0 : 0)}
                  </button>
                  <Link href={`/negocio/${p.business_slug}`}
                    className="flex items-center gap-1 text-sm font-bold text-white/60 hover:text-orange-400">
                    Ver negocio <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
