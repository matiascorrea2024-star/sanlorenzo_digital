"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Megaphone, Trash2 } from "lucide-react";

const TIPOS = [
  { k: "oferta", l: "🔥 Oferta" },
  { k: "novedad", l: "✨ Novedad" },
  { k: "evento", l: "🎉 Evento" },
  { k: "apertura", l: "🏪 Apertura" },
  { k: "producto", l: "📦 Nuevo producto" },
  { k: "anuncio", l: "📢 Anuncio" },
];

export default function MuroDashboard() {
  const { user } = useAuth();
  const [negocio, setNegocio] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [form, setForm] = useState({ type: "oferta", title: "", body: "", image_url: "" });
  const [sending, setSending] = useState(false);

  const load = async (bizId: string) => {
    const { data } = await supabase().from("muro_posts")
      .select("*").eq("business_id", bizId).order("created_at", { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("*").eq("owner_id", user.id).maybeSingle();
      if (biz) { setNegocio(biz); load(biz.id); }
    })();
  }, [user]);

  const publish = async () => {
    if (!negocio || !form.title) return;
    setSending(true);
    const { error } = await supabase().from("muro_posts").insert({
      business_id: negocio.id,
      type: form.type,
      title: form.title,
      body: form.body || null,
      image_url: form.image_url || null,
    });
    if (!error) {
      setForm({ type: "oferta", title: "", body: "", image_url: "" });
      await load(negocio.id);
    }
    setSending(false);
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    await supabase().from("muro_posts").delete().eq("id", id);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <DashboardNav />
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black">Publicar en el Muro</h1>
            <p className="text-white/60">Compartí novedades con toda la comunidad</p>
          </div>
        </div>

        {!negocio ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
            Necesitás un negocio para publicar en el muro.
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {TIPOS.map(t => (
                  <button key={t.k} onClick={() => setForm({ ...form, type: t.k })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      form.type === t.k ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5 text-white/70"
                    }`}>
                    {t.l}
                  </button>
                ))}
              </div>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título de la publicación *"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Contale a la comunidad..." rows={3}
                className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="URL de imagen (opcional)"
                className="mt-3 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <button onClick={publish} disabled={sending || !form.title}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 py-3 text-sm font-black disabled:opacity-50">
                {sending ? "Publicando..." : "📢 Publicar en el muro"}
              </button>
            </div>

            <h2 className="text-lg font-black mb-3">Mis publicaciones ({posts.length})</h2>
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex-1">
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xs text-white/50 capitalize">{p.type} · ❤️ {p.likes || 0}</p>
                  </div>
                  <button onClick={() => del(p.id)} className="rounded-lg bg-red-500/20 p-2 hover:bg-red-500/30">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
