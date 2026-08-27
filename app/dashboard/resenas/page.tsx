"use client";
import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function ResenasPage() {
  const { user } = useAuth();
  const { show } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [bizNames, setBizNames] = useState<Record<string, string>>({});
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: biz } = await supabase().from("businesses").select("id, name").eq("owner_id", user.id);
      if (!biz || !biz.length) { setLoading(false); return; }
      const names: Record<string, string> = {};
      biz.forEach(b => { names[b.id] = b.name; });
      setBizNames(names);
      const { data: rev } = await supabase().from("business_reviews")
        .select("*").in("business_id", biz.map(b => b.id)).order("created_at", { ascending: false });
      if (rev) setReviews(rev);
      setLoading(false);
    })();
  }, [user]);

  const saveReply = async (id: string) => {
    const text = (replies[id] || "").trim();
    if (!text) return;
    const { error } = await supabase().from("business_reviews").update({ reply: text, replied_at: new Date().toISOString() }).eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo guardar la respuesta.")}`, "error"); return; }
    setReviews(prev => prev.map(r => r.id === id ? { ...r, reply: text } : r));
    setSaved(prev => ({ ...prev, [id]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [id]: false })), 2000);
  };

  return (
    <main className="bg-[var(--bg)] min-h-screen text-[var(--text)] pb-24">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <DashboardNav />
        <div className="mb-2 flex items-center gap-3">
          <Star className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Reseñas de tus clientes</h1>
            <p className="text-[var(--muted)]">Respondé y demostrá que te importa tu comunidad</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="py-12 text-center text-[var(--muted)]">Cargando reseñas…</p>
          ) : reviews.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center text-[var(--muted)]">
                Aún no tenés reseñas. Cuando un cliente te puntúe, aparece acá.
              </div>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <div className="flex items-center gap-3">
                  <Avatar name={r.reviewer_name} size={40} />
                  <div className="flex-1">
                    <p className="font-bold">{r.reviewer_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i <= r.rating ? "fill-amber-400 text-amber-400" : "text-[var(--muted2)]"}`} />
                        ))}
                      </span>
                      <span className="text-[11px] text-[var(--muted2)]">{bizNames[r.business_id]}</span>
                    </div>
                  </div>
                </div>
                {r.comment && <p className="mt-3 text-sm text-[var(--text)]/80">{r.comment}</p>}

                <div className="mt-4">
                  {r.reply ? (
                    <div className="rounded-xl border-l-4 border-[var(--ok)] bg-[var(--ok)]/10 p-3">
                      <p className="text-xs font-black text-[var(--ok)]">↳ Tu respuesta</p>
                      <p className="mt-1 text-sm text-[var(--text)]/80">{r.reply}</p>
                    </div>
                  ) : (
                    <>
                      <textarea value={replies[r.id] || ""}
                        onChange={(e) => setReplies(prev => ({ ...prev, [r.id]: e.target.value }))}
                        rows={2} placeholder="Respondé al cliente..."
                        className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
                      <button onClick={() => saveReply(r.id)}
                        className="mt-2 rounded-full bg-[var(--accent)] px-5 py-2 text-xs font-black hover:opacity-90">
                        {saved[r.id] ? "✅ Guardada" : "Responder"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
