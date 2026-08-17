"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Heart, Flame, Sparkles, PartyPopper, Store, Package, Megaphone, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RankedAvatar from "@/components/ui/ranked-avatar";

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
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);
  // Solo los negocios de los posts ya cargados, no la tabla entera --
  // antes esta página bajaba TODOS los negocios activos únicamente
  // para resolver nombre/slug de un puñado de posts.
  const [negociosMap, setNegociosMap] = useState<Record<string, { name: string; slug: string }>>({});
  const [filtro, setFiltro] = useState<string>("todos");
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      setUser(user);

      const { data } = await supabase().from("muro_posts")
        .select("*").order("created_at", { ascending: false }).limit(50);
      setPosts(data || []);

      if (data && data.length) {
        const ids = [...new Set(data.map((p: any) => p.business_id).filter(Boolean))];
        if (ids.length) {
          const { data: biz } = await supabase().from("businesses").select("id, name, slug").in("id", ids);
          const m: Record<string, { name: string; slug: string }> = {};
          (biz || []).forEach((b: any) => { m[b.id] = { name: b.name, slug: b.slug }; });
          setNegociosMap(m);
        }
      }

      if (user && data && data.length) {
        const { data: misLikes } = await supabase().from("muro_post_likes")
          .select("post_id").eq("user_id", user.id).in("post_id", data.map((p: any) => p.id));
        const l: Record<string, boolean> = {};
        (misLikes || []).forEach((r: any) => { l[r.post_id] = true; });
        setLiked(l);
      }
    })();
  }, []);

  // Posts reales, con nombre del negocio
  const todos = posts.map(p => ({
    ...p,
    business_name: negociosMap[p.business_id]?.name || "Negocio",
    business_slug: negociosMap[p.business_id]?.slug || "",
  }))
    .filter(p => filtro === "todos" || p.type === filtro)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const like = async (id: string) => {
    if (!user) { router.push("/login"); return; }
    if (likingIds.has(id)) return;
    setLikingIds((prev) => new Set(prev).add(id));
    const isLiked = !!liked[id];
    // Update optimista
    setLiked((prev) => ({ ...prev, [id]: !isLiked }));
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1)) } : p));

    const sb = supabase();
    const { error } = isLiked
      ? await sb.from("muro_post_likes").delete().eq("post_id", id).eq("user_id", user.id)
      : await sb.from("muro_post_likes").insert({ post_id: id, user_id: user.id });

    if (error) {
      // Revertir si falla
      setLiked((prev) => ({ ...prev, [id]: isLiked }));
      setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: Math.max(0, (p.likes || 0) + (isLiked ? 1 : -1)) } : p));
    }
    setLikingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-500">En vivo</p>
            <h1 className="mt-2 text-5xl font-black leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Muro <span className="bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">local</span></h1>
            <p className="mt-2 text-white/50">Lo que está pasando en el comercio de San Lorenzo</p>
          </div>
          <Link href="/dashboard/muro"
            className="shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black hover:opacity-90">
            + Publicar
          </Link>
        </div>

        {/* Filtros por tipo */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setFiltro("todos")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
              filtro === "todos" ? "bg-gradient-to-r from-orange-500 to-red-600" : "border border-white/15 bg-white/5 text-white/70"
            }`}>
            Todo
          </button>
          {Object.entries(TIPOS).map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                filtro === k ? "bg-gradient-to-r from-orange-500 to-red-600" : "border border-white/15 bg-white/5 text-white/70"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-4">
          {todos.length === 0 && (
            <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-10 text-center text-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                Todavía no hay publicaciones de este tipo.
              </div>
            </div>
          )}
          {todos.map(p => {
            const t = TIPOS[p.type] || TIPOS.anuncio;
            const isLiked = !!liked[p.id];
            return (
              <article key={p.id} className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-orange-400/20">
              <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
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
                  <div className="relative mt-3 h-72 w-full overflow-hidden rounded-xl">
                    <Image src={p.image_url} alt={p.title} fill sizes="(max-width: 768px) 100vw, 640px" quality={88} className="object-cover" />
                  </div>
                )}

                {/* Acciones */}
                <div className="mt-4 flex items-center gap-4 border-t border-white/10 pt-3">
                  <button onClick={() => like(p.id)} disabled={likingIds.has(p.id)}
                    className={`flex items-center gap-1.5 text-sm font-bold transition disabled:opacity-60 ${isLiked ? "text-red-400" : "text-white/60 hover:text-red-400"}`}>
                    <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                    {p.likes || 0}
                  </button>
                  <Link href={`/negocio/${p.business_slug}`}
                    className="flex items-center gap-1 text-sm font-bold text-white/60 hover:text-orange-400">
                    Ver negocio <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
