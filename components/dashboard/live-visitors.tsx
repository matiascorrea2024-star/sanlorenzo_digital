"use client";

import { Activity } from "lucide-react";
import { useLiveViewers } from "@/lib/hooks/use-live-viewers";

export default function LiveVisitors({ businessId }: { businessId?: string }) {
  const viewers = useLiveViewers(businessId || null);

  return (
    <div className="flex items-center gap-2 border border-[var(--line)] bg-[var(--ov-03)] px-3 py-2 text-xs text-[var(--muted)]" role="status" aria-live="polite">
      <Activity className={`h-4 w-4 ${viewers > 0 ? "text-[var(--accent)]" : "text-[var(--muted2)]"}`} />
      {viewers > 0 ? (
        <span><strong className="text-[var(--text)]">{viewers}</strong> {viewers === 1 ? "visitante" : "visitantes"} viendo tu ficha ahora</span>
      ) : (
        <span>Sin visitantes en vivo ahora</span>
      )}
    </div>
  );
}
