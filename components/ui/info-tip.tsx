"use client";
import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/** Ícono ⓘ con una explicación corta (1-2 líneas) en lenguaje simple.
 * Pensado para mobile: toca para abrir/cerrar, no depende de hover. */
export default function InfoTip({ children, label = "Más información" }: { children: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <span className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setOpen((v) => !v); }}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/35 hover:text-orange-400 align-middle"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 rounded-xl border border-white/15 bg-[#1c1819] p-3 text-left text-xs font-normal normal-case leading-snug text-white/70 shadow-2xl"
        >
          {children}
        </span>
      )}
    </span>
  );
}
