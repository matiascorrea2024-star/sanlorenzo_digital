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
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white">
        <MapPin className="h-3.5 w-3.5 text-orange-400" /> Ciudades <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-10 z-50 w-56 rounded-2xl border border-white/10 bg-[#141018] p-2 shadow-2xl">
          <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/35">Cordón industrial</p>
          <div className="max-h-72 overflow-y-auto">
            {ciudades.map((c) => (
              <Link key={c.slug} href={`/${c.slug}`} onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-white/5">
                <span className={c.status !== "active" ? "text-white/50" : ""}>{c.name}</span>
                {c.status !== "active" && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/40">Próximamente</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
