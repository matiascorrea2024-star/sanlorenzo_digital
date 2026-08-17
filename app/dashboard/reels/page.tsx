"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Video, Eye, Heart, MessageCircle, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function DashboardReelsPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses").select("id").eq("owner_id", user.id);
      const ids = (biz || []).map((b) => b.id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data } = await supabase().from("reels")
        .select("id, video_url, caption, views_count, likes_count, comments_count, active, created_at")
        .in("business_id", ids).order("created_at", { ascending: false });
      setReels(data || []);
      setLoading(false);
    })();
  }, [user]);

  const toggleActive = async (r: any) => {
    const { error } = await supabase().from("reels").update({ active: !r.active }).eq("id", r.id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar.")}`, "error"); return; }
    setReels((prev) => prev.map((x) => x.id === r.id ? { ...x, active: !x.active } : x));
  };

  const eliminar = async (id: string) => {
    if (!confirm("¿Eliminar este reel? No se puede deshacer.")) return;
    const { error } = await supabase().from("reels").delete().eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo eliminar.")}`, "error"); return; }
    setReels((prev) => prev.filter((x) => x.id !== id));
  };

  if (loading) return <main className="min-h-screen bg-[#0c0a0b] flex items-center justify-center text-white">Cargando...</main>;

  return (
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <Video className="mt-1 h-8 w-8 shrink-0 text-orange-400" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Video corto</p>
              <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Mis reels</h1>
              <p className="mt-3 text-white/50">Videos cortos de tu negocio.</p>
            </div>
          </div>
          <Link href="/dashboard/reels/nueva" className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2.5 text-sm font-black hover:opacity-90">
            <Plus className="h-4 w-4" /> Nuevo
          </Link>
        </div>

        {reels.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/[.06] bg-white/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-white/[.05] bg-black/10 p-10 text-center shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
              <Video className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="font-bold">Todavía no subiste ningún reel.</p>
              <p className="mt-1 text-sm text-white/50">Mostrá tus productos en video -- se comparten mucho más que una foto.</p>
              <Link href="/dashboard/reels/nueva" className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-2.5 text-sm font-black hover:opacity-90">
                Subir mi primer reel
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {reels.map((r) => (
              <div key={r.id} className={`rounded-[1.5rem] border border-white/[.06] bg-white/[.02] p-1.5 ${r.active === false ? "opacity-50" : ""}`}>
                <div className="rounded-[1.1rem] border border-white/[.05] bg-black/10 p-1 shadow-[inset_0_1px_1px_rgba(255,255,255,.06)]">
                  <video src={r.video_url} className="h-52 w-full rounded-[.85rem] object-cover" muted playsInline preload="metadata" />
                  <div className="p-3">
                    {r.caption && <p className="mb-2 truncate text-sm text-white/80">{r.caption}</p>}
                    <div className="flex items-center gap-3 text-xs text-white/50">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {r.views_count}</span>
                      <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {r.likes_count}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {r.comments_count}</span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => toggleActive(r)}
                        className="flex-1 rounded-full border border-white/15 py-1.5 text-xs font-bold text-white/70 hover:bg-white/5">
                        {r.active === false ? "Mostrar" : "Ocultar"}
                      </button>
                      <button onClick={() => eliminar(r.id)}
                        className="rounded-full bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/25" aria-label="Eliminar">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
