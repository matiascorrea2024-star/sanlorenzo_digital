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
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 15% 0%, rgba(249,115,22,.16), transparent 55%), radial-gradient(circle at 90% 30%, rgba(34,211,238,.12), transparent 55%)" }} />
        <div className="relative mx-auto max-w-3xl px-4 py-14 text-center md:py-16">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.2em] text-orange-300">
            <MessageCircle className="h-3 w-3" /> Comunidad
          </p>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Chat de tu ciudad</h1>
          <p className="mx-auto mt-2 max-w-lg text-white/60">
            Preguntas, avisos, un perro perdido, lo que necesites -- con buena onda. Los negocios de la zona
            quedan destacados cuando participan.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-6">
        {!loading && ciudades.length > 1 && (
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-orange-400" />
            <select value={locationId} onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold outline-none focus:border-orange-400 sm:w-auto">
              {ciudades.map((c) => <option key={c.id} value={c.id} className="bg-[#1a1420]">{c.name}</option>)}
            </select>
          </div>
        )}
        {locationId && <CityChat locationId={locationId} />}
      </div>
    </main>
  );
}
