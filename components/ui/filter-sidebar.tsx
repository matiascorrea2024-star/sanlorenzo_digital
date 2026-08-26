// Piezas chicas y reusables para sidebars de filtro densos (estilo
// Amazon: agrupado por título, checkboxes/radios apretados). Usado en
// /negocios y /promociones -- cualquier página de listado nueva las suma.
import type { ReactNode } from "react";

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
