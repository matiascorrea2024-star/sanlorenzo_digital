"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Users, Store, Flame, TrendingUp, CheckCircle2, XCircle, Star, CreditCard, MapPin, Eye, Upload, Flag, Heart, Newspaper, Search, Trash2, Pencil, MessageCircle, Gift, Radio, Square, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Avatar from "@/components/ui/avatar";
import OnlineBadge from "@/components/ui/online-badge";
import AdminVisits from "@/components/admin/visits";
import Badge from "@/components/ui/badge";
import InfoTip from "@/components/ui/info-tip";
import LiveChat from "@/components/live/live-chat";
import { PLANES } from "@/lib/plans";

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("user");
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  // Snapshot de "ahora" (no Date.now() de forma impura en cada render)
  // para el chequeo de "sigue impulsada" en la lista de ofertas.
  const [ahora] = useState(() => Date.now());
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
  // Buscar en la base, no solo en los primeros 300 ya cargados en
  // memoria -- con miles de negocios, el resto quedaba invisible para
  // el propio buscador del admin. null = sin búsqueda activa.
  const [negociosBusqueda, setNegociosBusqueda] = useState<any[] | null>(null);
  const [buscandoNegocios, setBuscandoNegocios] = useState(false);
  const [ofertasAdmin, setOfertasAdmin] = useState<any[]>([]);
  const [ofertasCargadas, setOfertasCargadas] = useState(false);
  const [qOfertas, setQOfertas] = useState("");
  const [ofertasBusqueda, setOfertasBusqueda] = useState<any[] | null>(null);
  const [buscandoOfertas, setBuscandoOfertas] = useState(false);
  const [campanas, setCampanas] = useState<any[]>([]);
  const [campanasCargadas, setCampanasCargadas] = useState(false);
  const [nuevaCampana, setNuevaCampana] = useState({ title: "", description: "", grants_plan: "profesional", grants_dias: "90", max_cupos: "20" });
  const [creandoCampana, setCreandoCampana] = useState(false);
  const [vivos, setVivos] = useState<any[]>([]);
  const [vivosCargados, setVivosCargados] = useState(false);
  const [chatMensajes, setChatMensajes] = useState<any[]>([]);
  const [chatCargados, setChatCargados] = useState(false);
  const [vivoSeleccionado, setVivoSeleccionado] = useState<string | null>(null);

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
        const { data } = await supabase().from("businesses").select("id, name, slug, category, status, activo, destacado, owner_id, plan, plan_expira").order("created_at", { ascending: false }).limit(300);
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
          .select("id, title, active, valid_until, discount_percent, impulsada_hasta, businesses(name, slug)")
          .order("created_at", { ascending: false }).limit(300);
        setOfertasAdmin(data || []);
        setOfertasCargadas(true);
      })();
    }
    if (tab === "campanas" && !campanasCargadas) {
      (async () => {
        const { data } = await supabase().from("campaigns")
          .select("*, campaign_claims(count)").order("created_at", { ascending: false });
        setCampanas(data || []);
        setCampanasCargadas(true);
      })();
    }
    if (tab === "en-vivo" && !vivosCargados) {
      (async () => {
        const { data } = await supabase().from("live_streams")
          .select("*, businesses(name, slug)").order("created_at", { ascending: false }).limit(200);
        setVivos(data || []);
        setVivosCargados(true);
      })();
    }
    // Solo los mensajes reportados/auto-ocultados (hidden=true) -- el
    // chat en general funciona solo, esto es puntualmente lo que
    // necesita revisión humana.
    if (tab === "chat" && !chatCargados) {
      (async () => {
        const { data } = await supabase().from("city_chat_messages")
          .select("*, locations(name)").eq("hidden", true).order("created_at", { ascending: false }).limit(200);
        setChatMensajes(data || []);
        setChatCargados(true);
      })();
    }
  }, [tab, negociosCargados, ofertasCargadas, campanasCargadas, vivosCargados, chatCargados]);

  // Búsqueda server-side: los primeros 300/300 ya cargados no alcanzan
  // para encontrar un negocio/oferta cualquiera con miles en la base.
  useEffect(() => {
    const term = qNegocios.trim();
    if (term.length < 2) { setNegociosBusqueda(null); return; }
    setBuscandoNegocios(true);
    const t = setTimeout(async () => {
      const { data } = await supabase().from("businesses")
        .select("id, name, slug, category, status, activo, destacado, owner_id, plan, plan_expira")
        .ilike("name", `%${term}%`).order("name").limit(200);
      setNegociosBusqueda(data || []);
      setBuscandoNegocios(false);
    }, 300);
    return () => clearTimeout(t);
  }, [qNegocios]);

  useEffect(() => {
    const term = qOfertas.trim();
    if (term.length < 2) { setOfertasBusqueda(null); return; }
    setBuscandoOfertas(true);
    const t = setTimeout(async () => {
      const { data } = await supabase().from("offers")
        .select("id, title, active, valid_until, discount_percent, impulsada_hasta, businesses(name, slug)")
        .ilike("title", `%${term}%`).order("created_at", { ascending: false }).limit(200);
      setOfertasBusqueda(data || []);
      setBuscandoOfertas(false);
    }, 300);
    return () => clearTimeout(t);
  }, [qOfertas]);

  const negociosMostrados = negociosBusqueda ?? negocios;
  const ofertasMostradas = ofertasBusqueda ?? ofertasAdmin;

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

  const crearCampana = async () => {
    if (!nuevaCampana.title.trim()) return;
    setCreandoCampana(true);
    try {
      const res = await authedFetch("/api/admin/campaigns", "POST", {
        title: nuevaCampana.title,
        description: nuevaCampana.description,
        grants_plan: nuevaCampana.grants_plan,
        grants_dias: Number(nuevaCampana.grants_dias),
        max_cupos: nuevaCampana.max_cupos ? Number(nuevaCampana.max_cupos) : null,
      });
      setCampanas(prev => [{ ...res.campaign, campaign_claims: [{ count: 0 }] }, ...prev]);
      setNuevaCampana({ title: "", description: "", grants_plan: "profesional", grants_dias: "90", max_cupos: "20" });
    } catch (e: any) { alert(e.message); }
    setCreandoCampana(false);
  };

  const toggleCampana = async (id: string, active: boolean) => {
    try {
      await authedFetch("/api/admin/campaigns", "PATCH", { id, active: !active });
      setCampanas(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c));
    } catch (e: any) { alert(e.message); }
  };

  const toggleBloqueoVivo = async (id: string, blocked: boolean) => {
    try {
      await authedFetch("/api/admin/live-streams", "PATCH", { id, blocked: !blocked });
      setVivos(prev => prev.map(v => v.id === id ? { ...v, blocked: !blocked } : v));
    } catch (e: any) { alert(e.message); }
  };

  const finalizarVivoAdmin = async (id: string) => {
    if (!confirm("¿Finalizar esta transmisión ahora?")) return;
    try {
      await authedFetch("/api/admin/live-streams", "PATCH", { id, status: "ended" });
      setVivos(prev => prev.map(v => v.id === id ? { ...v, status: "ended", ended_at: new Date().toISOString() } : v));
    } catch (e: any) { alert(e.message); }
  };

  const borrarVivo = async (id: string, titulo: string) => {
    if (!confirm(`¿Eliminar la transmisión "${titulo}" definitivamente? Se borran también su chat y sus productos asociados.`)) return;
    try {
      await authedFetch("/api/admin/live-streams", "DELETE", { id });
      setVivos(prev => prev.filter(v => v.id !== id));
      if (vivoSeleccionado === id) setVivoSeleccionado(null);
    } catch (e: any) { alert(e.message); }
  };

  const restaurarMensajeChat = async (id: string) => {
    try {
      await authedFetch("/api/admin/chat", "PATCH", { id });
      setChatMensajes(prev => prev.filter(m => m.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const borrarMensajeChat = async (id: string) => {
    if (!confirm("¿Eliminar este mensaje definitivamente?")) return;
    try {
      await authedFetch("/api/admin/chat", "DELETE", { id });
      setChatMensajes(prev => prev.filter(m => m.id !== id));
    } catch (e: any) { alert(e.message); }
  };

  const cambiarPlan = async (id: string, plan: string) => {
    try {
      await authedFetch("/api/admin/businesses", "PATCH", { id, plan });
      setNegocios(prev => prev.map(n => n.id === id ? { ...n, plan, destacado: plan === "premium" } : n));
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

  const impulsarOferta = async (id: string, horas: number) => {
    try {
      const r: any = await authedFetch("/api/admin/offers", "PATCH", { id, impulsar_horas: horas });
      setOfertasAdmin(prev => prev.map(o => o.id === id ? { ...o, impulsada_hasta: r.impulsada_hasta } : o));
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
    { k: "chat", l: "Chat", icon: MessageCircle, count: chatCargados ? chatMensajes.length : 0 },
    { k: "en-vivo", l: "En Vivo", icon: Radio, count: vivos.filter(v => v.status === "live").length },
    { k: "suscripciones", l: "Suscripciones", icon: CreditCard, count: pendientesPago },
    { k: "campanas", l: "Campañas", icon: Gift, count: 0 },
    { k: "ciudades", l: "Ciudades", icon: MapPin, count: 0 },
    { k: "cargar-bulk", l: "Cargar masiva", icon: Upload, count: 0 },
    { k: "blog", l: "Blog", icon: Newspaper, count: 0 },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-red-400" />
          <p className="mt-4 text-sm text-[var(--muted)]">Cargando panel de administración…</p>
        </div>
      </main>
    );
  }

  const cards = [
    { icon: Users, label: "Usuarios", value: stats.users, color: "text-sky-400", bg: "from-sky-500/10" },
    { icon: Store, label: "Negocios", value: stats.businesses, color: "text-green-400", bg: "from-green-500/10" },
    { icon: Flame, label: "Ofertas", value: stats.offers, color: "text-orange-400", bg: "from-orange-500/10" },
    { icon: Star, label: "Reseñas", value: stats.reviews, color: "text-yellow-400", bg: "from-yellow-500/10" },
    { icon: Eye, label: "Visitas", value: stats.views, color: "text-red-400", bg: "from-red-600/10" },
    { icon: Heart, label: "Seguidores", value: stats.seguidores, color: "text-purple-400", bg: "from-purple-500/10" },
  ];

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="border-b border-[var(--ov-05)] bg-gradient-to-b from-red-950/20 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[.4em] text-red-400">Control total</p>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20">
              <Shield className="h-7 w-7 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black leading-tight md:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Panel de administración</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">San Lorenzo Digital · toda la plataforma en un solo lugar</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {TABS.map(t => (
            <button key={t.k} onClick={() => { setTab(t.k); router.replace(`/admin?tab=${t.k}`); }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold transition ${
                tab === t.k ? "bg-gradient-to-r from-red-500 to-orange-500 text-[var(--text)] shadow-lg shadow-red-500/20" : "border border-[var(--line)] bg-[var(--ov-03)] text-[var(--text)]/70 hover:border-[var(--line-strong)] hover:bg-[var(--ov-05)]"
              }`}>
              <t.icon className="h-3.5 w-3.5" /> {t.l}
              {t.count > 0 && (
                <span className={`ml-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${tab === t.k ? "bg-black/25 text-[var(--text)]" : "bg-red-500 text-[var(--text)]"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cards.map(c => (
                <div key={c.label} className={`rounded-[1.5rem] border border-[var(--ov-06)] bg-gradient-to-b ${c.bg} to-transparent p-1 transition hover:border-[var(--line-strong)]`}>
                  <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                    <c.icon className={`mx-auto h-6 w-6 ${c.color}`} />
                    <p className="mt-2 text-2xl font-black tabular-nums md:text-3xl">{c.value}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <AdminVisits />

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-black">👥 Últimos usuarios registrados</h3>
                <span className="text-xs text-[var(--muted2)]">{stats.usersRecent?.length || 0}</span>
              </div>
              {!stats.usersRecent?.length ? (
                <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-8 text-center text-sm text-[var(--muted2)]">
                  Todavía no hay usuarios registrados.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--line)] bg-[var(--ov-03)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Usuario</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Rol</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Alta</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Estado</th>
                        <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--muted2)]">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.usersRecent.map((u: any) => (
                        <tr key={u.user_id} className="border-b border-[var(--ov-05)] last:border-0 hover:bg-[var(--ov-03)]">
                          <td className="px-4 py-3 text-xs font-semibold">{u.display_name || u.user_id.slice(0, 8) + "…"}</td>
                          <td className="px-4 py-3 text-xs capitalize text-[var(--muted)]">{u.role}</td>
                          <td className="px-4 py-3 text-xs text-[var(--muted)]">{new Date(u.created_at).toLocaleDateString("es-AR")}</td>
                          <td className="px-4 py-3"><OnlineBadge lastSeen={u.last_seen_at} /></td>
                          <td className="px-4 py-3">
                            <button onClick={() => cambiarRolUsuario(u.user_id, u.role)}
                              className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">
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
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">
                {negociosBusqueda ? "Resultados" : "Todos los negocios"} <span className="text-[var(--muted2)]">({negociosMostrados.length}{negociosBusqueda && negociosMostrados.length >= 200 ? "+" : ""})</span>
                {buscandoNegocios && <span className="ml-2 text-xs font-normal text-[var(--muted2)]">buscando...</span>}
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
                <input value={qNegocios} onChange={(e) => setQNegocios(e.target.value)} placeholder="Buscar por nombre (en toda la base)..."
                  className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            {!negociosCargados ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center text-sm text-[var(--muted2)]">Cargando...</div>
            ) : negociosMostrados.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Store className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">{negociosBusqueda ? "Ningún negocio coincide con esa búsqueda." : "Todavía no hay negocios cargados."}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {negociosMostrados.map((n) => (
                  <div key={n.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{n.name}</p>
                      <p className="truncate text-xs capitalize text-[var(--muted)]">
                        {n.category} · {n.status}{n.activo === false && " · oculto"} · plan {PLANES[n.plan || "gratis"]?.name || n.plan}
                        {n.plan_expira && new Date(n.plan_expira) > new Date() && ` (vence ${new Date(n.plan_expira).toLocaleDateString("es-AR")})`}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <select value={n.plan || "gratis"} onChange={(e) => cambiarPlan(n.id, e.target.value)}
                        title="Asignar plan manualmente (venta por fuera del comprobante, promo, etc.)"
                        className="rounded-lg border border-[var(--line-strong)] bg-[var(--card-inner)] px-2 py-1 text-[11px] font-bold outline-none focus:border-orange-400">
                        {Object.entries(PLANES).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
                      </select>
                      <a href={`/negocio/${n.slug}`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">Ver</a>
                      <a href={`/dashboard/editar/${n.slug}`} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">
                        <Pencil className="h-3 w-3" /> Editar
                      </a>
                      <a href={`/admin/soporte/${n.id}`}
                        className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20">
                        <MessageCircle className="h-3 w-3" /> Chat
                      </a>
                      <button onClick={() => toggleDestacado(n.id, n.destacado)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${n.destacado ? "bg-yellow-500/20 text-yellow-300" : "border border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--ov-10)]"}`}>
                        {n.destacado ? "Quitar destacado" : "Destacar"}
                      </button>
                      <button onClick={() => toggleActivoNegocio(n.id, n.activo !== false)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${n.activo === false ? "bg-[var(--ov-10)] text-[var(--muted)]" : "border border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--ov-10)]"}`}>
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
          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black">
                {ofertasBusqueda ? "Resultados" : "Todas las ofertas"} <span className="text-[var(--muted2)]">({ofertasMostradas.length}{ofertasBusqueda && ofertasMostradas.length >= 200 ? "+" : ""})</span>
                {buscandoOfertas && <span className="ml-2 text-xs font-normal text-[var(--muted2)]">buscando...</span>}
              </h2>
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted2)]" />
                <input value={qOfertas} onChange={(e) => setQOfertas(e.target.value)} placeholder="Buscar por título (en toda la base)..."
                  className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] py-2 pl-9 pr-3 text-sm outline-none focus:border-orange-400" />
              </div>
            </div>
            {!ofertasCargadas ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center text-sm text-[var(--muted2)]">Cargando...</div>
            ) : ofertasMostradas.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Flame className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">{ofertasBusqueda ? "Ninguna oferta coincide con esa búsqueda." : "Todavía no hay ofertas publicadas."}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {ofertasMostradas.map((o) => (
                  <div key={o.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{o.title}</p>
                      <p className="truncate text-xs text-[var(--muted)]">
                        {o.businesses?.name || "Negocio eliminado"}{o.valid_until && ` · vence ${new Date(o.valid_until + "T00:00:00").toLocaleDateString("es-AR")}`}{!o.active && " · inactiva"}
                        {o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora && (
                          <span className="text-cyan-300"> · 🚀 impulsada hasta {new Date(o.impulsada_hasta).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <a href={`/oferta/${o.id}`} target="_blank" rel="noopener noreferrer"
                        className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">Ver</a>
                      <button onClick={() => impulsarOferta(o.id, 24)}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20">
                        🚀 24h
                      </button>
                      <button onClick={() => impulsarOferta(o.id, 48)}
                        className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20">
                        🚀 48h
                      </button>
                      <button onClick={() => toggleOfertaActiva(o.id, o.active)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${!o.active ? "bg-[var(--ov-10)] text-[var(--muted)]" : "border border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--ov-10)]"}`}>
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
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Negocios pendientes de verificación <span className="text-[var(--muted2)]">({pendientes.length})</span></h2>
            {pendientes.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-green-400/60" />
                <p className="mt-3 font-bold text-[var(--text)]/70">Todo verificado</p>
                <p className="mt-1 text-sm text-[var(--muted2)]">No hay negocios pendientes ahora mismo.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendientes.map(p => (
                  <div key={p.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={p.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="truncate text-xs capitalize text-[var(--muted)]">{p.category} · {p.address || "sin dirección"}</p>
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
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Últimas reseñas <span className="text-[var(--muted2)]">({resenas.length})</span></h2>
            {resenas.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Star className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">Aún no hay reseñas para moderar.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {resenas.map(r => (
                  <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <Avatar name={r.reviewer_name} size={40} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{r.reviewer_name} <span className="text-yellow-400">{"★".repeat(r.rating)}</span></p>
                        <p className="text-sm text-[var(--text)]/70">{r.comment}</p>
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
          <div className="mt-8 space-y-8">
            <div>
              <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>
                Pagos pendientes de revisión <span className="text-[var(--muted2)]">({pendientesPago})</span>
              </h2>
              {pendientesPago === 0 ? (
                <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                  <p className="mt-3 text-sm text-[var(--muted2)]">No hay comprobantes esperando revisión.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subs.filter(s => s.status === "pending").map(s => (
                    <div key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/5 p-4">
                      <CreditCard className="h-6 w-6 shrink-0 text-yellow-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{(s as any).businesses?.name || "Negocio"}</p>
                        <p className="text-xs text-[var(--muted)]">Pide plan <strong className="capitalize">{s.plan}</strong> · {new Date(s.started_at).toLocaleDateString("es-AR")}</p>
                      </div>
                      {s.comprobante_url && (
                        <a href={s.comprobante_url} target="_blank" rel="noopener noreferrer"
                          className="rounded-lg border border-[var(--line-strong)] px-3 py-1.5 text-xs font-bold text-[var(--text)]/70 hover:bg-[var(--ov-10)]">
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
              <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Historial <span className="text-[var(--muted2)]">({subs.length})</span></h2>
              {subs.length === 0 ? (
                <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                  <p className="mt-3 text-sm text-[var(--muted2)]">Aún no hay solicitudes de plan pago.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {subs.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-4">
                      <CreditCard className="h-6 w-6 shrink-0 text-orange-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{(s as any).businesses?.name || "Negocio"}</p>
                        <p className="text-xs capitalize text-[var(--muted)]">Plan {s.plan} · {new Date(s.started_at).toLocaleDateString("es-AR")}</p>
                      </div>
                      <Badge variant={s.status === "active" ? "success" : s.status === "pending" ? "warning" : "danger"} size="sm">{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CAMPAÑAS -- beneficios manuales (plan gratis por tiempo limitado)
            para atraer a los primeros comerciantes sin gastar un peso:
            vos armás el beneficio y lo cancelás cuando quieras, cada
            negocio lo reclama solo desde /dashboard/planes mientras haya
            cupo -- no hay que dárselo a mano uno por uno. */}
        {tab === "campanas" && (
          <div className="mt-8">
            <div className="mb-6 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-5">
              <h2 className="mb-1 text-lg font-black flex items-center gap-2"><Gift className="h-5 w-5 text-orange-400" /> Nueva campaña</h2>
              <p className="mb-4 text-xs text-[var(--muted)]">Ej: &quot;Fundadores&quot; -- 3 meses de PRO gratis para los primeros 20 negocios. La cancelás cuando quieras sin borrar el historial.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={nuevaCampana.title} onChange={(e) => setNuevaCampana({ ...nuevaCampana, title: e.target.value })}
                  placeholder="Título (ej: Fundadores San Lorenzo)" className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400 sm:col-span-2" />
                <input value={nuevaCampana.description} onChange={(e) => setNuevaCampana({ ...nuevaCampana, description: e.target.value })}
                  placeholder="Descripción corta para el negocio (opcional)" className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400 sm:col-span-2" />
                <select value={nuevaCampana.grants_plan} onChange={(e) => setNuevaCampana({ ...nuevaCampana, grants_plan: e.target.value })}
                  className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400">
                  {Object.entries(PLANES).map(([k, p]) => <option key={k} value={k}>Otorga: {p.name}</option>)}
                </select>
                <input value={nuevaCampana.grants_dias} onChange={(e) => setNuevaCampana({ ...nuevaCampana, grants_dias: e.target.value })}
                  type="number" placeholder="Días de duración" className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400" />
                <input value={nuevaCampana.max_cupos} onChange={(e) => setNuevaCampana({ ...nuevaCampana, max_cupos: e.target.value })}
                  type="number" placeholder="Cupo máximo (vacío = sin límite)" className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400 sm:col-span-2" />
              </div>
              <button onClick={crearCampana} disabled={creandoCampana || !nuevaCampana.title.trim()}
                className="mt-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-2.5 text-sm font-black disabled:opacity-50">
                {creandoCampana ? "Creando..." : "Crear campaña"}
              </button>
            </div>

            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Campañas <span className="text-[var(--muted2)]">({campanas.length})</span></h2>
            {!campanasCargadas ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center text-sm text-[var(--muted2)]">Cargando...</div>
            ) : campanas.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Gift className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">Todavía no creaste ninguna campaña.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {campanas.map((c) => {
                  const usados = c.campaign_claims?.[0]?.count ?? 0;
                  const agotada = c.max_cupos != null && usados >= c.max_cupos;
                  return (
                    <div key={c.id} className="flex flex-col gap-2 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-4 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{c.title}</p>
                        <p className="truncate text-xs text-[var(--muted)]">
                          Otorga {PLANES[c.grants_plan]?.name} por {c.grants_dias} días · {usados}{c.max_cupos != null ? `/${c.max_cupos}` : ""} usados
                          {agotada && " · agotada"}
                        </p>
                      </div>
                      <Badge variant={c.active ? "success" : "default"} size="sm">{c.active ? "Activa" : "Cancelada"}</Badge>
                      <button onClick={() => toggleCampana(c.id, c.active)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${c.active ? "bg-red-500/15 text-red-300 hover:bg-red-500/25" : "border border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--ov-10)]"}`}>
                        {c.active ? "Cancelar" : "Reactivar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* REPORTES */}
        {tab === "reportes" && (
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Reportes de la comunidad <span className="text-[var(--muted2)]">({reportes.length})</span></h2>
            {reportes.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Flag className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">No hay reportes pendientes. La comunidad confía en el directorio ✅</p>
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
                          {r.details && <p className="mt-1 text-sm text-[var(--text)]/70">&quot;{r.details}&quot;</p>}
                          <p className="mt-1 text-xs text-[var(--muted2)]">{new Date(r.created_at).toLocaleDateString("es-AR")}</p>
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

        {/* EN VIVO */}
        {tab === "en-vivo" && (
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Transmisiones <span className="text-[var(--muted2)]">({vivos.length})</span></h2>
            {!vivosCargados ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center text-sm text-[var(--muted2)]">Cargando...</div>
            ) : vivos.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <Radio className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">Todavía no hubo transmisiones en la plataforma.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vivos.map((v) => {
                  const ESTADO: Record<string, { l: string; c: string }> = {
                    scheduled: { l: "Programado", c: "bg-sky-500/15 text-sky-300" },
                    live: { l: "🔴 En vivo", c: "bg-red-500/20 text-red-300" },
                    ended: { l: "Finalizado", c: "bg-[var(--ov-10)] text-[var(--muted)]" },
                    cancelled: { l: "Cancelado", c: "bg-[var(--ov-10)] text-[var(--muted2)]" },
                  };
                  const e = ESTADO[v.status] || ESTADO.ended;
                  const abierto = vivoSeleccionado === v.id;
                  return (
                    <div key={v.id} className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">{v.title} {v.blocked && <span className="ml-1 text-[10px] font-black text-red-400">BLOQUEADO</span>}</p>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {v.businesses?.name} · <span className={`rounded px-1.5 py-0.5 font-bold ${e.c}`}>{e.l}</span>
                            {v.status !== "scheduled" && ` · ${v.max_viewers} pico · ${v.total_viewers} totales`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <a href={`/en-vivo/${v.id}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">Ver</a>
                          <a href={`/negocio/${v.businesses?.slug}`} target="_blank" rel="noopener noreferrer"
                            className="rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">Negocio</a>
                          <button onClick={() => setVivoSeleccionado(abierto ? null : v.id)}
                            className="flex items-center gap-1 rounded-lg border border-[var(--line-strong)] px-2.5 py-1 text-[11px] font-bold text-[var(--muted)] hover:bg-[var(--ov-10)]">
                            <MessageCircle className="h-3 w-3" /> {abierto ? "Cerrar chat" : "Moderar chat"}
                          </button>
                          {v.status === "live" && (
                            <button onClick={() => finalizarVivoAdmin(v.id)}
                              className="flex items-center gap-1 rounded-lg bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300 hover:bg-orange-500/25">
                              <Square className="h-3 w-3" /> Finalizar
                            </button>
                          )}
                          <button onClick={() => toggleBloqueoVivo(v.id, v.blocked)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold ${v.blocked ? "bg-[var(--ov-10)] text-[var(--muted)]" : "border border-[var(--line-strong)] text-[var(--muted)] hover:bg-[var(--ov-10)]"}`}>
                            <EyeOff className="h-3 w-3" /> {v.blocked ? "Desbloquear" : "Bloquear"}
                          </button>
                          <button onClick={() => borrarVivo(v.id, v.title)}
                            className="flex items-center gap-1 rounded-lg bg-red-500/15 px-2.5 py-1 text-[11px] font-bold text-red-300 hover:bg-red-500/25">
                            <Trash2 className="h-3 w-3" /> Borrar
                          </button>
                        </div>
                      </div>
                      {abierto && (
                        <div className="border-t border-[var(--line)] p-3">
                          <LiveChat liveStreamId={v.id} puedeModerar />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {tab === "chat" && (
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Mensajes reportados del chat <span className="text-[var(--muted2)]">({chatMensajes.length})</span></h2>
            <p className="mb-4 text-xs text-[var(--muted2)]">Solo se listan acá los que llegaron a 3+ reportes y se auto-ocultaron. El chat en general no necesita revisión manual.</p>
            {!chatCargados ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center text-sm text-[var(--muted2)]">Cargando...</div>
            ) : chatMensajes.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">No hay mensajes reportados pendientes de revisión.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {chatMensajes.map((m) => (
                  <div key={m.id} className="flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.03] p-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[var(--muted2)]">{m.locations?.name} · {m.reports_count} reporte{m.reports_count === 1 ? "" : "s"}</p>
                      <p className="font-bold">{m.sender_name}</p>
                      <p className="text-sm text-[var(--text)]/70">{m.body}</p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button onClick={() => restaurarMensajeChat(m.id)}
                        className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-black text-green-300 hover:bg-green-500/25">
                        Restaurar
                      </button>
                      <button onClick={() => borrarMensajeChat(m.id)}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-500/25">
                        Eliminar
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
          <div className="mt-8 rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Upload className="h-8 w-8 text-orange-400" />
              <p className="mt-3 text-lg font-black">Cargar masiva de negocios reales</p>
              <p className="mt-1 text-sm text-[var(--text)]/70">
                Subí negocios reales de San Lorenzo desde un CSV. Quedarán en estado &quot;pendiente&quot; para verificación.
              </p>
              <a href="/admin/cargar-bulk"
                className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90">
                Ir a la herramienta de carga →
              </a>
            </div>
          </div>
        )}

        {/* BLOG */}
        {tab === "blog" && (
          <div className="mt-8 rounded-[1.75rem] border border-orange-400/25 bg-gradient-to-br from-orange-500/[.08] to-red-600/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Newspaper className="h-8 w-8 text-orange-400" />
              <p className="mt-3 text-lg font-black">Blog / Novedades</p>
              <p className="mt-1 text-sm text-[var(--text)]/70">
                Escribí artículos y novedades de la plataforma. Se publican en /blog cuando los marcás como publicados.
              </p>
              <a href="/admin/blog"
                className="mt-4 inline-block rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black hover:opacity-90">
                Ir al editor de artículos →
              </a>
            </div>
          </div>
        )}

        {/* CIUDADES */}
        {tab === "ciudades" && (
          <div className="mt-8">
            <h2 className="mb-5 text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-space)" }}>Ciudades de la plataforma <span className="text-[var(--muted2)]">({ciudades.length})</span></h2>

            <div className="mb-5 rounded-2xl border border-orange-400/20 bg-orange-500/[0.04] p-4">
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-orange-300">+ Agregar ciudad nueva</p>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                <input value={nuevaCiudad.nombre} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, nombre: e.target.value })}
                  placeholder="Nombre de la ciudad" className="rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400" />
                <input value={nuevaCiudad.lat} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, lat: e.target.value })}
                  placeholder="Latitud (opcional)" className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400 sm:w-36" />
                <input value={nuevaCiudad.lon} onChange={(e) => setNuevaCiudad({ ...nuevaCiudad, lon: e.target.value })}
                  placeholder="Longitud (opcional)" className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400 sm:w-36" />
                <button onClick={crearCiudad} disabled={creandoCiudad || !nuevaCiudad.nombre.trim()}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-4 py-2 text-sm font-black disabled:opacity-50">
                  {creandoCiudad ? "…" : "Crear"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[var(--muted2)]">Se crea como borrador. Cargale coordenadas y algún negocio real antes de activarla -- sin coordenadas no se puede activar.</p>
            </div>

            {ciudades.length === 0 ? (
              <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-10 text-center">
                <MapPin className="mx-auto h-10 w-10 text-[var(--muted2)]" />
                <p className="mt-3 text-sm text-[var(--muted2)]">Todavía no hay ciudades cargadas.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {ciudades.map(c => (
                  <div key={c.id} className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] shadow-[inset_0_1px_1px_var(--card-inner-highlight)] p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-6 w-6 shrink-0 text-sky-400" />
                      <div className="min-w-0 flex-1">
                        {editandoCiudad === c.id ? (
                          <input value={nombreCiudadEdit} onChange={(e) => setNombreCiudadEdit(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renombrarCiudad(c.id)}
                            autoFocus
                            className="w-full rounded-lg border border-orange-400/40 bg-[var(--card-inner)] px-2 py-1 text-sm font-bold outline-none" />
                        ) : (
                          <p className="truncate font-bold">{c.name}</p>
                        )}
                        <p className="text-xs text-[var(--muted)]">
                          /{c.slug} · {c._negocios ?? 0} negocio{c._negocios === 1 ? "" : "s"}
                          {(c.latitude == null || c.longitude == null) && <span className="ml-2 text-amber-400">sin coordenadas</span>}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                        c.status === "active" ? "bg-green-500/15 text-green-300"
                        : c.status === "draft" ? "bg-[var(--ov-10)] text-[var(--muted)]"
                        : c.status === "suspended" ? "bg-red-500/15 text-red-300"
                        : c.status === "archived" ? "bg-[var(--ov-05)] text-[var(--muted2)]"
                        : "bg-amber-500/15 text-amber-300"
                      }`}>
                        {c.status === "active" ? "Activa" : c.status === "draft" ? "Borrador" : c.status === "suspended" ? "Suspendida" : c.status === "archived" ? "Archivada" : "Inactiva"}
                      </span>
                      <InfoTip label="Qué implica activar una ciudad">
                        Al activar una ciudad se publican su página (/{c.slug}), su selector, sus barrios, negocios y ofertas para todo el público. Al desactivarla, suspenderla o archivarla, su contenido deja de mostrarse pero no se borra nada.
                      </InfoTip>
                      <button
                        onClick={() => cambiarEstadoCiudad(c.id, c.status === "active" ? "inactive" : "active")}
                        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${
                          c.status === "active"
                            ? "border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : "bg-gradient-to-r from-orange-500 to-red-600 text-[var(--text)] hover:opacity-90"
                        }`}
                      >
                        {c.status === "active" ? "Desactivar" : "Activar"}
                      </button>
                      {editandoCiudad === c.id ? (
                        <>
                          <button onClick={() => renombrarCiudad(c.id)}
                            className="shrink-0 rounded-xl bg-orange-500/20 px-3 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/30">
                            Guardar
                          </button>
                          <button onClick={() => setEditandoCiudad(null)}
                            className="shrink-0 rounded-xl border border-[var(--line-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:bg-[var(--ov-05)]">
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button onClick={() => { setEditandoCiudad(c.id); setNombreCiudadEdit(c.name); }}
                          className="flex shrink-0 items-center gap-1 rounded-xl border border-[var(--line-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:bg-[var(--ov-05)]">
                          <Pencil className="h-3 w-3" /> Renombrar
                        </button>
                      )}
                      <button onClick={() => setBarrioAbierto(barrioAbierto === c.id ? null : c.id)}
                        className="shrink-0 rounded-xl border border-[var(--line-strong)] px-3 py-2 text-xs font-bold text-[var(--muted)] hover:bg-[var(--ov-05)]">
                        + Barrio
                      </button>
                      <select value={c.status || "draft"} onChange={(e) => cambiarEstadoCiudad(c.id, e.target.value)}
                        title="Otros estados (borrador, suspendida, archivada)"
                        className="shrink-0 rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-2 py-2 text-xs font-bold outline-none focus:border-orange-400">
                        <option value="draft">Borrador</option>
                        <option value="inactive">Inactiva</option>
                        <option value="active">Activa</option>
                        <option value="suspended">Suspender</option>
                        <option value="archived">Archivar</option>
                      </select>
                      <button onClick={() => borrarCiudad(c.id, c.name)}
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/25">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {barrioAbierto === c.id && (
                      <div className="mt-3 flex gap-2 border-t border-[var(--line)] pt-3">
                        <input value={nuevoBarrio} onChange={(e) => setNuevoBarrio(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && agregarBarrio(c.id)}
                          placeholder="Nombre del barrio" autoFocus
                          className="flex-1 rounded-xl border border-[var(--line-strong)] bg-[var(--card-inner)] px-3 py-2 text-sm outline-none focus:border-orange-400" />
                        <button onClick={() => agregarBarrio(c.id)} disabled={!nuevoBarrio.trim()}
                          className="rounded-xl bg-[var(--ov-10)] px-4 py-2 text-xs font-bold hover:bg-[var(--ov-20)] disabled:opacity-50">
                          Agregar
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-[var(--muted2)]">
              Solo las ciudades en estado &quot;Activa&quot; aparecen públicamente. Podés cargar negocios en una ciudad en
              borrador antes de activarla -- desactivar/suspender/archivar nunca borra los datos, se puede
              reactivar en cualquier momento.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
