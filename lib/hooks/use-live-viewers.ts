"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Cuántas pestañas están mirando ESTA página ahora mismo, en serio --
// presencia real de Supabase Realtime (mismo mecanismo que ya usa el
// chat para "🟢 En línea"), no un número inventado. No hace falta estar
// logueado: cada pestaña se identifica con un id de sesión efímero.
export function useLiveViewers(channelKey?: string | null) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!channelKey) return;
    let sessionId = sessionStorage.getItem("sld-viewer-session");
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("sld-viewer-session", sessionId);
    }
    const chan = supabase().channel(`viewers-${channelKey}`, { config: { presence: { key: sessionId } } });
    chan.on("presence", { event: "sync" }, () => {
      setCount(Object.keys(chan.presenceState()).length);
    }).subscribe(async (status) => {
      if (status !== "SUBSCRIBED") {
        setCount(0);
        return;
      }
      try {
        await chan.track({ t: Date.now() });
      } catch {
        setCount(0);
      }
    });
    return () => { supabase().removeChannel(chan); };
  }, [channelKey]);

  return count;
}
