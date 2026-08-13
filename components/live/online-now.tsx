"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function OnlineNow() {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    try {
      fetch("/api/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: window.location.pathname }),
      }).catch(() => {});
    } catch {}
    const sessionId =
      Math.random().toString(36).slice(2) + Date.now().toString(36);
    const sb = supabase();
    const channel = sb.channel("online-now", {
      config: { presence: { key: sessionId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        let count = 0;
        Object.values(state).forEach((arr: any) => (count += arr.length));
        setOnline(count);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          try {
            await channel.track({ ts: Date.now() });
          } catch {}
        }
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <span className="inline-flex items-center gap-2 rounded-full border border-green-400/40 bg-black/80 px-4 py-2 text-xs font-bold text-green-300 shadow-2xl backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
        </span>
        {online} {online === 1 ? "persona" : "personas"} en la página ahora
      </span>
    </div>
  );
}
