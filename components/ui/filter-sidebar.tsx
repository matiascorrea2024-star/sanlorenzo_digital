"use client";
// Piezas chicas y reusables para sidebars de filtro densos (estilo
// Amazon: agrupado por título, checkboxes/radios apretados). Usado en
// /negocios y /promociones -- cualquier página de listado nueva las suma.
import { useEffect, useRef, useState, type ReactNode } from "react";

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-[var(--line)] py-5 first:pt-0">
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[.2em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function CheckRow({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: ReactNode; count?: number }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--muted)] transition hover:text-[var(--text)]">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-[var(--accent)]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== undefined && <span className="shrink-0 text-xs text-[var(--muted2)]">({count})</span>}
    </label>
  );
}

export function RadioRow({ checked, onChange, label, name }: { checked: boolean; onChange: () => void; label: ReactNode; name: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--muted)] transition hover:text-[var(--text)]">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4 shrink-0 accent-[var(--accent)]" />
      {label}
    </label>
  );
}

/** Grupo con "ver más": muestra los primeros N ítems y el resto queda
 * en un popover -- para no volver gigante el sidebar con listas largas
 * (33 rubros, barrios, etc.), mismo patrón que pediste ("que se
 * sobreponga y te marque los que querés"). */
export function ExpandableFilterGroup<T extends { id: string; name: string; icon?: string }>({
  title, items, selected, onToggle, visibleCount = 8,
}: {
  title: string; items: T[]; selected: string[]; onToggle: (id: string) => void; visibleCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const visible = items.slice(0, visibleCount);
  const resto = items.slice(visibleCount);

  return (
    <FilterGroup title={title}>
      {visible.map((it) => (
        <CheckRow key={it.id} checked={selected.includes(it.id)} onChange={() => onToggle(it.id)} label={it.icon ? <>{it.icon} {it.name}</> : it.name} />
      ))}
      {resto.length > 0 && (
        <div className="relative" ref={ref}>
          <button type="button" onClick={() => setOpen((v) => !v)}
            className="text-xs font-bold text-[var(--accent)] hover:underline">
            {selected.filter((s) => resto.some((r) => r.id === s)).length > 0
              ? `Ver más (${selected.filter((s) => resto.some((r) => r.id === s)).length} elegidos de ${resto.length})`
              : `Ver más (+${resto.length})`}
          </button>
          {open && (
            <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-72 overflow-y-auto rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-3 shadow-2xl">
              <div className="space-y-2">
                {resto.map((it) => (
                  <CheckRow key={it.id} checked={selected.includes(it.id)} onChange={() => onToggle(it.id)} label={it.icon ? <>{it.icon} {it.name}</> : it.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </FilterGroup>
  );
}
