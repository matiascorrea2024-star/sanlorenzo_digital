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

  useEffect(() => {
    (async () => {
      const [v, b] = await Promise.all([
        supabase().from("page_views").select("*").order("viewed_at", { ascending: false }).limit(30),
        supabase().from("businesses").select("id, name"),
      ]);
      setViews(v.data || []);
      const map: Record<string, string> = {};
      (b.data || []).forEach((x: any) => (map[x.id] = x.name));
      setNombres(map);
    })();
  }, []);

  if (!views.length) return null;
  return (
    <div className="mt-8">
      <h3 className="mb-4 text-lg font-black">🌐 Últimas visitas (con IP)</h3>
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
            {views.map((v, i) => (
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
    </div>
  );
}
