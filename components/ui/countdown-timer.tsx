"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function CountdownTimer({ expiresAt, compact = false }: {
  expiresAt: string; // ISO string o "YYYY-MM-DD"
  compact?: boolean;
}) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0, done: false });

  useEffect(() => {
    const target = expiresAt.length === 10
      ? new Date(expiresAt + "T23:59:59").getTime()
      : new Date(expiresAt).getTime();

    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      if (diff === 0) {
        setT({ d: 0, h: 0, m: 0, s: 0, done: true });
        return;
      }
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        done: false,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (t.done) return null;

  // Solo mostrar countdown si faltan menos de 48h
  const totalHours = t.d * 24 + t.h;
  if (totalHours >= 48) return null;

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 border border-red-400/40 px-2 py-0.5 text-[10px] font-black text-red-200 tabular-nums">
        <Clock className="h-2.5 w-2.5" />
        {t.d > 0 ? `${t.d}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-red-500/20 border border-red-400/40 px-2.5 py-1 text-[11px] font-black text-red-200 tabular-nums backdrop-blur-md">
      <Clock className="h-3 w-3 animate-pulse" />
      <span>Termina en</span>
      <span className="bg-red-500/30 px-1.5 py-0.5 rounded font-mono">
        {t.d > 0 ? `${t.d}d ${pad(t.h)}:${pad(t.m)}:${pad(t.s)}` : `${pad(t.h)}:${pad(t.m)}:${pad(t.s)}`}
      </span>
    </div>
  );
}
