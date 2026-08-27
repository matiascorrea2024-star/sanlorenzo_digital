"use client";
import { useState } from "react";
import Image from "next/image";

export default function ProductCard({ item }: { item: { name: string; price?: string; note?: string; photo?: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
        {item.photo ? (
          <button onClick={() => setOpen(true)} className="relative h-14 w-14 shrink-0" aria-label={`Ver foto de ${item.name}`}>
            <Image src={item.photo} alt={item.name} fill sizes="56px" className="rounded-lg object-cover transition hover:scale-105 hover:opacity-90" />
          </button>
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[var(--surface2)] text-xl">📦</span>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">{item.name}</p>
          {item.note && <p className="text-xs text-[var(--muted)]">{item.note}</p>}
        </div>
        <span className="text-sm font-semibold text-[var(--accent2)]">{item.price ?? "Consultar"}</span>
      </div>
      {open && item.photo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <img src={item.photo} alt={item.name} className="max-h-[85vh] max-w-full rounded-2xl border border-[var(--line)] shadow-2xl" />
          <button className="absolute right-4 top-4 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--muted)] hover:text-white">✕</button>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--muted)]">Tocá para cerrar</p>
        </div>
      )}
    </>
  );
}
