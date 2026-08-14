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
    default: "bg-white/10 text-white/80 border-white/15",
    success: "bg-green-500/15 text-green-300 border-green-400/30",
    warning: "bg-yellow-500/15 text-yellow-300 border-yellow-400/30",
    danger: "bg-red-500/15 text-red-300 border-red-400/40",
    info: "bg-sky-500/15 text-sky-300 border-sky-400/30",
    outline: "bg-transparent text-white/60 border-white/20",
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
