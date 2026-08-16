"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BusinessLiveBadge({ businessId }: { businessId: string }) {
  const [stream, setStream] = useState<{ id: string; status: "live" | "scheduled"; scheduled_at: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: live } = await sb.from("live_streams").select("id, status, scheduled_at")
        .eq("business_id", businessId).eq("status", "live").limit(1).maybeSingle();
      if (live) { setStream(live as any); return; }
      const { data: prox } = await sb.from("live_streams").select("id, status, scheduled_at")
        .eq("business_id", businessId).eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true }).limit(1).maybeSingle();
      if (prox) setStream(prox as any);
    })();
  }, [businessId]);

  if (!stream) return null;

  if (stream.status === "live") {
    return (
      <Link href={`/en-vivo/${stream.id}`}
        className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow-lg shadow-red-500/30">
        <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-white" /></span>
        ESTÁ EN VIVO
      </Link>
    );
  }

  const cuando = stream.scheduled_at
    ? new Date(stream.scheduled_at).toLocaleString("es-AR", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <Link href={`/en-vivo/${stream.id}`}
      className="flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-300">
      ⏰ Próximo vivo{cuando ? `: ${cuando}` : ""}
    </Link>
  );
}
