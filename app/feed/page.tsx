"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Item = { icon: string; text: string; time: string; href: string; ts: number };

function haceCuanto(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "recién";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

export default function MuroPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const lista: Item[] = [];

      const { data: neg } = await sb
        .from("businesses")
        .select("id, name, slug, created_at")
        .order("created_at", { ascending: false })
        .limit(10);
      const negocios = neg || [];

      negocios.forEach((b: any) =>
        lista.push({
          icon: "🏪",
          text: `Nuevo negocio en la plataforma: ${b.name}`,
          href: "/negocio/" + b.slug,
          time: haceCuanto(b.created_at),
          ts: new Date(b.created_at).getTime(),
        })
      );

      try {
        const { data: rev } = await sb
          .from("reviews")
          .select("business_id, created_at, rating")
          .eq("approved", true)
          .order("created_at", { ascending: false })
          .limit(10);
        (rev || []).forEach((r: any) => {
          const b = negocios.find((x: any) => x.id === r.business_id);
          lista.push({
            icon: "⭐",
            text: `Nueva reseña ${"★".repeat(r.rating)} para ${b ? b.name : "un negocio"}`,
            href: b ? "/negocio/" + b.slug : "/negocios",
            time: haceCuanto(r.created_at),
            ts: new Date(r.created_at).getTime(),
          });
        });
      } catch {}

      try {
        const { data: fol } = await sb
          .from("followers")
          .select("business_id, created_at")
          .order("created_at", { ascending: false })
          .limit(10);
        (fol || []).forEach((f: any) => {
          const b = negocios.find((x: any) => x.id === f.business_id);
          lista.push({
            icon: "❤️",
            text: `Alguien empezó a seguir a ${b ? b.name : "un negocio"}`,
            href: b ? "/negocio/" + b.slug : "/negocios",
            time: haceCuanto(f.created_at),
            ts: new Date(f.created_at).getTime(),
          });
        });
      } catch {}

      lista.sort((a, b) => b.ts - a.ts);
      setItems(lista.slice(0, 20));
      setCargando(false);
    })();
  }, []);

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-16">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">📰 Lo que pasa en San Lorenzo</h1>
        <p className="text-white/60 mt-1">Actividad en vivo de la ciudad</p>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        {cargando ? (
          <p className="text-center text-white/50 py-16">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <p className="text-5xl mb-4">📰</p>
            <p className="font-bold">Todavía no hay actividad</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-orange-500/30 ml-4 space-y-6">
            {items.map((it, i) => (
              <Link key={i} href={it.href} className="block pl-8 relative group">
                <span className="absolute -left-5 top-1 flex h-10 w-10 items-center justify-center rounded-full border border-orange-400/40 bg-[#1a0d12] text-lg">
                  {it.icon}
                </span>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 transition group-hover:border-orange-400/60">
                  <p className="text-sm font-bold">{it.text}</p>
                  <p className="mt-1 text-xs text-white/40">{it.time}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-3xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-8 text-center">
          <h2 className="text-xl font-black">🏪 ¿Tenés un negocio?</h2>
          <p className="mt-2 text-sm text-white/60">Publicá ofertas y aparecé en el muro de toda la ciudad.</p>
          <Link href="/registro" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
            Sumar mi negocio →
          </Link>
        </div>
      </div>
    </main>
  );
}
