"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useHeartbeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        await supabase()
          .from("user_profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", userId);
      } catch {
        // silencioso: no rompe la app si falla
      }
    };

    tick(); // primera vez al entrar
    const id = setInterval(tick, 60 * 1000); // cada 60 segundos mientras está visible
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [userId]);
}

export function formatLastSeen(lastSeen: string | null | undefined): { text: string; online: boolean } {
  if (!lastSeen) return { text: "Nunca visto", online: false };
  const now = Date.now();
  const then = new Date(lastSeen).getTime();
  const diff = now - then;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;

  if (diff < 2 * min) return { text: "En línea", online: true };
  if (diff < hr) return { text: `Hace ${Math.floor(diff / min)} min`, online: false };
  if (diff < day) return { text: `Hace ${Math.floor(diff / hr)} h`, online: false };
  if (diff < 7 * day) return { text: `Hace ${Math.floor(diff / day)} d`, online: false };
  return { text: new Date(lastSeen).toLocaleDateString("es-AR"), online: false };
}
