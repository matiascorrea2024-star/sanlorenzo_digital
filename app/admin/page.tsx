"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["matiascorrea2024@gmail.com","matiascorrea2025@gmail.com","matiasgazta2027@gmail.com"];

export default function AdminPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [negocios, setNegocios] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ views: 0, wa: 0, shares: 0, ranking: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      setEmail(user?.email || null);
      if (user && ADMIN_EMAILS.includes(user.email || "")) {
        const { data } = await sb.from("businesses").select("*").order("created_at", { ascending: false });
        setNegocios(data || []);
        const desde = new Date(Date.now() - 6 * 86400000).toISOString();
        const { data: ev } = await sb.from("metrics").select("type, business_id").gte("created_at", desde);
        const evs = ev || [];
        const porNegocio: Record<string, number> = {};
        let views = 0, wa = 0, shares = 0;
        evs.forEach((e: any) => {
          if (e.type === "view") { views++; porNegocio[e.business_id] = (porNegocio[e.business_id] || 0) + 1; }
          if (e.type === "whatsapp") wa++;
          if (e.type === "share") shares++;
        });
        const ranking = (data || [])
          .map((b: any) => ({ id: b.id, name: b.name, views: porNegocio[b.id] || 0 }))
          .sort((a: any, b: any) => b.views - a.views)
          .slice(0, 5);
        setStats({ views, wa, shares, ranking });
      }
      setLoading(false);
    })();
  }, []);

  const up = async (id: string, patch: any) => {
    const { error } = await supabase().from("businesses").update(patch).eq("id", id);
    if (error) { alert("❌ " + error.message); return; }
    setNegocios(negocios.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  if (loading) return <main className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center">Cargando…</main>;

  if (!email || !ADMIN_EMAILS.includes(email))
    return (
      <main className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-5xl mb-4">🔒</p>
          <h1 className="text-2xl font-black">Zona exclusiva del administrador</h1>
          <p className="mt-2 text-sm text-white/60">{email ? `Logueado como ${email} (no admin).` : "Iniciá sesión con la cuenta admin."}</p>
          <Link href="/login" className="mt-4 inline-block text-orange-400">Ir al login →</Link>
        </div>
      </main>
    );

  const activos = negocios.filter((b) => b.activo !== false).length;

  return (
    <main className="min-h-screen bg-[#0d0a12] text-white pb-16">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Link href="/" className="text-sm text-orange-400">← Volver al inicio</Link>
        <h1 className="mt-2 text-3xl font-black">👑 Panel Admin</h1>
        <p className="text-white/60 mt-1">Control total y tráfico real de la plataforma · {email}</p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-3xl font-black text-orange-400">{negocios.length}</p><p className="text-xs text-white/60 mt-1 uppercase">Negocios</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-3xl font-black text-sky-400">{stats.views}</p><p className="text-xs text-white/60 mt-1 uppercase">👁 Vistas (7d)</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-3xl font-black text-green-400">{stats.wa}</p><p className="text-xs text-white/60 mt-1 uppercase">💬 WhatsApp (7d)</p></div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><p className="text-3xl font-black text-pink-400">{stats.shares}</p><p className="text-xs text-white/60 mt-1 uppercase">📤 Compartidos (7d)</p></div>
        </div>

        <h2 className="mt-8 mb-3 text-lg font-black">🏆 Ranking de visitas (7 días)</h2>
        <div className="grid gap-2">
          {stats.ranking.map((r: any, i: number) => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 flex items-center justify-between">
              <p className="text-sm font-bold">{i + 1}. {r.name}</p>
              <p className="text-sm font-black text-orange-400">{r.views} 👁</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 mb-4 text-xl font-black">Negocios ({activos} activos)</h2>
        <div className="grid gap-3">
          {negocios.map((b) => (
            <div key={b.id} className={`rounded-2xl border p-4 flex flex-wrap items-center gap-3 ${b.activo === false ? "border-red-400/40 opacity-70" : "border-white/10 bg-white/5"}`}>
              <div className="flex-1 min-w-[200px]">
                <p className="font-bold">{b.name} {b.status === "verificado" && <span className="text-green-400 text-xs">✓</span>} {b.activo === false && <span className="text-red-400 text-xs">· OCULTO</span>}</p>
                <p className="text-xs text-white/50">{b.category} · /negocio/{b.slug}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => up(b.id, { activo: b.activo === false })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black hover:bg-white/20">
                  {b.activo === false ? "🟢 Activar" : "⚫ Ocultar"}
                </button>
                <button onClick={() => up(b.id, { status: b.status === "verificado" ? "reclamado" : "verificado" })} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-black hover:bg-white/20">
                  {b.status === "verificado" ? "Quitar ✓" : "✓ Verificar"}
                </button>
                <Link href={"/negocio/" + b.slug} target="_blank" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs hover:border-orange-400">👁</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
