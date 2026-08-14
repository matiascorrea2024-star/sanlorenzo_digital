"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Stories() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase()
        .from("business_stories")
        .select("*, businesses(name, slug, logo_url)")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });
      if (data) setStories(data);
      setLoading(false);
    })();
  }, []);

  const porNegocio: Record<string, any[]> = {};
  stories.forEach(s => { (porNegocio[s.business_id] ||= []).push(s); });
  const grupos = Object.values(porNegocio);

  if (loading || grupos.length === 0) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {grupos.map((g) => {
          const b = g[0].businesses;
          return (
            <button key={g[0].business_id} onClick={() => setSelected(g[0])}
              className="flex flex-col items-center gap-1 shrink-0">
              <span className="rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 p-[2px]">
                <span className="block rounded-full bg-[#0d0a12] p-[2px]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 text-xl font-black">
                    {b?.name?.[0] || "🏪"}
                  </span>
                </span>
              </span>
              <span className="max-w-[64px] truncate text-[10px] text-white/70">{b?.name}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelected(null)}>
          <div className={`w-full max-w-sm rounded-3xl bg-gradient-to-br ${selected.background} p-8 text-center`} onClick={e => e.stopPropagation()}>
            <p className="text-xs font-bold uppercase text-white/80">{selected.businesses?.name}</p>
            <p className="mt-4 text-2xl font-black text-white whitespace-pre-wrap">{selected.text}</p>
            {selected.image_url && <img src={selected.image_url} className="mt-4 rounded-2xl" alt="" />}
            <button onClick={() => setSelected(null)} className="mt-6 rounded-xl bg-black/30 px-6 py-2 text-sm font-bold text-white">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
