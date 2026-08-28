"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { Megaphone, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

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
  const { show } = useToast();
  const [negocio, setNegocio] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [form, setForm] = useState({ type: "oferta", title: "", body: "", image_url: "" });
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (bizId: string) => {
    const { data } = await supabase().from("muro_posts")
      .select("*").eq("business_id", bizId).order("created_at", { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("*").eq("owner_id", user.id).order("name").limit(1).maybeSingle();
      if (biz) { setNegocio(biz); await load(biz.id); }
      setLoading(false);
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
    if (error) {
      show(`❌ ${friendlyError(error, "No se pudo publicar. Probá de nuevo.")}`, "error");
    } else {
      setForm({ type: "oferta", title: "", body: "", image_url: "" });
      await load(negocio.id);
    }
    setSending(false);
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar esta publicación?")) return;
    const { error } = await supabase().from("muro_posts").delete().eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo eliminar la publicación.")}`, "error"); return; }
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-2xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-8 flex items-start gap-3">
          <Megaphone className="mt-1 h-8 w-8 shrink-0 text-[var(--accent-ink)]" />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent-ink)]">Comunidad</p>
            <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Publicar en el muro</h1>
            <p className="mt-3 text-[var(--muted)]">Compartí novedades con toda la comunidad.</p>
          </div>
        </div>

        {loading ? (
          <p className="py-16 text-center text-[var(--muted)]">Cargando…</p>
        ) : !negocio ? (
          <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center text-[var(--muted)]">
              Necesitás un negocio para publicar en el muro.
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <div className="flex flex-wrap gap-2 mb-4">
                {TIPOS.map(t => (
                  <button key={t.k} onClick={() => setForm({ ...form, type: t.k })}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      form.type === t.k ? "bg-[var(--accent)] text-white" : "border border-[var(--line-strong)] bg-[var(--ov-05)] text-[var(--text)]/70"
                    }`}>
                    {t.l}
                  </button>
                ))}
              </div>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Título de la publicación *"
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Contale a la comunidad..." rows={3}
                className="mt-3 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="URL de imagen (opcional)"
                className="mt-3 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              <button onClick={publish} disabled={sending || !form.title}
                className="mt-4 w-full rounded-full bg-[var(--accent)] py-3 text-sm font-black disabled:opacity-50">
                {sending ? "Publicando..." : "📢 Publicar en el muro"}
              </button>
            </div>
            </div>

            <h2 className="mb-3 mt-10 text-lg font-black" style={{ fontFamily: "var(--font-space)" }}>Mis publicaciones ({posts.length})</h2>
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
                <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <div className="flex-1">
                    <p className="font-bold">{p.title}</p>
                    <p className="text-xs text-[var(--muted)] capitalize">{p.type} · ❤️ {p.likes || 0}</p>
                  </div>
                  <button onClick={() => del(p.id)} className="rounded-lg bg-[var(--bad)]/20 p-2 hover:bg-[var(--bad)]/30">
                    <Trash2 className="h-4 w-4 text-[var(--bad)]" />
                  </button>
                </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
