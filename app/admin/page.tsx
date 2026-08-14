"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, Store, Flame, TrendingUp, CheckCircle2, XCircle, Star, CreditCard, MapPin, Eye, Upload, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import OnlineBadge from "@/components/ui/online-badge";
import AdminVisits from "@/components/admin/visits";
import Badge from "@/components/ui/badge";

const TABS = [
  { k: "overview", l: "📊 Overview", icon: TrendingUp },
  { k: "verificacion", l: "🛡️ Verificación", icon: Shield },
  { k: "moderacion", l: "⭐ Moderación", icon: Star },
  { k: "suscripciones", l: "💳 Suscripciones", icon: CreditCard },
  { k: "ciudades", l: "🗺️ Ciudades", icon: MapPin },
  { k: "cargar-bulk", l: "📥 Cargar masiva", icon: Upload },
  { k: "reportes", l: "🚩 Reportes", icon: Flag },
];

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("user");
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState<any>({});
  const [pendientes, setPendientes] = useState<any[]>([]);
  const [resenas, setResenas] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [reportes, setReportes] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase().auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase().from("user_profiles")
        .select("role").eq("user_id", user.id).maybeSingle();
      const r = prof?.role || "user";
      setRole(r);
      if (r !== "admin") { router.push("/"); return; }

      // Cargar todo
      const [u, b, o, v, pv, pend, rev, sb, ciu, fol, uList] = await Promise.all([
        supabase().from("user_profiles").select("*", { count: "exact", head: true }),
        supabase().from("businesses").select("*", { count: "exact", head: true }),
        supabase().from("offers").select("*", { count: "exact", head: true }),
        supabase().from("business_reviews").select("*", { count: "exact", head: true }),
        supabase().from("page_views").select("*", { count: "exact", head: true }),
        supabase().from("businesses").select("*").neq("status", "verificado").limit(20),
        supabase().from("business_reviews").select("*").order("created_at", { ascending: false }).limit(20),
        supabase().from("subscriptions").select("*, businesses(name)").order("started_at", { ascending: false }).limit(20),
        supabase().from("locations").select("*").eq("type", "city"),
        supabase().from("followers").select("*", { count: "exact", head: true }),
        supabase().from("user_profiles").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      setStats({
        users: u.count || 0, businesses: b.count || 0,
        offers: o.count || 0, reviews: v.count || 0, views: pv.count || 0,
      });
      setPendientes(pend.data || []);
      setResenas(rev.data || []);
      setSubs(sb.data || []);
      setCiudades(ciu.data || []);
      const { data: rep } = await supabase().from("reports")
        .select("*, businesses(name, slug)").order("created_at", { ascending: false }).limit(30);
      setReportes(rep || []);
      setLoading(false);
    })();
  }, []);

  // El navegador manda las cookies de sesión de Supabase automáticamente
  // (mismo origen); el servidor las lee vía lib/supabase-server.ts, igual
  // que ya hacen las rutas de app/api/coupons/*.
  const authedFetch = async (url: string, method: string, body: any) => {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `Error ${res.status}`);
    }
    return res.json();
  };

  const verificar = async (id: string) => {
    try {
      await authedFetch("/api/admin/businesses", "PATCH", { id, status: "verificado" });
      setPendientes(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const rechazar = async (id: string) => {
    try {
      await authedFetch("/api/admin/businesses", "PATCH", { id, status: "rechazado" });
      setPendientes(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const borrarResena = async (id: string) => {
    if (!confirm("¿Eliminar esta reseña?")) return;
    try {
      await authedFetch("/api/admin/reviews", "DELETE", { id });
      setResenas(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const resolverReporte = async (id: string) => {
    try {
      await authedFetch("/api/admin/reports", "PATCH", { id });
      setReportes(prev => prev.filter(r => r.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const toggleCiudad = async (id: string, active: boolean) => {
    try {
      await authedFetch("/api/admin/locations", "PATCH", { id, active: !active });
      setCiudades(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    } catch (e: any) { alert(e.message); }
  };

  if (loading) {
    return <main className="min-h-screen bg-[#0a0710] flex items-center justify-center text-white">Cargando admin...</main>;
  }

  const cards = [
    { icon: Users, label: "Usuarios", value: stats.users, color: "text-sky-400" },
    { icon: Store, label: "Negocios", value: stats.businesses, color: "text-green-400" },
    { icon: Flame, label: "Ofertas", value: stats.offers, color: "text-orange-400" },
    { icon: Star, label: "Reseñas", value: stats.reviews, color: "text-yellow-400" },
    { icon: Eye, label: "Visitas", value: stats.views, color: "text-pink-400" },
    { icon: MapPin, label: "Seguidores", value: stats.seguidores || 0, color: "text-purple-400" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-400" />
          <div>
            <h1 className="text-3xl font-black">Panel de Administración</h1>
            <p className="text-white/60">Control total de la plataforma</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                tab === t.k ? "bg-gradient-to-r from-red-500 to-orange-500" : "border border-white/15 bg-white/5 text-white/70"
              }`}>
              {t.l}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && <AdminVisits />}
        {tab === "overview" && stats.usersRecent && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-black">👥 Últimos 20 usuarios</h3>
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Fecha</th>
                    <th className="px-4 py-2 text-left text-xs font-bold text-white/60">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.usersRecent.map((u: any) => (
                    <tr key={u.user_id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-2 text-xs">{u.email || u.user_id.slice(0, 8) + "…"}</td>
                      <td className="px-4 py-2 text-xs capitalize">{u.role}</td>
                      <td className="px-4 py-2 text-xs text-white/50">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                      <td className="px-4 py-2"><OnlineBadge lastSeen={u.last_seen_at} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "overview" && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {cards.map(c => (
              <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <c.icon className={`mx-auto h-6 w-6 ${c.color}`} />
                <p className="mt-2 text-3xl font-black">{c.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{c.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* VERIFICACIÓN */}
        {tab === "verificacion" && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-black">Negocios pendientes de verificación ({pendientes.length})</h2>
            {pendientes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                No hay negocios pendientes. Todo verificado ✅
              </div>
            ) : (
              pendientes.map(p => (
                <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Avatar name={p.name} size={44} />
                  <div className="flex-1">
                    <p className="font-bold">{p.name}</p>
                    <p className="text-xs capitalize text-white/50">{p.category} · {p.address || "sin dirección"}</p>
                  </div>
                  <button onClick={() => verificar(p.id)}
                    className="flex items-center gap-1 rounded-xl bg-green-500/20 px-4 py-2 text-xs font-black text-green-300 hover:bg-green-500/30">
                    <CheckCircle2 className="h-4 w-4" /> Verificar
                  </button>
                  <button onClick={() => rechazar(p.id)}
                    className="flex items-center gap-1 rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/30">
                    <XCircle className="h-4 w-4" /> Rechazar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* MODERACIÓN */}
        {tab === "moderacion" && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-black">Últimas reseñas ({resenas.length})</h2>
            {resenas.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                Aún no hay reseñas para moderar.
              </div>
            ) : (
              resenas.map(r => (
                <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Avatar name={r.reviewer_name} size={40} />
                  <div className="flex-1">
                    <p className="font-bold">{r.reviewer_name} <span className="text-yellow-400">{"★".repeat(r.rating)}</span></p>
                    <p className="text-sm text-white/70">{r.comment}</p>
                  </div>
                  <button onClick={() => borrarResena(r.id)}
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/30">
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* SUSCRIPCIONES */}
        {tab === "suscripciones" && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-black">Suscripciones activas ({subs.length})</h2>
            {subs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                Aún no hay suscripciones pagas. Cuando actives pagos, acá vas a ver los ingresos.
              </div>
            ) : (
              subs.map(s => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <CreditCard className="h-6 w-6 text-orange-400" />
                  <div className="flex-1">
                    <p className="font-bold">{(s as any).businesses?.name || "Negocio"}</p>
                    <p className="text-xs capitalize text-white/50">Plan {s.plan} · {new Date(s.started_at).toLocaleDateString("es-AR")}</p>
                  </div>
                  <Badge variant={s.plan === "premium" ? "warning" : "success"} size="sm">
                    {s.plan}
                  </Badge>
                </div>
              ))
            )}
          </div>
        )}

        {/* REPORTES */}
        {tab === "reportes" && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-black">Reportes de la comunidad ({reportes.length})</h2>
            {reportes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/50">
                No hay reportes pendientes. La comunidad confía en el directorio ✅
              </div>
            ) : (
              reportes.map(r => (
                <div key={r.id} className="rounded-2xl border border-red-400/30 bg-red-500/5 p-4">
                  <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 shrink-0 text-red-400" />
                    <div className="flex-1">
                      <p className="font-bold">{(r as any).businesses?.name || "Negocio"} <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-300">{r.reason}</span></p>
                      {r.details && <p className="mt-1 text-sm text-white/70">&quot;{r.details}&quot;</p>}
                      <p className="mt-1 text-xs text-white/40">{new Date(r.created_at).toLocaleDateString("es-AR")}</p>
                    </div>
                    <button onClick={() => resolverReporte(r.id)}
                      className="rounded-xl bg-green-500/20 px-4 py-2 text-xs font-black text-green-300 hover:bg-green-500/30">
                      Resolver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* CARGAR BULK */}
        {tab === "cargar-bulk" && (
          <div className="mt-6 rounded-2xl border border-orange-400/40 bg-orange-500/10 p-6">
            <p className="font-black text-lg mb-2">📥 Cargar masiva de negocios reales</p>
            <p className="text-sm text-white/70 mb-4">
              Subí negocios reales de San Lorenzo desde un CSV. Quedarán en estado &quot;pendiente&quot; para verificación.
            </p>
            <a href="/admin/cargar-bulk"
              className="inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
              Ir a la herramienta de carga →
            </a>
          </div>
        )}

        {/* CIUDADES */}
        {tab === "ciudades" && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-black">Ciudades de la plataforma</h2>
            {ciudades.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <MapPin className="h-6 w-6 text-sky-400" />
                <div className="flex-1">
                  <p className="font-bold">{c.name}</p>
                  <p className="text-xs text-white/50">/{c.slug}</p>
                </div>
                <button onClick={() => toggleCiudad(c.id, c.active)}
                  className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                    c.active ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/50"
                  }`}>
                  {c.active ? "🟢 Activa" : "⚪ Inactiva"}
                </button>
              </div>
            ))}
            <p className="text-xs text-white/40">
              Las ciudades inactivas no aparecen públicamente hasta que tengan contenido suficiente.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
