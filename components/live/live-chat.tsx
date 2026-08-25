"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";
import { Send, Trash2 } from "lucide-react";

type Props = { liveStreamId: string; puedeModerar?: boolean };

export default function LiveChat({ liveStreamId, puedeModerar = false }: Props) {
  const { user } = useAuth();
  const { show } = useToast();
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("Vecino");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data } = await sb.from("live_stream_messages").select("*")
        .eq("live_stream_id", liveStreamId).eq("hidden", false).order("created_at", { ascending: true }).limit(200);
      setMensajes(data || []);
      if (user) {
        const { data: prof } = await sb.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        setNombre(prof?.display_name || (user.email || "Vecino").split("@")[0]);
      }
    })();

    const chan = supabase().channel(`live-chat-${liveStreamId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_stream_messages", filter: `live_stream_id=eq.${liveStreamId}` },
        (payload: any) => setMensajes((prev) => [...prev, payload.new]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_stream_messages", filter: `live_stream_id=eq.${liveStreamId}` },
        (payload: any) => setMensajes((prev) => payload.new.hidden ? prev.filter((m) => m.id !== payload.new.id) : prev))
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [liveStreamId, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length]);

  const enviar = async () => {
    if (!texto.trim() || !user) return;
    const body = texto.trim().slice(0, 300);
    const { error } = await supabase().from("live_stream_messages").insert({
      live_stream_id: liveStreamId, user_id: user.id, sender_name: nombre, body,
    });
    if (error) { show(`❌ ${friendlyError(error, "No se pudo enviar el mensaje.")}`, "error"); return; }
    setTexto("");
  };

  const ocultar = async (id: string) => {
    await supabase().from("live_stream_messages").update({ hidden: true }).eq("id", id);
  };

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] lg:h-[70vh]">
      <div className="border-b border-[var(--line)] p-3">
        <p className="text-sm font-black text-[var(--text)]">💬 Chat en vivo</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {mensajes.length === 0 && <p className="text-center text-xs text-[var(--muted2)]">Todavía no hay mensajes. ¡Escribí el primero!</p>}
        {mensajes.map((m) => (
          <div key={m.id} className="group flex items-start justify-between gap-2 text-sm">
            <p><span className="font-bold text-[var(--accent)]">{m.sender_name}:</span> <span className="text-[var(--text)]/80">{m.body}</span></p>
            {puedeModerar && (
              <button onClick={() => ocultar(m.id)} title="Ocultar mensaje" className="shrink-0 opacity-0 group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5 text-[var(--bad)]" />
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {user ? (
        <div className="flex gap-2 border-t border-[var(--line)] p-3">
          <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()}
            placeholder="Escribí algo..." maxLength={300}
            className="flex-1 rounded-full border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]" />
          <button onClick={enviar} disabled={!texto.trim()} className="rounded-full bg-[var(--accent)] px-4 py-2 disabled:opacity-50">
            <Send className="h-4 w-4 text-white" />
          </button>
        </div>
      ) : (
        <p className="border-t border-[var(--line)] p-3 text-center text-xs text-[var(--muted2)]">Iniciá sesión para participar del chat.</p>
      )}
    </div>
  );
}
