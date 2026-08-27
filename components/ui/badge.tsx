"use client";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "outline";

export default function Badge({
  children,
  variant = "default",
  size = "md",
  pulse = false,
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  size?: "sm" | "md";
  pulse?: boolean;
  className?: string;
}) {
  const variants: Record<Variant, string> = {
    default: "bg-[var(--ov-10)] text-[var(--text)]/80 border-[var(--line-strong)]",
    success: "bg-green-500/15 text-[var(--ok)] border-green-400/30",
    warning: "bg-[var(--warn)]/15 text-[var(--warn)] border-[var(--warn)]/30",
    danger: "bg-red-500/15 text-[var(--bad)] border-red-400/40",
    info: "bg-[var(--place)]/15 text-[var(--place)] border-[var(--place)]/30",
    outline: "bg-transparent text-[var(--muted)] border-[var(--line-strong)]",
  };
  const sizes = { sm: "px-2 py-0.5 text-[10px]", md: "px-2.5 py-1 text-xs" };
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-bold tracking-wide uppercase",
      variants[variant], sizes[size],
      pulse && "animate-pulse",
      className
    )}>
      {children}
    </span>
  );
}
