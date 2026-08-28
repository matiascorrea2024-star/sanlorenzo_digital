"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function CitySwitcher() {
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase().from("locations").select("name, slug, status").eq("type", "city")
      .order("name").then(({ data }) => setCiudades(data || []));
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (ciudades.length === 0) return null;

  return (
    <div className="relative hidden md:block" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-white/85 hover:bg-white/10">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-ink)]" />
        <span className="flex flex-col items-start leading-tight">
          <span className="text-[10px] text-white/50">Entrega en</span>
          <span className="flex items-center gap-0.5 text-xs font-bold">San Lorenzo <ChevronDown className="h-3 w-3" /></span>
        </span>
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-56 rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-03)] p-1.5 shadow-2xl backdrop-blur-xl">
          <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--surface2)] p-2">
            <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--muted2)]">Cordón industrial</p>
            <div className="max-h-72 overflow-y-auto">
              {ciudades.map((c) => (
                <Link key={c.slug} href={`/${c.slug}`} onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-[var(--ov-05)]">
                  <span className={c.status !== "active" ? "text-[var(--muted)]" : ""}>{c.name}</span>
                  {c.status !== "active" && (
                    <span className="rounded-full bg-[var(--ov-10)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--muted2)]">Próximamente</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
