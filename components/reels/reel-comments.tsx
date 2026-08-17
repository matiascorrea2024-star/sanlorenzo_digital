"use client";
import { useEffect, useState } from "react";
import { X, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

type Comment = { id: string; sender_name: string; body: string; created_at: string };

export default function ReelComments({ reelId, onClose, onCommentAdded }: {
  reelId: string;
  onClose: () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Vecino");
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: prof } = await supabase().from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        setUserName(prof?.display_name || user.email?.split("@")[0] || "Vecino");
      }
      const { data } = await supabase().from("reel_comments")
        .select("id, sender_name, body, created_at").eq("reel_id", reelId).eq("hidden", false)
        .order("created_at", { ascending: false });
      setComments(data || []);
    })();
  }, [reelId]);

  const enviar = async () => {
    if (!text.trim()) return;
    if (!userId) { window.location.href = "/login"; return; }
    setSending(true);
    const body = text.trim().slice(0, 300);
    const { error } = await supabase().from("reel_comments").insert({
      reel_id: reelId, user_id: userId, sender_name: userName, body,
    });
    setSending(false);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo publicar el comentario.")}`, "error"); return; }
    setComments((prev) => [{ id: crypto.randomUUID(), sender_name: userName, body, created_at: new Date().toISOString() }, ...prev]);
    setText("");
    onCommentAdded();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[70vh] rounded-t-[1.75rem] border-t border-white/[.08] bg-[#141018] p-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex max-h-[70vh] flex-col rounded-t-[1.375rem] border border-white/[.05] bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-black text-white">Comentarios ({comments.length})</p>
            <button onClick={onClose} aria-label="Cerrar" className="rounded-full bg-white/10 p-1.5 hover:bg-white/20">
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/40">Sé el primero en comentar.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5">
                  <Avatar name={c.sender_name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><span className="font-bold text-white">{c.sender_name}</span> <span className="text-white/80">{c.body}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviar()}
              placeholder="Agregá un comentario..."
              maxLength={300}
              className="flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:border-orange-400"
            />
            <button onClick={enviar} disabled={sending || !text.trim()} aria-label="Enviar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 disabled:opacity-50">
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
