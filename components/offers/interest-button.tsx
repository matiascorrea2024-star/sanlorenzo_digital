"use client";

import { useCallback, useEffect, useState } from "react";
import { ThumbsUp } from "lucide-react";
import { gaEvent } from "@/lib/track";

const LS_KEY = "sld-interested";
const SYNC_EVENT = "sld-interested-changed";

function readLocal(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(SYNC_EVENT));
  } catch {}
}

export default function InterestButton({ offerId, compact = false }: { offerId: string; compact?: boolean }) {
  const [on, setOn] = useState(false);
  const [serverCount, setServerCount] = useState<number | null>(null);

  useEffect(() => {
    setOn(readLocal().includes(offerId));
    const sync = () => setOn(readLocal().includes(offerId));
    window.addEventListener(SYNC_EVENT, sync);
    fetch(`/api/track?offer_id=${encodeURIComponent(offerId)}`)
      .then((r) => r.json())
      .then((d: { count?: unknown }) => {
        if (typeof d?.count === "number") setServerCount(d.count);
      })
      .catch(() => {});
    return () => window.removeEventListener(SYNC_EVENT, sync);
  }, [offerId]);

  const toggle = useCallback(() => {
    const ids = readLocal();
    const yaEstaba = ids.includes(offerId);
    writeLocal(yaEstaba ? ids.filter((id) => id !== offerId) : [...ids, offerId]);
    if (!yaEstaba) {
      // fire-and-forget: la señal de intención no puede bloquear la UI
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_type: "interest_offer", offer_id: offerId }),
      }).catch(() => {});
      gaEvent("interest", { offer_id: offerId });
    }
    // Al desactivar solo se quita el estado local: analytics_events es append-only,
    // no hay "delete" de la señal de intención.
  }, [offerId]);

  const base = serverCount ?? 0;
  const shown = base + (on ? 1 : 0);
  const showNumber = serverCount !== null || on;

  const icon = <ThumbsUp className={compact ? "h-4 w-4" : "h-5 w-5"} fill={on ? "currentColor" : "none"} />;

  if (compact) {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
        aria-pressed={on}
        aria-label={on ? "Ya no me interesa" : "Me interesa esta oferta"}
        className="flex flex-col items-center gap-1"
      >
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-black/40 backdrop-blur-md transition ${on ? "border-[var(--accent)] text-[var(--accent)]" : "border-white/10 text-white hover:border-white/30"}`}
        >
          {icon}
        </span>
        <span
          className={`text-[9px] font-black uppercase tracking-widest transition-colors ${on ? "text-[var(--accent)]" : "text-white/70"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          Me interesa{showNumber && <> +{shown}</>}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      aria-pressed={on}
      className={`flex items-center gap-2.5 rounded-2xl border px-4 py-3 transition ${on ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--line)] bg-[var(--ov-05)] text-[#f7f3ec] hover:bg-[var(--ov-10)]"}`}
    >
      {icon}
      <span className="text-sm font-black uppercase tracking-widest" style={{ fontFamily: "var(--font-display)" }}>
        Me interesa
      </span>
      {showNumber && (
        <span className={`rounded-md px-1.5 py-0.5 text-xs font-black tabular-nums ${on ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-white/5 text-white/70"}`}>
          +{shown}
        </span>
      )}
    </button>
  );
}
