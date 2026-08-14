"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Users, Store, Flame, TrendingUp, CheckCircle2, XCircle, Star, CreditCard, MapPin, Eye, Upload, Flag, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import OnlineBadge from "@/components/ui/online-badge";
import AdminVisits from "@/components/admin/visits";
import Badge from "@/components/ui/badge";

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("user");
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
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

      const [u, b, o, v, pv, pend, rev, sb, ciu, fol, uList, rep] = await Promise.all([
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
        supabase().from("reports").select("*, businesses(name, slug)").order("created_at", { ascending: false }).limit(30),
      ]);

      setStats({
        users: u.count || 0, businesses: b.count || 0,
        offers: o.count || 0, reviews: v.count || 0, views: pv.count || 0,
        seguidores: fol.count || 0, usersRecent: uList.data || [],
      });
      setPendientes(pend.data || []);
      setResenas(rev.data || []);
      setSubs(sb.data || []);
      setCiudades(ciu.data || []);
      setReportes(rep.data || []);
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

  const TABS = [
    { k: "overview", l: "Overview", icon: TrendingUp, count: 0 },
    { k: "verificacion", l: "Verificación", icon: Shield, count: pendientes.length },
    { k: "moderacion", l: "Moderación", icon: Star, count: 0 },
    { k: "reportes", l: "Reportes", icon: Flag, count: reportes.length },
    { k: "suscripciones", l: "Suscripciones", icon: CreditCard, count: 0 },
    { k: "ciudades", l: "Ciudades", icon: MapPin, count: 0 },
    { k: "cargar-bulk", l: "Cargar masiva", icon: Upload, count: 0 },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0710] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-red-400" />
          <p className="mt-4 text-sm text-white/50">Cargando panel de administración…</p>
        </div>
      </main>
    );
  }

  const cards = [
    { icon: Users, label: "Usuarios", value: stats.users, color: "text-sky-400", bg: "from-sky-500/10" },
    { icon: Store, label: "Negocios", value: stats.businesses, color: "text-green-400", bg: "from-green-500/10" },
    { icon: Flame, label: "Ofertas", value: stats.offers, color: "text-orange-400", bg: "from-orange-500/10" },
    { icon: Star, label: "Reseñas", value: stats.reviews, color: "text-yellow-400", bg: "from-yellow-500/10" },
    { icon: Eye, label: "Visitas", value: stats.views, color: "text-pink-400", bg: "from-pink-500/10" },
    { icon: Heart, label: "Seguidores", value: stats.seguidores, color: "text-purple-400", bg: "from-purple-500/10" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0710] text-white pb-24">
      <div className="border-b border-white/5 bg-gradient-to-b from-red-950/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Shield className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black md:text-3xl">Panel de administración</h1>
              <p className="text-sm text-white/50">San Lorenzo Digital · control total de la plataforma</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); router.replace(`/admin?tab=${t.k}`); }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                tab === t.k ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/20" : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/25 hover:bg-white/5"
              }`}>
              <t.icon className="h-3.5 w-3.5" /> {t.l}
              {t.count > 0 && (
                <span className={`ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${tab === t.k ? "bg-black/25 text-white" : "bg-red-500 text-white"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="mt-6 space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cards.map(c => (
                <div key={c.label} className={`rounded-2xl border border-white/10 bg-gradient-to-b ${c.bg} to-transparent p-5 text-center transition hover:border-white/20`}>
                  <c.icon className={`mx-auto h-6 w-6 ${c.color}`} />
                  <p className="mt-2 text-2xl font-black tabular-nums md:text-3xl">{c.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{c.label}</p>
                </div>
              ))}
            </div>

            <AdminVisits />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">👥 Últimos usuarios registrados</h3>
                <span className="text-xs text-white/40">{stats.usersRecent?.length || 0}</span>
              </div>
              {!stats.usersRecent?.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center text-sm text-white/40">
                  Todavía no hay usuarios registrados.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.03]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">Usuario</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">Rol</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">Alta</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.usersRecent.map((u: any) => (
                        <tr key={u.user_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                          <td className="px-4 py-3 text-xs font-semibold">{u.display_name || u.user_id.slice(0, 8) + "…"}</td>
                          <td className="px-4 py-3 text-xs capitalize text-white/60">{u.role}</td>
                          <td className="px-4 py-3 text-xs text-white/50">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                          <td className="px-4 py-3"><OnlineBadge lastSeen={u.last_seen_at} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VERIFICACIÓN */}
        {tab === "verificacion" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Negocios pendientes de verificación <span className="text-white/40">({pendientes.length})</span></h2>
            {pendientes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/60" />
                <p className="mt-3 font-bold text-white/70">Todo verificado</p>
                <p className="mt-1 text-sm text-white/40">No hay negocios pendientes ahora mismo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendientes.map(p => (
                  <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="truncate text-xs capitalize text-white/50">{p.category} · {p.address || "sin dirección"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:ml-auto sm:shrink-0">
                      <button onClick={() => verificar(p.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-green-500/15 px-4 py-2 text-xs font-black text-green-300 hover:bg-green-500/25 sm:flex-none">
                        <CheckCircle2 className="h-4 w-4" /> Verificar
                      </button>
                      <button onClick={() => rechazar(p.id)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/25 sm:flex-none">
                        <XCircle className="h-4 w-4" /> Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODERACIÓN */}
        {tab === "moderacion" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Últimas reseñas <span className="text-white/40">({resenas.length})</span></h2>
            {resenas.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <Star className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Aún no hay reseñas para moderar.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resenas.map(r => (
                  <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.reviewer_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{r.reviewer_name} <span className="text-yellow-400">{"★".repeat(r.rating)}</span></p>
                        <p className="text-sm text-white/70">{r.comment}</p>
                      </div>
                    </div>
                    <button onClick={() => borrarResena(r.id)}
                      className="rounded-xl bg-red-500/15 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/25 sm:ml-auto sm:shrink-0">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUSCRIPCIONES */}
        {tab === "suscripciones" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Suscripciones activas <span className="text-white/40">({subs.length})</span></h2>
            {subs.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Aún no hay suscripciones pagas. Cuando actives pagos, acá vas a ver los ingresos.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {subs.map(s => (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <CreditCard className="h-6 w-6 shrink-0 text-orange-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{(s as any).businesses?.name || "Negocio"}</p>
                      <p className="text-xs capitalize text-white/50">Plan {s.plan} · {new Date(s.started_at).toLocaleDateString("es-AR")}</p>
                    </div>
                    <Badge variant={s.plan === "premium" ? "warning" : "success"} size="sm">{s.plan}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTES */}
        {tab === "reportes" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Reportes de la comunidad <span className="text-white/40">({reportes.length})</span></h2>
            {reportes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <Flag className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">No hay reportes pendientes. La comunidad confía en el directorio ✅</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {reportes.map(r => (
                  <div key={r.id} className="rounded-2xl border border-red-400/20 bg-red-500/[0.04] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex items-start gap-3">
                        <Flag className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{(r as any).businesses?.name || "Negocio"} <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-300">{r.reason}</span></p>
                          {r.details && <p className="mt-1 text-sm text-white/70">&quot;{r.details}&quot;</p>}
                          <p className="mt-1 text-xs text-white/40">{new Date(r.created_at).toLocaleDateString("es-AR")}</p>
                        </div>
                      </div>
                      <button onClick={() => resolverReporte(r.id)}
                        className="rounded-xl bg-green-500/15 px-4 py-2 text-xs font-black text-green-300 hover:bg-green-500/25 sm:ml-auto sm:shrink-0">
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CARGAR BULK */}
        {tab === "cargar-bulk" && (
          <div className="mt-6 rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-pink-500/5 p-6">
            <Upload className="h-8 w-8 text-orange-400" />
            <p className="mt-3 text-lg font-black">Cargar masiva de negocios reales</p>
            <p className="mt-1 text-sm text-white/70">
              Subí negocios reales de San Lorenzo desde un CSV. Quedarán en estado &quot;pendiente&quot; para verificación.
            </p>
            <a href="/admin/cargar-bulk"
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 text-sm font-black hover:opacity-90">
              Ir a la herramienta de carga →
            </a>
          </div>
        )}

        {/* CIUDADES */}
        {tab === "ciudades" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Ciudades de la plataforma <span className="text-white/40">({ciudades.length})</span></h2>
            {ciudades.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Todavía no hay ciudades cargadas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ciudades.map(c => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <MapPin className="h-6 w-6 shrink-0 text-sky-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{c.name}</p>
                      <p className="text-xs text-white/50">/{c.slug}</p>
                    </div>
                    <button onClick={() => toggleCiudad(c.id, c.active)}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black transition ${
                        c.active ? "bg-green-500/15 text-green-300" : "bg-white/5 text-white/40"
                      }`}>
                      {c.active ? "🟢 Activa" : "⚪ Inactiva"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-white/40">
              Las ciudades inactivas no aparecen públicamente hasta que tengan contenido suficiente.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
