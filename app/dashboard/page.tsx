"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/toast";
import { friendlyError } from "@/lib/friendly-error";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import BusinessPulse from "@/components/dashboard/business-pulse";
import BusinessStats from "@/components/dashboard/business-stats";
import PlanLimitBanner from "@/components/dashboard/plan-limit-banner";

export default function DashboardPage() {
  const { show } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("user");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    (async () => {
      const sb = supabase();
      const { data: prof } = await sb.from("user_profiles")
        .select("role, display_name").eq("user_id", user.id).maybeSingle();
      const r = prof?.role || "user";
      setRole(r);
      setNombre(prof?.display_name || (user.email || "").split("@")[0] || "");
      const q = sb.from("businesses").select("*").order("name");
      if (r !== "admin") q.eq("owner_id", user.id);
      const { data } = await q;
      setNegocios(data || []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  const toggle = async (id: string, campo: string, valor: any) => {
    const { error } = await supabase().from("businesses").update({ [campo]: valor }).eq("id", id);
    if (error) { show(`❌ ${friendlyError(error, "No se pudo actualizar.")}`, "error"); return; }
    setNegocios(prev => prev.map(b => (b.id === id ? { ...b, [campo]: valor } : b)));
    show(`✅ ${campo === "open" ? (valor ? "Negocio abierto" : "Negocio cerrado") : "Ofertas actualizadas"}`, "success");
  };

  if (!loading && !user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-4 text-center text-[var(--text)]">
        <p className="text-5xl">🔐</p>
        <h1 className="mt-4 text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Iniciá sesión para gestionar tus negocios</h1>
        <Link href="/login" className="mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black">Ingresar →</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Hero editorial personalizado -- reemplaza al PageHero genérico
          solo en esta página, calco del mockup aprobado ("Hola, [nombre].
          Tu pulso hoy."), sin inventar métricas que no existen. */}
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-12 sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[.4em] text-orange-400">Panel de comerciante</p>
        <h1 className="mt-3 text-4xl font-bold leading-[0.95] tracking-tight sm:text-5xl md:text-6xl" style={{ fontFamily: "var(--font-space)" }}>
          {nombre ? `Hola, ${nombre}.` : "Tu panel."}<br />
          <span className="text-orange-500">Tu negocio, sin vueltas.</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-[var(--muted)]">Control rápido: abrí, cerrá y manejá tus ofertas desde acá.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/nuevo" className="rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90">+ Crear negocio</Link>
          {role === "admin" && (
            <Link href="/admin" className="rounded-full border border-red-400/40 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-300 hover:bg-red-500/20">🛡️ Panel admin</Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <DashboardNav />
        {loading ? (
          <p className="py-16 text-center text-[var(--muted)]">Cargando tus negocios…</p>
        ) : negocios.length === 0 ? (
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-b from-white/[.07] to-white/[.03] p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500/20 to-red-600/20 text-5xl">🏪</div>
            <h2 className="mt-4 text-2xl font-black">Empezá acá</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">3 pasos y tu negocio ya está funcionando en La Gran Barata Digital.</p>
            <ol className="mx-auto mt-6 max-w-sm space-y-3 text-left">
              <li className="flex items-start gap-3 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xs font-black">1</span>
                <div><p className="text-sm font-bold">Completá tu negocio</p><p className="text-xs text-[var(--muted)]">Nombre, rubro, WhatsApp y ubicación.</p></div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ov-10)] text-xs font-black text-[var(--muted)]">2</span>
                <div><p className="text-sm font-bold">Publicá tu primera oferta</p><p className="text-xs text-[var(--muted)]">Aparece al instante en toda la plataforma.</p></div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--ov-10)] text-xs font-black text-[var(--muted)]">3</span>
                <div><p className="text-sm font-bold">Compartí tu página</p><p className="text-xs text-[var(--muted)]">Mandala por WhatsApp a tus clientes.</p></div>
              </li>
            </ol>
            <Link href="/dashboard/nuevo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90 transition">
              <span>✨</span>
              <span>Empezar: crear mi negocio →</span>
            </Link>
          </div>
        ) : (
          <>
          <PlanLimitBanner />
          <BusinessStats />
          <BusinessPulse negocio={negocios[0]} />
          <div className="grid gap-4 md:grid-cols-2">
            {negocios.map((b) => (
              <div key={b.id} className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-4 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{b.name}</h3>
                    <p className="text-xs capitalize text-[var(--muted)]">{b.category} · {b.address}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${b.status === "verificado" ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                    {b.status === "verificado" ? "✓ VERIFICADO" : (b.status || "pendiente")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggle(b.id, "open", !b.open)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${b.open ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-rose-500/20 text-rose-300 border border-rose-400/30"}`}
                  >
                    {b.open ? "🟢 Abierto" : "🔴 Cerrado"}
                  </button>
                  <button
                    onClick={() => toggle(b.id, "ofertas_al_cerrar", b.ofertas_al_cerrar === false)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${b.ofertas_al_cerrar !== false ? "border-orange-400/30 bg-orange-500/10 text-orange-300" : "border-[var(--line)] bg-[var(--ov-05)] text-[var(--muted)]"}`}
                    title="Si cerrás el local, tus ofertas siguen visibles"
                  >
                    {b.ofertas_al_cerrar !== false ? "🔥 Ofertas siguen al cerrar" : "⏸️ Ofertas solo abierto"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link href={`/dashboard/editar/${b.slug}`} className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">✏️ Editar</Link>
                  <Link href={`/negocio/${b.slug}`} className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">👁 Ver</Link>
                  <Link href="/dashboard/ofertas" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">🔥 Ofertas</Link>
                  <Link href="/dashboard/mensajes" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">💬 Mensajes</Link>
                  <Link href="/dashboard/productos" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">📦 Productos</Link>
                  <Link href="/dashboard/resenas" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">⭐ Reseñas</Link>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Link href="/dashboard/historias" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">📸 Historias</Link>
                  <Link href="/dashboard/analytics" className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">📊 Estadísticas</Link>
                  <button
                    onClick={() => {
                      const url = `https://sanlorenzodigital.vercel.app/negocio/${b.slug}`;
                      const texto = `🏪 Estamos en La Gran Barata Digital\nMirá nuestro negocio, ofertas y productos:\n${url}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
                    }}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2 py-2 text-center text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    📲 Compartir
                  </button>
                </div>
              </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </main>
  );
}
