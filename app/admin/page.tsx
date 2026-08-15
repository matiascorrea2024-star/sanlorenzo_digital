"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Users, Store, Flame, TrendingUp, CheckCircle2, XCircle, Star, CreditCard, MapPin, Eye, Upload, Flag, Heart, Newspaper, Search, Trash2, Pencil } from "lucide-react";
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
  const [nuevaCiudad, setNuevaCiudad] = useState({ nombre: "", lat: "", lon: "" });
  const [creandoCiudad, setCreandoCiudad] = useState(false);
  const [barrioAbierto, setBarrioAbierto] = useState<string | null>(null);
  const [nuevoBarrio, setNuevoBarrio] = useState("");
  const [editandoCiudad, setEditandoCiudad] = useState<string | null>(null);
  const [nombreCiudadEdit, setNombreCiudadEdit] = useState("");

  // Negocios y ofertas se cargan bajo demanda al abrir la pestaña --
  // son listas que pueden crecer mucho, no tiene sentido pedirlas
  // junto con el resto del overview.
  const [negocios, setNegocios] = useState<any[]>([]);
  const [negociosCargados, setNegociosCargados] = useState(false);
  const [qNegocios, setQNegocios] = useState("");
  const [ofertasAdmin, setOfertasAdmin] = useState<any[]>([]);
  const [ofertasCargadas, setOfertasCargadas] = useState(false);
  const [qOfertas, setQOfertas] = useState("");

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

      // Cantidad real de negocios por ciudad -- una sola consulta
      // agrupada en el cliente, no N+1.
      const cityIds = (ciu.data || []).map((c: any) => c.id);
      if (cityIds.length) {
        const { data: bizRows } = await supabase().from("businesses").select("location_id").in("location_id", cityIds);
        const counts: Record<string, number> = {};
        (bizRows || []).forEach((r: any) => { if (r.location_id) counts[r.location_id] = (counts[r.location_id] || 0) + 1; });
        setCiudades((prev) => prev.map((c) => ({ ...c, _negocios: counts[c.id] || 0 })));
      }
    })();
  }, []);

  useEffect(() => {
    if (tab === "negocios" && !negociosCargados) {
      (async () => {
        const { data } = await supabase().from("businesses").select("id, name, slug, category, status, activo, destacado, owner_id").order("created_at", { ascending: false }).limit(300);
        setNegocios(data || []);
        setNegociosCargados(true);
      })();
    }
    if (tab === "ofertas" && !ofertasCargadas) {
      (async () => {
        // Tabla real (no la vista offers_with_business, que solo
        // muestra active=true) -- el admin necesita ver también las
        // desactivadas para poder reactivarlas.
        const { data } = await supabase().from("offers")
          .select("id, title, active, valid_until, discount_percent, businesses(name, slug)")
          .order("created_at", { ascending: false }).limit(300);
        setOfertasAdmin(data || []);
        setOfertasCargadas(true);
      })();
    }
  }, [tab, negociosCargados, ofertasCargadas]);

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

  const cambiarEstadoCiudad = async (id: string, status: string) => {
    try {
      const res = await authedFetch("/api/admin/locations", "PATCH", { id, status });
      setCiudades(prev => prev.map(c => c.id === id ? { ...c, status, active: status === "active" } : c));
      if (res.warning) alert(res.warning);
    } catch (e: any) { alert(e.message); }
  };

  // "locations" tiene RLS admin-only para escritura (locations_admin,
  // sin FOR = todos los comandos) -- mismo patrón ya usado para
  // platform_settings, sin necesitar una ruta server-side nueva.
  const crearCiudad = async () => {
    const nombre = nuevaCiudad.nombre.trim();
    if (!nombre) return;
    setCreandoCiudad(true);
    try {
      const slug = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { data, error } = await supabase().from("locations").insert({
        type: "city", name: nombre, slug,
        latitude: nuevaCiudad.lat ? Number(nuevaCiudad.lat) : null,
        longitude: nuevaCiudad.lon ? Number(nuevaCiudad.lon) : null,
        active: false,
        status: "draft",
      }).select().single();
      if (error) throw error;
      setCiudades(prev => [...prev, data]);
      setNuevaCiudad({ nombre: "", lat: "", lon: "" });
    } catch (e: any) { alert(e.message); }
    setCreandoCiudad(false);
  };

  const agregarBarrio = async (ciudadId: string) => {
    const nombre = nuevoBarrio.trim();
    if (!nombre) return;
    try {
      const slug = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const { error } = await supabase().from("locations").insert({
        type: "neighborhood", name: nombre, slug, parent_id: ciudadId, active: true,
      });
      if (error) throw error;
      setCiudades(prev => prev.map(c => c.id === ciudadId ? { ...c, _barrios: (c._barrios || 0) + 1 } : c));
      setNuevoBarrio("");
      setBarrioAbierto(null);
    } catch (e: any) { alert(e.message); }
  };

  const revisarSuscripcion = async (id: string, decision: "aprobar" | "rechazar") => {
    try {
      await authedFetch("/api/admin/subscriptions", "PATCH", { id, decision });
      setSubs(prev => prev.map(s => s.id === id ? { ...s, status: decision === "aprobar" ? "active" : "rechazado" } : s));
    } catch (e: any) { alert(e.message); }
  };

  const toggleDestacado = async (id: string, destacado: boolean) => {
    try {
      await authedFetch("/api/admin/businesses", "PATCH", { id, destacado: !destacado });
      setNegocios(prev => prev.map(n => n.id === id ? { ...n, destacado: !destacado } : n));
    } catch (e: any) { alert(e.message); }
  };

  const toggleActivoNegocio = async (id: string, activo: boolean) => {
    try {
      await authedFetch("/api/admin/businesses", "PATCH", { id, activo: !activo });
      setNegocios(prev => prev.map(n => n.id === id ? { ...n, activo: !activo } : n));
    } catch (e: any) { alert(e.message); }
  };

  const borrarNegocio = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" definitivamente? Se borran también sus ofertas, productos y reseñas asociadas. Esta acción no se puede deshacer.`)) return;
    try {
      await authedFetch("/api/admin/businesses", "DELETE", { id });
      setNegocios(prev => prev.filter(n => n.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const toggleOfertaActiva = async (id: string, active: boolean) => {
    try {
      await authedFetch("/api/admin/offers", "PATCH", { id, active: !active });
      setOfertasAdmin(prev => prev.map(o => o.id === id ? { ...o, active: !active } : o));
    } catch (e: any) { alert(e.message); }
  };

  const borrarOferta = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la oferta "${titulo}"? No se puede deshacer.`)) return;
    try {
      await authedFetch("/api/admin/offers", "DELETE", { id });
      setOfertasAdmin(prev => prev.filter(o => o.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const cambiarRolUsuario = async (userId: string, rolActual: string) => {
    const nuevo = rolActual === "admin" ? "user" : "admin";
    if (!confirm(`¿Cambiar el rol de este usuario a "${nuevo}"?`)) return;
    try {
      await authedFetch("/api/admin/users", "PATCH", { user_id: userId, role: nuevo });
      setStats((prev: any) => ({
        ...prev,
        usersRecent: prev.usersRecent.map((u: any) => u.user_id === userId ? { ...u, role: nuevo } : u),
      }));
    } catch (e: any) { alert(e.message); }
  };

  const renombrarCiudad = async (id: string) => {
    const nombre = nombreCiudadEdit.trim();
    if (!nombre) return;
    try {
      await authedFetch("/api/admin/locations", "PATCH", { id, name: nombre });
      setCiudades(prev => prev.map(c => c.id === id ? { ...c, name: nombre } : c));
      setEditandoCiudad(null);
    } catch (e: any) { alert(e.message); }
  };

  const borrarCiudad = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la ciudad "${nombre}"? Solo se puede borrar si no tiene negocios ni barrios asociados.`)) return;
    try {
      await authedFetch("/api/admin/locations", "DELETE", { id });
      setCiudades(prev => prev.filter(c => c.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const pendientesPago = subs.filter(s => s.status === "pending").length;

  const TABS = [
    { k: "overview", l: "Overview", icon: TrendingUp, count: 0 },
    { k: "negocios", l: "Negocios", icon: Store, count: 0 },
    { k: "ofertas", l: "Ofertas", icon: Flame, count: 0 },
    { k: "verificacion", l: "Verificación", icon: Shield, count: pendientes.length },
    { k: "moderacion", l: "Moderación", icon: Star, count: 0 },
    { k: "reportes", l: "Reportes", icon: Flag, count: reportes.length },
    { k: "suscripciones", l: "Suscripciones", icon: CreditCard, count: pendientesPago },
    { k: "ciudades", l: "Ciudades", icon: MapPin, count: 0 },
    { k: "cargar-bulk", l: "Cargar masiva", icon: Upload, count: 0 },
    { k: "blog", l: "Blog", icon: Newspaper, count: 0 },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">
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
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
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
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white/40">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.usersRecent.map((u: any) => (
                        <tr key={u.user_id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]">
                          <td className="px-4 py-3 text-xs font-semibold">{u.display_name || u.user_id.slice(0, 8) + "…"}</td>
                          <td className="px-4 py-3 text-xs capitalize text-white/60">{u.role}</td>
                          <td className="px-4 py-3 text-xs text-white/50">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                          <td className="px-4 py-3"><OnlineBadge lastSeen={u.last_seen_at} /></td>
                          <td className="px-4 py-3">
                            <button onClick={() => cambiarRolUsuario(u.user_id, u.role)}
                              className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">
                              {u.role === "admin" ? "Quitar admin" : "Hacer admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEGOCIOS */}
        {tab === "negocios" && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Todos los negocios <span className="text-white/40">({negocios.length})</span></h2>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input value={qNegocios} onChange={(e) => setQNegocios(e.target.value)} placeholder="Buscar por nombre..."
                  className="w-full rounded-xl border border-white/15 bg-black/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            {!negociosCargados ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">Cargando...</div>
            ) : negocios.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <Store className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Todavía no hay negocios cargados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {negocios.filter((n) => n.name.toLowerCase().includes(qNegocios.toLowerCase())).map((n) => (
                  <div key={n.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{n.name}</p>
                      <p className="truncate text-xs capitalize text-white/50">
                        {n.category} · {n.status}{n.activo === false && " · oculto"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <a href={`/negocio/${n.slug}`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">Ver</a>
                      <a href={`/dashboard/editar/${n.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">
                        <Pencil className="h-3 w-3" /> Editar
                      </a>
                      <button onClick={() => toggleDestacado(n.id, n.destacado)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${n.destacado ? "bg-yellow-500/20 text-yellow-300" : "border border-white/15 text-white/60 hover:bg-white/10"}`}>
                        {n.destacado ? "Quitar destacado" : "Destacar"}
                      </button>
                      <button onClick={() => toggleActivoNegocio(n.id, n.activo !== false)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${n.activo === false ? "bg-white/10 text-white/50" : "border border-white/15 text-white/60 hover:bg-white/10"}`}>
                        {n.activo === false ? "Reactivar" : "Ocultar"}
                      </button>
                      <button onClick={() => borrarNegocio(n.id, n.name)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/25">
                        <Trash2 className="h-3 w-3" /> Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OFERTAS */}
        {tab === "ofertas" && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">Todas las ofertas <span className="text-white/40">({ofertasAdmin.length})</span></h2>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                <input value={qOfertas} onChange={(e) => setQOfertas(e.target.value)} placeholder="Buscar por título..."
                  className="w-full rounded-xl border border-white/15 bg-black/20 py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            {!ofertasCargadas ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-white/40">Cargando...</div>
            ) : ofertasAdmin.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <Flame className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Todavía no hay ofertas publicadas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ofertasAdmin.filter((o) => o.title.toLowerCase().includes(qOfertas.toLowerCase())).map((o) => (
                  <div key={o.id} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{o.title}</p>
                      <p className="truncate text-xs text-white/50">
                        {o.businesses?.name || "Negocio eliminado"}{o.valid_until && ` · vence ${new Date(o.valid_until + "T00:00:00").toLocaleDateString("es-AR")}`}{!o.active && " · inactiva"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <a href={`/oferta/${o.id}`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-bold text-white/60 hover:bg-white/10">Ver</a>
                      <button onClick={() => toggleOfertaActiva(o.id, o.active)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${!o.active ? "bg-white/10 text-white/50" : "border border-white/15 text-white/60 hover:bg-white/10"}`}>
                        {o.active ? "Desactivar" : "Reactivar"}
                      </button>
                      <button onClick={() => borrarOferta(o.id, o.title)}
                        className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/25">
                        <Trash2 className="h-3 w-3" /> Borrar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          <div className="mt-6 space-y-8">
            <div>
              <h2 className="mb-4 text-lg font-black">
                Pagos pendientes de revisión <span className="text-white/40">({pendientesPago})</span>
              </h2>
              {pendientesPago === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-white/20" />
                  <p className="mt-3 text-sm text-white/40">No hay comprobantes esperando revisión.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subs.filter(s => s.status === "pending").map(s => (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/5 p-4">
                      <CreditCard className="h-6 w-6 shrink-0 text-yellow-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{(s as any).businesses?.name || "Negocio"}</p>
                        <p className="text-xs text-white/50">Pide plan <strong className="capitalize">{s.plan}</strong> · {new Date(s.started_at).toLocaleDateString("es-AR")}</p>
                      </div>
                      {s.comprobante_url && (
                        <a href={s.comprobante_url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/10">
                          Ver comprobante
                        </a>
                      )}
                      <button onClick={() => revisarSuscripcion(s.id, "aprobar")}
                        className="rounded-lg bg-green-500/20 px-3 py-1.5 text-xs font-bold text-green-300 hover:bg-green-500/30">
                        Aprobar
                      </button>
                      <button onClick={() => revisarSuscripcion(s.id, "rechazar")}
                        className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/30">
                        Rechazar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-lg font-black">Historial <span className="text-white/40">({subs.length})</span></h2>
              {subs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-white/20" />
                  <p className="mt-3 text-sm text-white/40">Aún no hay solicitudes de plan pago.</p>
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
                      <Badge variant={s.status === "active" ? "success" : s.status === "pending" ? "warning" : "danger"} size="sm">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

        {/* BLOG */}
        {tab === "blog" && (
          <div className="mt-6 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6">
            <Newspaper className="h-8 w-8 text-indigo-300" />
            <p className="mt-3 text-lg font-black">Blog / Novedades</p>
            <p className="mt-1 text-sm text-white/70">
              Escribí artículos y novedades de la plataforma. Se publican en /blog cuando los marcás como publicados.
            </p>
            <a href="/admin/blog"
              className="mt-4 inline-block rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-sm font-black hover:opacity-90">
              Ir al editor de artículos →
            </a>
          </div>
        )}

        {/* CIUDADES */}
        {tab === "ciudades" && (
          <div className="mt-6">
            <h2 className="mb-4 text-lg font-black">Ciudades de la plataforma <span className="text-white/40">({ciudades.length})</span></h2>

            <div className="mb-5 rounded-2xl border border-orange-400/20 bg-orange-500/[0.04] p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-orange-300">+ Agregar ciudad nueva</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input value={nuevaCiudad.nombre} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, nombre: e.target.value })}
                  placeholder="Nombre de la ciudad" className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                <input value={nuevaCiudad.lat} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, lat: e.target.value })}
                  placeholder="Latitud (opcional)" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-orange-400 sm:w-36" />
                <input value={nuevaCiudad.lon} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, lon: e.target.value })}
                  placeholder="Longitud (opcional)" className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-orange-400 sm:w-36" />
                <button onClick={crearCiudad} disabled={creandoCiudad || !nuevaCiudad.nombre.trim()}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-black disabled:opacity-50">
                  {creandoCiudad ? "…" : "Crear"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-white/40">Se crea como borrador. Cargale coordenadas y algún negocio real antes de activarla -- sin coordenadas no se puede activar.</p>
            </div>

            {ciudades.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm text-white/40">Todavía no hay ciudades cargadas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ciudades.map(c => (
                  <div key={c.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-6 w-6 shrink-0 text-sky-400" />
                      <div className="min-w-0 flex-1">
                        {editandoCiudad === c.id ? (
                          <input value={nombreCiudadEdit} onChange={(e) => setNombreCiudadEdit(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renombrarCiudad(c.id)}
                            autoFocus
                            className="w-full rounded-lg border border-orange-400/40 bg-black/20 px-2 py-1 text-sm font-bold outline-none" />
                        ) : (
                          <p className="truncate font-bold">{c.name}</p>
                        )}
                        <p className="text-xs text-white/50">
                          /{c.slug} · {c._negocios ?? 0} negocio{c._negocios === 1 ? "" : "s"}
                          {(c.latitude == null || c.longitude == null) && <span className="ml-2 text-amber-400">sin coordenadas</span>}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                        c.status === "active" ? "bg-green-500/15 text-green-300"
                        : c.status === "draft" ? "bg-white/10 text-white/50"
                        : c.status === "suspended" ? "bg-red-500/15 text-red-300"
                        : c.status === "archived" ? "bg-white/5 text-white/30"
                        : "bg-amber-500/15 text-amber-300"
                      }`}>
                        {c.status === "active" ? "Activa" : c.status === "draft" ? "Borrador" : c.status === "suspended" ? "Suspendida" : c.status === "archived" ? "Archivada" : "Inactiva"}
                      </span>
                      {editandoCiudad === c.id ? (
                        <>
                          <button onClick={() => renombrarCiudad(c.id)}
                            className="shrink-0 rounded-xl bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/30">
                            Guardar
                          </button>
                          <button onClick={() => setEditandoCiudad(null)}
                            className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setEditandoCiudad(c.id); setNombreCiudadEdit(c.name); }}
                          className="flex shrink-0 items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5">
                          <Pencil className="h-3 w-3" /> Renombrar
                        </button>
                      )}
                      <button onClick={() => setBarrioAbierto(barrioAbierto === c.id ? null : c.id)}
                        className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-bold text-white/60 hover:bg-white/5">
                        + Barrio
                      </button>
                      <select value={c.status || "draft"} onChange={(e) => cambiarEstadoCiudad(c.id, e.target.value)}
                        className="shrink-0 rounded-xl border border-white/15 bg-black/20 px-2 py-2 text-xs font-bold outline-none focus:border-orange-400">
                        <option value="draft">Borrador</option>
                        <option value="inactive">Inactiva</option>
                        <option value="active">Activar</option>
                        <option value="suspended">Suspender</option>
                        <option value="archived">Archivar</option>
                      </select>
                      <button onClick={() => borrarCiudad(c.id, c.name)}
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {barrioAbierto === c.id && (
                      <div className="mt-3 flex gap-2 border-t border-white/10 pt-3">
                        <input value={nuevoBarrio} onChange={(e) => setNuevoBarrio(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && agregarBarrio(c.id)}
                          placeholder="Nombre del barrio" autoFocus
                          className="flex-1 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm outline-none focus:border-orange-400" />
                        <button onClick={() => agregarBarrio(c.id)} disabled={!nuevoBarrio.trim()}
                          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50">
                          Agregar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-white/40">
              Solo las ciudades en estado "Activa" aparecen públicamente. Podés cargar negocios en una ciudad en
              borrador antes de activarla -- desactivar/suspender/archivar nunca borra los datos, se puede
              reactivar en cualquier momento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
