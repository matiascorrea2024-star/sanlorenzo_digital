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
  const [verMas, setVerMas] = useState(false);
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

  const visibles = verMas ? views : views.slice(0, 8);

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-black text-[var(--text)]">🌐 Últimas visitas (con IP)</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--line)] bg-[var(--ov-05)] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[var(--muted2)]">Herramienta de prueba</span>
          <button
            onClick={sembrar}
            disabled={loading}
            title="Inserta 5 visitas falsas para probar cómo se ve la tabla -- no son datos reales"
            className="rounded-xl border border-orange-400/40 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300 transition hover:bg-orange-500/20 disabled:opacity-50"
          >
            {loading ? "⏳ Sembrando..." : "🌱 Simular 5 visitas"}
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ov-05)]">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--ov-05)]">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--muted)] md:px-4 md:text-xs">IP</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--muted)] md:px-4 md:text-xs">Negocio / Página</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold text-[var(--muted)] md:px-4 md:text-xs">Cuándo</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-xs text-[var(--muted2)]">
                  Todavía no hay visitas. Tocá &quot;Simular 5 visitas&quot; para ver datos de ejemplo.
                </td>
              </tr>
            ) : (
              visibles.map((v, i) => (
                <tr key={v.id || i} className="border-b border-[var(--ov-05)] hover:bg-[var(--ov-05)]">
                  <td className="px-3 py-2 font-mono text-[10px] text-orange-300 md:px-4 md:text-xs">{v.ip || "—"}</td>
                  <td className="max-w-[140px] truncate px-3 py-2 text-[10px] text-[var(--text)] md:max-w-none md:px-4 md:text-xs">
                    {v.business_id ? (nombres[v.business_id] || "Miniweb") : v.path || "/"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-[10px] text-[var(--muted)] md:px-4 md:text-xs">{timeAgo(v.viewed_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {views.length > 8 && (
        <button
          onClick={() => setVerMas(!verMas)}
          className="mt-3 w-full rounded-xl border border-[var(--line)] bg-[var(--ov-05)] py-2 text-xs font-bold text-[var(--muted)] transition hover:bg-[var(--ov-10)] hover:text-[var(--text)]"
        >
          {verMas ? "▲ Ver menos" : `▼ Ver las ${views.length} visitas`}
        </button>
      )}
      <p className="mt-2 text-[11px] text-[var(--muted2)]">💡 Las visitas reales se guardan cuando alguien entra a una miniweb.</p>
    </div>
  );
}
