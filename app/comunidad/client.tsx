"use client";
import { useEffect, useState } from "react";
import { MessageCircle, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CityChat from "@/components/chat/city-chat";

type Ciudad = { id: string; name: string };

export default function ComunidadPage() {
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase().from("locations").select("id, name").eq("type", "city").eq("status", "active").order("name")
      .then(({ data }) => {
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
    <main className="min-h-screen bg-[#0c0a0b] text-white pb-24">
      {/* Hero editorial, calco del mockup aprobado: headline gigante +
          selector de ciudad como panel de vidrio propio al costado. */}
      <div className="mx-auto max-w-4xl px-4 pb-10 pt-14 sm:px-6 md:pt-20">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.4em] text-orange-500">
              <MessageCircle className="h-3.5 w-3.5" /> Espacio de vecinos
            </p>
            <h1 className="text-5xl font-bold leading-[0.9] tracking-tight sm:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
              Pulso de la <span className="text-orange-500">Ciudad.</span>
            </h1>
            <p className="mt-5 text-lg text-white/50">
              Preguntas, avisos, un perro perdido o simplemente buena onda. Los negocios verificados participan con un sello distintivo.
            </p>
          </div>

          {!loading && ciudades.length > 1 && (
            <div className="flex min-w-[260px] flex-col gap-2">
              <span className="ml-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40"><MapPin className="h-3 w-3" /> Seleccionar localidad</span>
              <div className="rounded-2xl border border-white/[.1] bg-white/[.02]">
                <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
                  className="w-full cursor-pointer appearance-none bg-transparent px-5 py-4 text-sm font-bold outline-none">
                  {ciudades.map((c) => <option key={c.id} value={c.id} className="bg-[#1c1819]">{c.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-6 sm:px-6">
        {locationId && <CityChat locationId={locationId} />}
      </div>
    </main>
  );
}
