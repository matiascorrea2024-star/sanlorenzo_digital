"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { planDe } from "@/lib/plans";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

export default function ReviewModeration({ businessId, plan }: { businessId: string; plan?: string }) {
  const { show } = useToast();
  const puedeResponder = planDe({ plan }).responderResenas;
  const [list, setList] = useState<any[] | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase().from("business_reviews").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setList(data || []);
  };
  useEffect(() => { load(); }, [businessId]);

  const toggleHidden = async (id: string, hidden: boolean) => {
    const { error } = await supabase().from("business_reviews").update({ hidden: !hidden }).eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar la reseña.")}`, "error"); return; }
    load();
  };

  const sendReply = async (id: string) => {
    const reply = (replyDraft[id] || "").trim();
    if (!reply) return;
    const { error } = await supabase().from("business_reviews").update({ reply, replied_at: new Date().toISOString() }).eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo guardar la respuesta.")}`, "error"); return; }
    setReplyDraft((d) => ({ ...d, [id]: "" }));
    load();
  };

  if (list === null) return null;
  const visibles = list.filter((r) => !r.hidden);
  const ocultas = list.filter((r) => r.hidden);

  return (
    <section className="mt-6 rounded-2xl border border-orange-400/20 bg-gradient-to-b from-white/[.07] to-white/[.03] p-6 shadow-xl shadow-orange-500/10">
      <h2 className="mb-4 text-lg font-black tracking-tight bg-gradient-to-r from-orange-300 to-pink-300 bg-clip-text text-transparent">⭐ Reseñas de clientes</h2>
      {list.length === 0 && <p className="text-sm text-white/50">Cuando un cliente deje una reseña, la vas a poder moderar desde acá.</p>}
      {visibles.length > 0 && (
        <div className="grid gap-3">
          {visibles.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{r.reviewer_name}</p>
                <span className="text-sm text-yellow-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-white/70">{r.comment}</p>}
              {r.reply ? (
                <div className="mt-2 rounded-lg border-l-4 border-orange-400 bg-orange-500/10 p-2">
                  <p className="text-[11px] font-bold text-orange-300">↳ Tu respuesta</p>
                  <p className="text-xs text-white/70">{r.reply}</p>
                </div>
              ) : puedeResponder ? (
                <div className="mt-2 flex gap-2">
                  <input
                    value={replyDraft[r.id] || ""}
                    onChange={(e) => setReplyDraft((d) => ({ ...d, [r.id]: e.target.value }))}
                    placeholder="Responder públicamente…"
                    className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-orange-400"
                  />
                  <button onClick={() => sendReply(r.id)} className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/30">Responder</button>
                </div>
              ) : (
                <Link href="/dashboard/planes" className="mt-2 flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300">
                  <Lock className="h-3 w-3" /> Responder reseñas es de Plan PRO -- mejorar plan →
                </Link>
              )}
              <button onClick={() => toggleHidden(r.id, r.hidden)} className="mt-2 text-xs text-white/40 hover:text-red-400">Ocultar de mi miniweb</button>
            </div>
          ))}
        </div>
      )}
      {ocultas.length > 0 && (
        <>
          <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-white/40">Ocultas ({ocultas.length})</p>
          <div className="grid gap-2">
            {ocultas.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/10 p-3 opacity-60">
                <p className="text-sm">{r.reviewer_name} · <span className="text-yellow-400">{"★".repeat(r.rating)}</span></p>
                <button onClick={() => toggleHidden(r.id, r.hidden)} className="text-xs text-white/50 hover:text-white">Volver a mostrar</button>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
