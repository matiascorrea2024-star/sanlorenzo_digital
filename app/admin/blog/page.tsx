"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Newspaper, Plus, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

const emptyDraft = { id: null as string | null, title: "", excerpt: "", content: "", cover_url: "", author: "", published: false };

export default function AdminBlogPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargar = async () => {
    const { data } = await supabase().from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase().from("user_profiles").select("role").eq("user_id", user.id).maybeSingle();
      if (prof?.role !== "admin") { router.push("/"); return; }
      setReady(true);
      await cargar();
    })();
  }, []);

  const nuevo = () => { setDraft(emptyDraft); setEditing(true); setError(""); };
  const editar = (p: any) => { setDraft(p); setEditing(true); setError(""); };

  const guardar = async () => {
    if (!draft.title.trim() || !draft.content.trim()) { setError("Título y contenido son obligatorios."); return; }
    setSaving(true);
    setError("");
    try {
      const slug = slugify(draft.title);
      if (draft.id) {
        const { error: err } = await supabase().from("blog_posts").update({
          title: draft.title, slug, excerpt: draft.excerpt, content: draft.content,
          cover_url: draft.cover_url || null, author: draft.author || null, published: draft.published,
          updated_at: new Date().toISOString(),
        }).eq("id", draft.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase().from("blog_posts").insert({
          title: draft.title, slug, excerpt: draft.excerpt, content: draft.content,
          cover_url: draft.cover_url || null, author: draft.author || null, published: draft.published,
        });
        if (err) throw err;
      }
      setEditing(false);
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el artículo.");
    } finally {
      setSaving(false);
    }
  };

  const togglePublicado = async (p: any) => {
    await supabase().from("blog_posts").update({ published: !p.published }).eq("id", p.id);
    await cargar();
  };

  const borrar = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await supabase().from("blog_posts").delete().eq("id", id);
    await cargar();
  };

  if (!ready) return <main className="min-h-screen bg-[#0c0a0b]" />;

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/admin?tab=blog" className="text-sm text-orange-400 hover:text-orange-300">← Volver al panel</Link>
        <div className="mt-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}><Newspaper className="h-7 w-7 text-orange-300" /> Blog</h1>
          {!editing && (
            <button onClick={nuevo} className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-black hover:opacity-90">
              <Plus className="h-4 w-4" /> Nuevo artículo
            </button>
          )}
        </div>

        {editing ? (
          <div className="mt-6 rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
          <div className="space-y-4 rounded-[1.375rem] border border-white/[.05] bg-black/10 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Título" className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 font-bold outline-none focus:border-orange-400" />
            <input value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              placeholder="Copete corto (aparece en la lista)" className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            <textarea value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="Contenido del artículo" rows={10}
              className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm outline-none focus:border-orange-400" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={draft.cover_url} onChange={(e) => setDraft({ ...draft, cover_url: e.target.value })}
                placeholder="URL de imagen de portada (opcional)" className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
              <input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })}
                placeholder="Autor (opcional)" className="rounded-xl border border-white/15 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={draft.published} onChange={(e) => setDraft({ ...draft, published: e.target.checked })} />
              Publicado (visible en /blog)
            </label>
            {error && <p className="text-sm text-red-300">❌ {error}</p>}
            <div className="flex gap-2">
              <button onClick={guardar} disabled={saving}
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-black hover:opacity-90 disabled:opacity-50">
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button onClick={() => setEditing(false)} className="rounded-full border border-white/20 px-6 py-2.5 text-sm font-bold text-white/70 hover:bg-white/5">
                Cancelar
              </button>
            </div>
          </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-8 rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-10 text-center">
              <Newspaper className="mx-auto h-10 w-10 text-white/20" />
              <p className="mt-3 text-sm text-white/40">Todavía no escribiste ningún artículo.</p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-2.5">
            {posts.map(p => (
              <div key={p.id} className="rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5">
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/[.05] bg-black/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{p.title}</p>
                  <p className="text-xs text-white/50">{p.published ? "✅ Publicado" : "⏸️ Borrador"} · {new Date(p.created_at).toLocaleDateString("es-AR")}</p>
                </div>
                <button onClick={() => togglePublicado(p)} title={p.published ? "Despublicar" : "Publicar"}
                  className="rounded-lg border border-white/15 p-2 text-white/60 hover:bg-white/10">
                  {p.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => editar(p)} className="rounded-lg border border-white/15 p-2 text-white/60 hover:bg-white/10">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => borrar(p.id)} className="rounded-lg border border-red-500/30 p-2 text-red-300 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
