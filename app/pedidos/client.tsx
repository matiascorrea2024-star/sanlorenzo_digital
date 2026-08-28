"use client";
import { useEffect, useState } from "react";
import { HelpCircle, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PedidosBoard from "@/components/community/pedidos-board";

type Ciudad = { id: string; name: string };

export default function PedidosPage() {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase().from("locations").select("id, name").eq("type", "city").eq("status", "active").order("name")
      .then(({ data, error }) => {
        if (error) console.error("PedidosPage: no se pudieron cargar las ciudades:", error.message);
        const list = data || [];
        setCiudades(list);
        const saved = typeof window !== "undefined" ? localStorage.getItem("sld-chat-city") : null;
        const preset = list.find((c) => c.id === saved) || list.find((c) => c.name === "San Lorenzo") || list[0];
        if (preset) setLocationId(preset.id);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (locationId) localStorage.setItem("sld-chat-city", locationId);
  }, [locationId]);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Hero editorial: calco del mockup aprobado -- headline gigante de
          2 líneas con degradé en la segunda, sin centrar. */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(209,47,104,.14), transparent 45%), radial-gradient(circle at 85% 30%, rgba(169,31,85,.10), transparent 45%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 pb-6 pt-14 sm:px-6 md:pt-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.35em] text-[var(--accent-ink)]" style={{ fontFamily: "var(--font-display)" }}>
                <HelpCircle className="h-3.5 w-3.5" /> Tablón comunitario
              </p>
              <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-7xl">
                ¿Quién<br />
                <span className="knockout-text magenta-glow">tiene esto?</span>
              </h1>
              <p className="mt-5 max-w-md text-lg font-medium leading-relaxed text-[var(--muted)]">
                Publicá lo que buscás y recibí respuestas directas de vecinos y comercios locales. El mercado colaborativo de {ciudades.find((c) => c.id === locationId)?.name || "tu zona"}.
              </p>
            </div>
            {!loading && ciudades.length > 1 && (
              <div className="flex min-w-[220px] items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[var(--ov-05)] px-4 py-3">
                <MapPin className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
                  className="w-full cursor-pointer appearance-none bg-transparent text-sm font-bold text-[var(--text)] outline-none">
                  {ciudades.map((c) => <option key={c.id} value={c.id} className="bg-[var(--surface)]">{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {locationId && <PedidosBoard locationId={locationId} />}
      </div>
    </main>
  );
}
