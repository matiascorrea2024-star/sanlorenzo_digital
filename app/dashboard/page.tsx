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
import LiveVisitors from "@/components/dashboard/live-visitors";
import GrowthCenter from "@/components/dashboard/growth-center";
import CommercialCalendar from "@/components/dashboard/commercial-calendar";
import QrVidriera from "@/components/dashboard/qr-vidriera";

export default function DashboardPage() {
  const { show } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("user");
  const [nombre, setNombre] = useState("");
  const [ofertasActivas, setOfertasActivas] = useState(0);

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
      const { data, error: queryError } = await q;
      if (queryError) setError("No pudimos cargar tu panel. Revisá tu conexión e intentá de nuevo.");
      setNegocios(data || []);
      setLoading(false);
    })();
  }, [user, authLoading]);

  // Conteo real de ofertas activas del primer negocio (mismo criterio que BusinessPulse: active=true).
  useEffect(() => {
    const bid = negocios[0]?.id;
    if (!bid) { setOfertasActivas(0); return; }
    supabase().from("offers").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("active", true)
      .then(({ count }) => setOfertasActivas(count || 0));
  }, [negocios]);

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
        <Link href="/login" className="mt-6 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-black text-white hover:bg-[var(--accent2)]">Ingresar →</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Hero editorial personalizado -- reemplaza al PageHero genérico
          solo en esta página, calco del mockup aprobado ("Hola, [nombre].
          Tu pulso hoy."), sin inventar métricas que no existen. */}
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-12 sm:px-6">
        <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent-ink)]">Panel de comerciante</p>
        <h1 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-tight sm:text-4xl">
          {nombre ? `Hola, ${nombre}.` : "Tu panel."}<br />
          <span className="text-[var(--accent-ink)]">Tu negocio, sin vueltas.</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-[var(--muted)]">Control rápido: abrí, cerrá y manejá tus ofertas desde acá.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard/nuevo" className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-black text-white hover:bg-[var(--accent2)]">+ Crear negocio</Link>
          {role === "admin" && (
            <Link href="/admin" className="rounded-full border border-[var(--bad)]/40 bg-[var(--bad)]/10 px-6 py-3 text-sm font-bold text-[var(--bad)] hover:bg-[var(--bad)]/20">🛡️ Panel admin</Link>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <DashboardNav />
        {error && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-[var(--bad)]/30 bg-[var(--bad)]/10 px-4 py-3 text-sm text-[var(--bad)]">
            <span>{error}</span>
            <button type="button" onClick={() => window.location.reload()} className="font-bold underline">Reintentar</button>
          </div>
        )}
        {loading ? (
          <p className="py-16 text-center text-[var(--muted)]">Cargando tus negocios…</p>
        ) : negocios.length === 0 ? (
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-b from-[var(--ov-08)] to-[var(--ov-03)] p-10 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)]/15 text-5xl">🏪</div>
            <h2 className="mt-4 text-2xl font-black">Empezá acá</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">3 pasos y tu negocio ya está funcionando en La Gran Barata Digital.</p>
            <ol className="mx-auto mt-6 max-w-sm space-y-3 text-left">
              <li className="flex items-start gap-3 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-black text-white">1</span>
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
            <Link href="/dashboard/nuevo" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-black text-white hover:bg-[var(--accent2)] transition">
              <span>✨</span>
              <span>Empezar: crear mi negocio →</span>
            </Link>
          </div>
        ) : (
          <>
          <PlanLimitBanner />
          <BusinessStats />
          <div className="mb-8 grid gap-4 lg:grid-cols-2">
            <GrowthCenter business={negocios[0]} ofertasActivas={ofertasActivas} />
            <CommercialCalendar />
          </div>
          <LiveVisitors businessId={negocios[0]?.id} />
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
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${b.status === "verificado" ? "border border-emerald-400/20 bg-emerald-400/10 text-[var(--ok)]" : "border border-amber-400/20 bg-amber-400/10 text-[var(--warn)]"}`}>
                    {b.status === "verificado" ? "✓ VERIFICADO" : (b.status || "pendiente")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggle(b.id, "open", !b.open)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-black transition ${b.open ? "bg-emerald-500/20 text-[var(--ok)] border border-emerald-400/30" : "bg-rose-500/20 text-[var(--bad)] border border-rose-400/30"}`}
                  >
                    {b.open ? "🟢 Abierto" : "🔴 Cerrado"}
                  </button>
                  <button
                    onClick={() => toggle(b.id, "ofertas_al_cerrar", b.ofertas_al_cerrar === false)}
                    className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition ${b.ofertas_al_cerrar !== false ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-ink)]" : "border-[var(--line)] bg-[var(--ov-05)] text-[var(--muted)]"}`}
                    title="Si cerrás el local, tus ofertas siguen visibles"
                  >
                    {b.ofertas_al_cerrar !== false ? "🔥 Ofertas siguen al cerrar" : "⏸️ Ofertas solo abierto"}
                  </button>
                </div>

                {/* Antes cada tarjeta de negocio repetía 6 accesos más
                    (Ofertas, Mensajes, Productos, Reseñas, Historias,
                    Estadísticas) -- pero esos links NO eran específicos
                    de este negocio (mismo href en las 3 tarjetas si
                    tenías 3 negocios) y ya están, mejor explicados, en
                    la grilla de arriba (DashboardNav). Acá queda solo
                    lo que sí depende de ESTE negocio puntual. */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Link href={`/dashboard/editar/${b.slug}`} className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">✏️ Editar</Link>
                  <Link href={`/negocio/${b.slug}`} className="rounded-xl border border-[var(--line-strong)] px-2 py-2 text-center text-xs font-bold hover:bg-[var(--ov-05)]">👁 Ver</Link>
                  <button
                    onClick={() => {
                      const url = `https://sanlorenzodigital.vercel.app/negocio/${b.slug}`;
                      const texto = `🏪 Estamos en La Gran Barata Digital\nMirá nuestro negocio, ofertas y productos:\n${url}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
                    }}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2 py-2 text-center text-xs font-bold text-[var(--ok)] hover:bg-emerald-500/20"
                  >
                    📲 Compartir
                  </button>
                </div>

                <div className="mt-3">
                  <QrVidriera businessId={b.id} businessName={b.name} />
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
