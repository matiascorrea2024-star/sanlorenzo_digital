"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const NIVELES_USUARIO = [
  { min: 0, nombre: "Novato del barrio", icon: "🌱" },
  { min: 50, nombre: "Explorador local", icon: "🚶" },
  { min: 150, nombre: "Vecino de la ciudad", icon: "🧭" },
  { min: 300, nombre: "Cazador de ofertas", icon: "🔎" },
  { min: 600, nombre: "Leyenda de San Lorenzo", icon: "👑" },
];

type Stats = { seg: number; res: number; vis: number; cats: number; wa: number; sh: number };

const MEDALLAS: { icon: string; nombre: string; desc: string; cond: (s: Stats) => boolean }[] = [
  { icon: "🏆", nombre: "Primer descubrimiento", desc: "Seguiste tu primer negocio", cond: (s) => s.seg >= 1 },
  { icon: "📍", nombre: "Explorador", desc: "Visitaste 10 negocios distintos", cond: (s) => s.vis >= 10 },
  { icon: "🧭", nombre: "Conocedor", desc: "Visitaste 4 rubros distintos", cond: (s) => s.cats >= 4 },
  { icon: "🛒", nombre: "Vitrinero", desc: "Contactaste 3 negocios por WhatsApp", cond: (s) => s.wa >= 3 },
  { icon: "📣", nombre: "Difusor", desc: "Compartiste 3 negocios", cond: (s) => s.sh >= 3 },
  { icon: "🔥", nombre: "Cazador de ofertas", desc: "Dejaste tu primera reseña", cond: (s) => s.res >= 1 },
  { icon: "💬", nombre: "Voz del barrio", desc: "Dejaste 5 reseñas", cond: (s) => s.res >= 5 },
  { icon: "❤️", nombre: "Coleccionista", desc: "Seguís 10 negocios", cond: (s) => s.seg >= 10 },
  { icon: "👑", nombre: "Leyenda del barrio", desc: "Llegaste a 500 puntos", cond: () => false },
];

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [seguidos, setSeguidos] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ seg: 0, res: 0, vis: 0, cats: 0, wa: 0, sh: 0 });
  const [cargando, setCargando] = useState(true);
  const [misiones, setMisiones] = useState<any>(null);
  const [racha, setRacha] = useState(0);
  const [extra, setExtra] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      setUser(user);
      if (user) {
        const { data: fol } = await sb
          .from("followers").select("business_id, businesses(name, slug)")
          .eq("user_id", user.id);
        const { data: revsData } = await sb
          .from("reviews").select("created_at").eq("user_id", user.id);
        const count = (revsData || []).length;
        const { data: act } = await sb
          .from("user_activity").select("type, business_id, businesses(category), created_at")
          .eq("user_id", user.id);

        const acts = act || [];
        const vistas = new Set(acts.filter((a: any) => a.type === "view").map((a: any) => a.business_id));
        const cats = new Set(acts.filter((a: any) => a.type === "view" && a.businesses).map((a: any) => a.businesses.category));
        const was = new Set(acts.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id));
        const shs = new Set(acts.filter((a: any) => a.type === "share").map((a: any) => a.business_id));

        const hoyStr = new Date().toISOString().slice(0, 10);
        const deHoy = acts.filter((a: any) => (a.created_at || "").slice(0, 10) === hoyStr);
        setMisiones({
          vis: new Set(deHoy.filter((a: any) => a.type === "view").map((a: any) => a.business_id)).size,
          wa: new Set(deHoy.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id)).size,
          sh: new Set(deHoy.filter((a: any) => a.type === "share").map((a: any) => a.business_id)).size,
        });
        const dias = [...new Set(acts.map((a: any) => (a.created_at || "").slice(0, 10)))] as string[];
        let r = 0;
        let cursor = new Date();
        if (!dias.includes(cursor.toISOString().slice(0, 10))) cursor = new Date(Date.now() - 86400000);
        while (dias.includes(cursor.toISOString().slice(0, 10))) { r++; cursor = new Date(cursor.getTime() - 86400000); }
        setRacha(r);
        const hace7 = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
        const semana = acts.filter((a: any) => (a.created_at || "").slice(0, 10) >= hace7);
        const visWeek = new Set(semana.filter((a: any) => a.type === "view").map((a: any) => a.business_id)).size;
        const waWeek = new Set(semana.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id)).size;
        const resWeek = (revsData || []).filter((r2: any) => (r2.created_at || "").slice(0, 10) >= hace7).length;
        let maxRacha = 0, tmp = 0, prev = "";
        for (const d of [...dias].sort()) {
          tmp = prev && (new Date(d + "T00:00:00Z").getTime() - new Date(prev + "T00:00:00Z").getTime()) === 86400000 ? tmp + 1 : 1;
          if (tmp > maxRacha) maxRacha = tmp;
          prev = d;
        }
        setExtra({ visWeek, waWeek, resWeek, maxRacha });
        setSeguidos(fol || []);
        setStats({ seg: (fol || []).length, res: count || 0, vis: vistas.size, cats: cats.size, wa: was.size, sh: shs.size });
      }
      setCargando(false);
    })();
  }, []);

  if (cargando) return <main className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center">Cargando…</main>;

  if (!user)
    return (
      <main className="min-h-screen bg-[#0d0a12] text-white flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-5xl mb-4">🎖</p>
          <h1 className="text-2xl font-black">Tu perfil de vecino</h1>
          <p className="mt-2 text-sm text-white/60">Iniciá sesión para ver tus medallas y niveles.</p>
          <Link href="/login" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black">Ingresar →</Link>
        </div>
      </main>
    );

  const bonusRacha = (extra?.maxRacha || 0) >= 7 ? 50 : 0;
  const bonusSemana = (extra?.visWeek || 0) >= 10 && (extra?.waWeek || 0) >= 3 && (extra?.resWeek || 0) >= 1 ? 40 : 0;
  const puntos = stats.seg * 10 + stats.res * 25 + stats.wa * 15 + stats.sh * 10 + stats.vis * 2 + bonusRacha + bonusSemana;
  let nivel = NIVELES_USUARIO[0];
  for (const n of NIVELES_USUARIO) if (puntos >= n.min) nivel = n;
  const sig = NIVELES_USUARIO[NIVELES_USUARIO.indexOf(nivel) + 1];
  const progreso = sig ? Math.min(100, ((puntos - nivel.min) / (sig.min - nivel.min)) * 100) : 100;

  const medallas = MEDALLAS.map((m) => ({
    ...m,
    ganada: m.nombre === "Leyenda del barrio" ? puntos >= 500 : m.cond(stats),
  }));

  return (
    <main className="bg-[#0d0a12] text-white min-h-screen pb-24">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/" className="text-sm text-orange-400 hover:text-orange-300">← Volver al inicio</Link>

        <div className="mt-4 rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-500 text-3xl font-black">
            {(user.email || "?")[0].toUpperCase()}
          </div>
          <h1 className="mt-3 text-2xl font-black">{nivel.icon} {nivel.nombre}</h1>
          <p className="text-sm text-white/50">{user.email}</p>
          <p className="mt-3 text-3xl font-black text-orange-400">{puntos} <span className="text-sm text-white/50">puntos</span></p>
          {racha > 0 && <p className="mt-1 text-sm font-black text-orange-300">🔥 Racha de {racha} día{racha > 1 ? "s" : ""} seguidos</p>}
          {sig && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${progreso}%` }} />
              </div>
              <p className="mt-1 text-xs text-white/50">Te faltan {sig.min - puntos} pts para {sig.icon} {sig.nombre}</p>
            </div>
          )}
        </div>

        <h2 className="mt-8 mb-3 text-xl font-black">📊 Tu actividad</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-6 text-center">
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-orange-400">{stats.vis}</p><p className="text-[10px] text-white/50 uppercase">Visitas</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-pink-400">{stats.cats}</p><p className="text-[10px] text-white/50 uppercase">Rubros</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-red-400">{stats.seg}</p><p className="text-[10px] text-white/50 uppercase">Seguidos</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-green-400">{stats.wa}</p><p className="text-[10px] text-white/50 uppercase">Contactos</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-sky-400">{stats.sh}</p><p className="text-[10px] text-white/50 uppercase">Compartidos</p></div>
          <div className="rounded-xl bg-white/5 p-3"><p className="text-xl font-black text-yellow-400">{stats.res}</p><p className="text-[10px] text-white/50 uppercase">Reseñas</p></div>
        </div>

        
        
        <h2 className="mt-8 mb-3 text-xl font-black">🎯 Misiones de hoy</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { icon: "👁", txt: "Visitá 3 negocios distintos", act: misiones?.vis || 0, meta: 3 },
            { icon: "💬", txt: "Contactá 1 negocio por WhatsApp", act: misiones?.wa || 0, meta: 1 },
            { icon: "📤", txt: "Compartí 1 oferta", act: misiones?.sh || 0, meta: 1 },
          ].map((m, i) => {
            const done = m.act >= m.meta;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${done ? "border-green-400/50 bg-green-500/10" : "border-white/10 bg-white/5"}`}>
                <p className="text-sm font-bold">{m.icon} {m.txt}</p>
                <p className={`mt-2 text-xs font-black ${done ? "text-green-300" : "text-white/50"}`}>
                  {done ? "✅ ¡Misión cumplida!" : `${Math.min(m.act, m.meta)}/${m.meta} · en progreso`}
                </p>
              </div>
            );
          })}
        </div>

        
        <h2 className="mt-8 mb-3 text-xl font-black">🗓️ Misiones de la semana</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { icon: "👁", txt: "Visitá 10 negocios distintos", act: extra?.visWeek || 0, meta: 10 },
            { icon: "💬", txt: "Contactá 3 negocios", act: extra?.waWeek || 0, meta: 3 },
            { icon: "⭐", txt: "Dejá 1 reseña", act: extra?.resWeek || 0, meta: 1 },
          ].map((m, i) => {
            const done = m.act >= m.meta;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${done ? "border-green-400/50 bg-green-500/10" : "border-white/10 bg-white/5"}`}>
                <p className="text-sm font-bold">{m.icon} {m.txt}</p>
                <p className={`mt-2 text-xs font-black ${done ? "text-green-300" : "text-white/50"}`}>
                  {done ? "✅ ¡Hecha!" : `${m.act}/${m.meta} · en progreso`}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-xs text-white/70">
          🎁 Premios reales: racha de 7 días = <strong className="text-yellow-300">+50 pts</strong> · completar las 3 semanales = <strong className="text-yellow-300">+40 pts</strong>
        </div>

        <h2 className="mt-8 mb-3 text-xl font-black">🎁 Premios por nivel — ¿hasta dónde llegás?</h2>
        <div className="grid gap-2">
          {[
            { ...NIVELES_USUARIO[0], premios: ["🗺️ Descubrís todos los negocios de la ciudad", "⭐ Sumás puntos por explorar, contactar y opinar"] },
            { ...NIVELES_USUARIO[1], premios: ["🎖 Badge 'Explorador' visible en tus reseñas", "🔔 Avisos prioritarios de ofertas que seguís"] },
            { ...NIVELES_USUARIO[2], premios: ["🎟️ Entrás al sorteo mensual de ofertas", "🎖 Badge 'Vecino' en tus reseñas"] },
            { ...NIVELES_USUARIO[3], premios: ["🎟️ Doble entrada en los sorteos", "🔥 Acceso a ofertas secretas solo para cazadores", "🎖 Badge dorado en tus reseñas"] },
            { ...NIVELES_USUARIO[4], premios: ["👑 Podio eterno en el ranking del barrio", "🎟️ 5 entradas en los sorteos", "💎 Badge diamante en toda la plataforma"] },
          ].map((n) => {
            const esActual = n.nombre === nivel.nombre;
            const bloqueado = puntos < n.min;
            return (
              <div key={n.nombre} className={`rounded-2xl border p-4 ${esActual ? "border-orange-400/60 bg-orange-500/10" : bloqueado ? "border-white/10 bg-white/5 opacity-50" : "border-green-400/40 bg-green-500/10"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-black">{n.icon} {n.nombre} <span className="text-xs text-white/50">· {n.min} pts</span></p>
                  <p className="text-xs font-bold">{esActual ? "📍 Tu nivel" : bloqueado ? "🔒" : "✅"}</p>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-white/70">
                  {n.premios.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 mb-3 text-xl font-black">🎖 Tus medallas</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {medallas.map((m, i) => (
            <div key={i} className={`rounded-2xl border p-4 text-center ${m.ganada ? "border-yellow-400/50 bg-yellow-500/10" : "border-white/10 bg-white/5 opacity-40"}`}>
              <p className="text-3xl">{m.ganada ? m.icon : "🔒"}</p>
              <p className="mt-1 text-sm font-black">{m.nombre}</p>
              <p className="text-[10px] text-white/50">{m.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 mb-3 text-xl font-black">❤️ Negocios que seguís</h2>
        <div className="grid gap-2">
          {seguidos.map((f: any) => (
            <Link key={f.business_id} href={"/negocio/" + (f.businesses?.slug || "")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold hover:border-orange-400/60">
              {f.businesses?.name || "Negocio"}
            </Link>
          ))}
          {seguidos.length === 0 && (
            <p className="text-sm text-white/50">Todavía no seguís ningún negocio. Tocá ⭐ Seguir en cualquier miniweb para empezar.</p>
          )}
        </div>
        <div className="mt-10 text-center">
          <Link href="/vecinos" className="text-sm font-black text-orange-400 hover:text-orange-300">👥 Ver ranking de vecinos →</Link>
        </div>
      </div>
    </main>
  );
}
