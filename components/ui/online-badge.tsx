import { formatLastSeen } from "@/lib/use-heartbeat";

export default function OnlineBadge({ lastSeen, size = "sm" }: { lastSeen: string | null | undefined; size?: "sm" | "md" }) {
  const { text, online } = formatLastSeen(lastSeen);
  const dot = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const txt = size === "sm" ? "text-[10px]" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-1.5 ${txt} font-bold ${online ? "text-emerald-300" : "text-[var(--muted2)]"}`}>
      <span className={`relative flex ${dot} shrink-0 rounded-full ${online ? "bg-emerald-400" : "bg-[var(--ov-20)]"}`}>
        {online && <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />}
      </span>
      <span>{text}</span>
    </span>
  );
}
