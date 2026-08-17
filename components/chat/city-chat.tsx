"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Send, Flag, Store } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";

type Mensaje = {
  id: string;
  user_id: string;
  sender_name: string;
  business_id: string | null;
  body: string;
  created_at: string;
};

type NegocioMini = { slug: string; name: string };

// Convierte "@slug" dentro del texto en un link al negocio, solo si
// "slug" corresponde a un negocio real de esta ciudad (si no matchea
// ningún negocio conocido, se deja como texto plano -- así no se puede
// fabricar un link falso escribiendo cualquier cosa después de @).
function renderBody(body: string, negociosPorSlug: Map<string, string>) {
  const parts = body.split(/(@[a-z0-9-]+)/gi);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const slug = part.slice(1).toLowerCase();
      const nombre = negociosPorSlug.get(slug);
      if (nombre) {
        return (
          <Link key={i} href={`/negocio/${slug}`} className="font-bold text-[var(--place)] hover:text-cyan-200">
            @{nombre}
          </Link>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function CityChat({ locationId }: { locationId: string }) {
  const { user } = useAuth();
  const { show } = useToast();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [nombre, setNombre] = useState("Vecino");
  const [negocios, setNegocios] = useState<NegocioMini[]>([]);
  const [sugerencias, setSugerencias] = useState<NegocioMini[]>([]);
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const negociosPorSlug = useMemo(() => new Map(negocios.map((n) => [n.slug, n.name])), [negocios]);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const [{ data: msgs }, { data: biz }] = await Promise.all([
        sb.from("city_chat_messages").select("*").eq("location_id", locationId)
          .order("created_at", { ascending: true }).limit(200),
        sb.from("businesses").select("slug, name").eq("location_id", locationId)
          .in("status", ["verificado", "reclamado"]).eq("activo", true),
      ]);
      setMensajes(msgs || []);
      setNegocios(biz || []);
      if (user) {
        const { data: prof } = await sb.from("user_profiles").select("display_name").eq("user_id", user.id).maybeSingle();
        setNombre(prof?.display_name || (user.email || "Vecino").split("@")[0]);
      }
    })();

    const chan = supabase().channel(`city-chat-${locationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "city_chat_messages", filter: `location_id=eq.${locationId}` },
        (payload: any) => setMensajes((prev) => [...prev, payload.new]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "city_chat_messages", filter: `location_id=eq.${locationId}` },
        (payload: any) => setMensajes((prev) => payload.new.hidden ? prev.filter((m) => m.id !== payload.new.id) : prev))
      .subscribe();
    return () => { supabase().removeChannel(chan); };
  }, [locationId, user]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [mensajes.length]);

  const onChangeTexto = (v: string) => {
    setTexto(v);
    const atMatch = v.match(/@([a-z0-9-]*)$/i);
    if (atMatch) {
      const q = atMatch[1].toLowerCase();
      setSugerencias(negocios.filter((n) => n.name.toLowerCase().includes(q) || n.slug.includes(q)).slice(0, 5));
    } else {
      setSugerencias([]);
    }
  };

  const elegirMencion = (n: NegocioMini) => {
    setTexto((prev) => prev.replace(/@([a-z0-9-]*)$/i, `@${n.slug} `));
    setSugerencias([]);
  };

  const enviar = async () => {
    if (!texto.trim() || !user || enviando) return;
    setEnviando(true);
    const body = texto.trim().slice(0, 500);
    const { error } = await supabase().from("city_chat_messages").insert({
      location_id: locationId, user_id: user.id, sender_name: nombre, body,
    });
    setEnviando(false);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo enviar el mensaje.")}`, "error"); return; }
    setTexto("");
  };

  const reportar = async (id: string) => {
    if (!user) return;
    const { error } = await supabase().from("city_chat_reports").insert({ message_id: id, user_id: user.id });
    if (!error) show("🚩 Reportado. Gracias por avisar.", "success");
  };

  return (
    <div className="flex h-[75vh] flex-col rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 shadow-2xl shadow-black/50">
      <div className="flex h-full flex-col rounded-[calc(2.5rem-0.375rem)] border border-[var(--ov-05)] bg-[var(--card-inner)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
        <div className="flex items-center gap-3 border-b border-[var(--ov-05)] px-6 py-5 sm:px-8">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
          <p className="text-xs font-bold text-[var(--muted2)]">Chat en vivo de la ciudad -- podés etiquetar un negocio con @nombre</p>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6 sm:p-8">
          {mensajes.length === 0 && <p className="text-center text-xs text-[var(--muted2)]">Todavía no hay mensajes. ¡Escribí el primero!</p>}
          {mensajes.map((m) => (
            <div key={m.id} className="group flex items-start justify-between gap-2 text-sm">
              <p className="min-w-0">
                <span className="font-bold text-orange-300">{m.sender_name}</span>
                {m.business_id && (
                  <span className="ml-1 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-red-600/20 px-1.5 py-0.5 text-[9px] font-black uppercase text-orange-300">
                    <Store className="h-2.5 w-2.5" /> Negocio
                  </span>
                )}
                <span className="text-[var(--muted2)]">: </span>
                <span className="text-[var(--text)]/85">{renderBody(m.body, negociosPorSlug)}</span>
              </p>
              {user && user.id !== m.user_id && (
                <button onClick={() => reportar(m.id)} title="Reportar mensaje" aria-label="Reportar mensaje"
                  className="shrink-0 text-[var(--muted2)] opacity-0 transition group-hover:opacity-100 hover:text-[var(--bad)]">
                  <Flag className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {user ? (
          <div className="relative border-t border-[var(--ov-05)] bg-[var(--ov-02)] p-5 sm:p-6">
            {sugerencias.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1 rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-1.5 shadow-2xl">
                {sugerencias.map((n) => (
                  <button key={n.slug} onClick={() => elegirMencion(n)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-bold text-[var(--text)] hover:bg-[var(--ov-10)]">
                    <Store className="h-3 w-3 text-orange-400" /> {n.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={texto} onChange={(e) => onChangeTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Escribí algo... (@ para etiquetar un negocio)" maxLength={500}
                className="flex-1 rounded-full border border-[var(--line-strong)] bg-[var(--card-inner)] px-4 py-2 text-sm text-[var(--text)] outline-none focus:border-orange-400" />
              <button onClick={enviar} disabled={!texto.trim() || enviando} aria-label="Enviar"
                className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 disabled:opacity-50">
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <p className="border-t border-[var(--ov-05)] p-5 text-center text-xs text-[var(--muted2)] sm:p-6">
            <Link href="/login" className="font-bold text-orange-400 hover:text-orange-300">Iniciá sesión</Link> para participar del chat.
          </p>
        )}
      </div>
    </div>
  );
}
