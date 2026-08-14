"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function timeAgo(fecha: string) {
  const d = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(d / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

export default function AdminVisits() {
  const [views, setViews] = useState<any[]>([]);
  const [nombres, setNombres] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const [v, b] = await Promise.all([
      supabase().from("page_views").select("*").order("viewed_at", { ascending: false }).limit(30),
      supabase().from("businesses").select("id, name"),
    ]);
    setViews(v.data || []);
    const map: Record<string, string> = {};
    (b.data || []).forEach((x: any) => (map[x.id] = x.name));
    setNombres(map);
  };

  const sembrar = async () => {
    setLoading(true);
    const sb = supabase();
    const { data: bizs } = await sb.from("businesses").select("id").limit(5);
    const ips = ["200.42.101.15", "190.111.55.88", "181.47.203.12", "201.232.44.77", "186.138.90.100"];
    for (let i = 0; i < 5; i++) {
      await sb.from("page_views").insert({
        business_id: bizs?.[i % bizs.length]?.id || null,
        path: `/negocio/${i}`,
        ip: ips[i],
      });
    }
    await cargar();
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-black">🌐 Últimas visitas (con IP)</h3>
        <button
          onClick={sembrar}
          disabled={loading}
          className="rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 hover:bg-orange-500/20 disabled:opacity-50"
        >
          {loading ? "⏳ Sembrando..." : "🌱 Simular 5 visitas"}
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-white/60">IP</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Negocio / Página</th>
              <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {views.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-xs text-white/40">Todavía no hay visitas. Tocá "Simular 5 visitas" para ver datos de ejemplo.</td></tr>
            ) : views.map((v, i) => (
              <tr key={v.id || i} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-4 py-2 font-mono text-xs text-orange-300">{v.ip || "—"}</td>
                <td className="px-4 py-2 text-xs">
                  {v.business_id ? (nombres[v.business_id] || "Miniweb") : v.path || "/"}
                </td>
                <td className="px-4 py-2 text-xs text-white/50">{timeAgo(v.viewed_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {views.length > 0 && (
        <p className="mt-2 text-[11px] text-white/40">💡 Las visitas reales se guardan cuando alguien entra a una miniweb.</p>
      )}
    </div>
  );
}
