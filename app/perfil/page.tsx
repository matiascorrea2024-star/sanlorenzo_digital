"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Store, Flag, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ChangePassword from "@/components/profile/change-password";
import PlatformWhatsappSetting from "@/components/profile/platform-whatsapp-setting";
import PlatformPaymentSetting from "@/components/profile/platform-payment-setting";
import NewsletterOptIn from "@/components/profile/newsletter-optin";
import PushNotificationsToggle from "@/components/profile/push-notifications-toggle";
import AdminFrame, { AdminBadge } from "@/components/ui/admin-frame";
import StaffAvatar from "@/components/ui/staff-avatar";
import DivisionFrame from "@/components/ui/division-frame";
import { RANGOS, rangoDeUsuario, ESCALA_PUNTOS_USUARIO } from "@/lib/ranks";
import { fechaArgentina, hoyArgentina, esHoyArgentina } from "@/lib/fecha-ar";

// Mismos rangos que los negocios (lib/ranks.ts) -- un solo lenguaje visual
// en toda la plataforma, en vez de una escalera de "vecino" separada.
// Cada escalón tiene su propio texto positivo: nadie es "el último", cada
// uno tiene su propio marco.
const PREMIOS_RANGO: Record<string, string[]> = {
  "Nuevo": ["🗺️ Descubrís todos los negocios de la ciudad", "⭐ Sumás puntos por explorar, contactar y opinar"],
  "Activo": ["🎖 Marco propio visible en tus reseñas", "🔔 Avisos prioritarios de ofertas que seguís"],
  "Destacado": ["🧭 Subís posiciones en el ranking de vecinos", "🎖 Marco plateado en toda la plataforma"],
  "Oro": ["🔥 Acceso a ofertas secretas solo para rangos altos", "🎖 Marco dorado en tus reseñas"],
  "Élite": ["💎 Prioridad en sorteos y beneficios especiales", "🎖 Marco de cristal, se nota en cualquier lado"],
  "Maestro": ["👑 Reconocido como referente del barrio", "🎖 Marco violeta, muy pocos vecinos llegan acá"],
  "Leyenda": ["🏆 Podio permanente en el ranking del barrio", "🎖 Marco de fuego, el tuyo es único"],
  "Gran Barata": ["🌈 El rango más alto de San Lorenzo Digital", "🎖 Marco holográfico -- prácticamente nadie llega"],
};

type Stats = { seg: number; res: number; vis: number; cats: number; wa: number; sh: number; ref: number };

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [seguidos, setSeguidos] = useState<any[]>([]);
  const [perdidas, setPerdidas] = useState(0);
  const [stats, setStats] = useState<Stats>({ seg: 0, res: 0, vis: 0, cats: 0, wa: 0, sh: 0, ref: 0 });
  const [cargando, setCargando] = useState(true);
  const [misiones, setMisiones] = useState<any>(null);
  const [racha, setRacha] = useState(0);
  const [extra, setExtra] = useState<any>(null);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [pushOptIn, setPushOptIn] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      setUser(user);
      if (user) {
        const { data: prof } = await sb.from("user_profiles").select("role, newsletter_opt_in, notifications_opt_in").eq("user_id", user.id).maybeSingle();
        setIsAdmin(prof?.role === "admin");
        setNewsletterOptIn(!!prof?.newsletter_opt_in);
        setPushOptIn(!!prof?.notifications_opt_in);
        const { data: fol } = await sb
          .from("followers").select("business_id, businesses(name, slug)")
          .eq("user_id", user.id);
        // Loss aversion con datos 100% reales: ofertas de negocios que
        // sigue este usuario, que ya vencieron en los últimos 14 días --
        // no hace falta saber si las vio o no, alcanza con que existieron
        // y se le pasaron.
        const idsSeguidos = (fol || []).map((f: any) => f.business_id).filter(Boolean);
        if (idsSeguidos.length) {
          const hace14 = fechaArgentina(new Date(Date.now() - 14 * 86400000));
          const hoyStr = hoyArgentina();
          const { count: venc } = await sb.from("offers").select("*", { count: "exact", head: true })
            .in("business_id", idsSeguidos).gte("valid_until", hace14).lt("valid_until", hoyStr);
          setPerdidas(venc || 0);
        }
        // Las reseñas reales viven en business_reviews (ver Fase 2/3 --
        // "reviews" es una tabla huérfana a la que ya nadie escribe).
        const { data: revsData } = await sb
          .from("business_reviews").select("created_at").eq("user_id", user.id);
        const count = (revsData || []).length;
        const { data: act } = await sb
          .from("user_activity").select("type, business_id, businesses(category), created_at")
          .eq("user_id", user.id);
        const { data: refsData } = await sb
          .from("referrals").select("activated_at").eq("referrer_id", user.id);
        const refActivos = (refsData || []).filter((r: any) => r.activated_at).length;

        const acts = act || [];
        const vistas = new Set(acts.filter((a: any) => a.type === "view").map((a: any) => a.business_id));
        const cats = new Set(acts.filter((a: any) => a.type === "view" && a.businesses).map((a: any) => a.businesses.category));
        const was = new Set(acts.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id));
        const shs = new Set(acts.filter((a: any) => a.type === "share").map((a: any) => a.business_id));

        // created_at es timestamptz -- comparar el string tal cual (huso
        // UTC implícito) contra un "hoy" corría el mismo riesgo de
        // desfasaje horario que el resto de esta sesión. esHoyArgentina
        // convierte el timestamp real a fecha de Argentina antes de comparar.
        const deHoy = acts.filter((a: any) => a.created_at && esHoyArgentina(a.created_at));
        setMisiones({
          vis: new Set(deHoy.filter((a: any) => a.type === "view").map((a: any) => a.business_id)).size,
          wa: new Set(deHoy.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id)).size,
          sh: new Set(deHoy.filter((a: any) => a.type === "share").map((a: any) => a.business_id)).size,
        });
        // Mismo bug de huso horario que el resto de la sesión, versión
        // "racha": agrupar actividad por día en UTC podía partir en dos
        // un mismo día argentino (o unir dos días distintos), rompiendo
        // la racha real del usuario -- justo el número que más ve.
        const dias = [...new Set(acts.filter((a: any) => a.created_at).map((a: any) => fechaArgentina(new Date(a.created_at))))] as string[];
        let r = 0;
        let cursor = new Date();
        if (!dias.includes(fechaArgentina(cursor))) cursor = new Date(Date.now() - 86400000);
        while (dias.includes(fechaArgentina(cursor))) { r++; cursor = new Date(cursor.getTime() - 86400000); }
        setRacha(r);
        const hace7 = fechaArgentina(new Date(Date.now() - 6 * 86400000));
        const semana = acts.filter((a: any) => a.created_at && fechaArgentina(new Date(a.created_at)) >= hace7);
        const visWeek = new Set(semana.filter((a: any) => a.type === "view").map((a: any) => a.business_id)).size;
        const waWeek = new Set(semana.filter((a: any) => a.type === "whatsapp").map((a: any) => a.business_id)).size;
        const resWeek = (revsData || []).filter((r2: any) => r2.created_at && fechaArgentina(new Date(r2.created_at)) >= hace7).length;
        let maxRacha = 0, tmp = 0, prev = "";
        for (const d of [...dias].sort()) {
          tmp = prev && (new Date(d + "T00:00:00Z").getTime() - new Date(prev + "T00:00:00Z").getTime()) === 86400000 ? tmp + 1 : 1;
          if (tmp > maxRacha) maxRacha = tmp;
          prev = d;
        }
        setExtra({ visWeek, waWeek, resWeek, maxRacha });
        setSeguidos(fol || []);
        setStats({ seg: (fol || []).length, res: count || 0, vis: vistas.size, cats: cats.size, wa: was.size, sh: shs.size, ref: refActivos });
      }
      setCargando(false);
    })();
  }, []);

  if (cargando) return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--ov-10)]" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded bg-[var(--ov-10)]" />
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--ov-10)]" />
          </div>
        </div>
        <div className="mt-6 h-3 w-full animate-pulse rounded-full bg-[var(--ov-10)]" />
        <div className="mt-8 grid grid-cols-3 gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--ov-05)]" />
          ))}
        </div>
      </div>
    </main>
  );

  if (!user)
    return (
      <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-5xl mb-4">🎖</p>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-space)" }}>Tu perfil de vecino</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Iniciá sesión para ver tus medallas y niveles.</p>
          <Link href="/login" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-6 py-3 text-sm font-black">Ingresar →</Link>
        </div>
      </main>
    );

  const bonusRacha = (extra?.maxRacha || 0) >= 7 ? 50 : 0;
  const bonusSemana = (extra?.visWeek || 0) >= 10 && (extra?.waWeek || 0) >= 3 && (extra?.resWeek || 0) >= 1 ? 40 : 0;
  const puntos = stats.seg * 10 + stats.res * 25 + stats.wa * 15 + stats.sh * 10 + stats.vis * 2 + stats.ref * 30 + bonusRacha + bonusSemana;
  const nivel = rangoDeUsuario(puntos);
  const faltanReal = Math.ceil(nivel.faltan / ESCALA_PUNTOS_USUARIO);

  const medallas = MEDALLAS.map((m) => ({
    ...m,
    ganada: m.nombre === "Leyenda del barrio" ? puntos >= 500 : m.cond(stats),
  }));

  return (
    <main className="bg-[var(--bg)] text-[var(--text)] min-h-screen pb-24">
      {/* Hero editorial: avatar/marco real + nombre gigante + racha/rol
          como pills al costado -- calco del mockup aprobado. El marco de
          rango (DivisionFrame/AdminFrame) NO se toca, es el sistema
          visual ya validado. */}
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-14 sm:px-6 md:pt-20">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-end md:text-left">
          {isAdmin ? (
            <AdminFrame size={128}><StaffAvatar size={128} /></AdminFrame>
          ) : (
            <DivisionFrame puntos={puntos} escala={ESCALA_PUNTOS_USUARIO} size={128} showLabel>
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-4xl font-black">
                {(user.email || "?")[0].toUpperCase()}
              </div>
            </DivisionFrame>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--muted2)]">{isAdmin ? "Fundador" : "Vecino de San Lorenzo"}</p>
            <h1 className="mt-2 truncate text-4xl font-bold sm:text-6xl" style={{ fontFamily: "var(--font-space)" }}>{user.email}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:justify-start">
              {isAdmin ? (
                <span className="flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-bold text-yellow-200">
                  <Shield className="h-4 w-4" /> Staff · San Lorenzo Digital
                </span>
              ) : (
                <>
                  {racha > 0 && (
                    <span className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ov-05)] px-4 py-2 text-sm font-bold">
                      🔥 Racha de {racha} día{racha > 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--ov-05)] px-4 py-2 text-sm font-bold" style={{ color: nivel.accent }}>
                    {nivel.rango}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="flex h-full flex-col justify-between rounded-[calc(2.5rem-0.375rem)] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <div>
                  <p className="mb-4 text-[10px] font-black uppercase tracking-[.35em] text-[var(--muted2)]">Progreso de nivel</p>
                  <p className="text-6xl font-black leading-none sm:text-7xl" style={{ fontFamily: "var(--font-ticket)" }}>
                    {puntos} <span className="text-lg font-bold tracking-normal text-[var(--muted2)]">pts</span>
                  </p>
                </div>
                {nivel.proximo && (
                  <div className="mt-8">
                    <div className="mb-2 flex items-end justify-between text-xs font-bold text-[var(--muted2)]">
                      <span>PRÓXIMO RANGO: {nivel.proximo.toUpperCase()}</span>
                      <span className="text-orange-400">{faltanReal} pts restantes</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--ov-05)]">
                      <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-600" style={{ width: `${nivel.progreso}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[calc(2.5rem-0.375rem)] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <p className="mb-5 text-[10px] font-black uppercase tracking-[.35em] text-[var(--muted2)]">Medallas y logros</p>
                <div className="grid grid-cols-4 gap-3">
                  {medallas.slice(0, 8).map((m, i) => (
                    <div key={i} title={`${m.nombre} -- ${m.desc}`}
                      className={`group flex aspect-square cursor-help items-center justify-center rounded-2xl border transition-all ${m.ganada ? "border-yellow-500/20 bg-yellow-500/10 hover:bg-yellow-500/20" : "border-[var(--line)] bg-[var(--ov-05)] opacity-30 grayscale"}`}>
                      <span className="text-2xl transition-transform group-hover:scale-110">{m.ganada ? m.icon : "🔒"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAdmin && perdidas > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4">
            <span className="text-2xl">⏰</span>
            <div>
              <p className="text-sm font-black text-[var(--bad)]">
                Se te {perdidas === 1 ? "pasó" : "pasaron"} {perdidas} oferta{perdidas === 1 ? "" : "s"} de negocios que seguís
              </p>
              <p className="text-xs text-[var(--muted)]">Activá las notificaciones para no perderte la próxima.</p>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6 text-center">
            <div className="mt-2 flex justify-center"><AdminBadge text="Staff" /></div>
            <p className="mt-3 text-sm text-[var(--muted)]">No hay nivel que te quede grande: sos quien mueve todo esto.</p>
          </div>
        )}

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/favoritos", icon: "❤️", txt: "Favoritos" },
            { href: "/mensajes", icon: "💬", txt: "Mensajes" },
            { href: "/vecinos", icon: "👥", txt: "Ranking vecinos" },
            { href: "/panel", icon: "🏪", txt: "Mis negocios" },
          ].map((a) => (
            <Link key={a.href} href={a.href} className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5 transition hover:-translate-y-1">
              <div className="flex flex-col items-center gap-2 rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <p className="text-2xl">{a.icon}</p>
                <p className="text-xs font-bold">{a.txt}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6">

        <h2 id="cuenta" className="mt-10 mb-4 scroll-mt-24 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Cuenta</h2>
        <div className="space-y-3">
          <Link href="/planes" className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--ov-05)] p-4 hover:border-orange-400/50 hover:bg-[var(--ov-10)] transition">
            <div>
              <p className="font-bold">Tu plan: Gratis</p>
              <p className="text-xs text-[var(--muted)]">Ver beneficios y mejorar</p>
            </div>
            <span className="text-orange-400">→</span>
          </Link>
          <ChangePassword email={user.email} />
          <PushNotificationsToggle userId={user.id} initial={pushOptIn} />
          <NewsletterOptIn userId={user.id} initial={newsletterOptIn} />
          {isAdmin && <PlatformWhatsappSetting />}
          {isAdmin && <PlatformPaymentSetting />}
        </div>

        <h2 className="mt-10 mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Tu actividad</h2>
        <div className="grid grid-cols-3 gap-3 md:grid-cols-7 text-center">
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-orange-400">{stats.vis}</p><p className="text-[10px] text-[var(--muted)] uppercase">Visitas</p></div>
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-[var(--bad)]">{stats.cats}</p><p className="text-[10px] text-[var(--muted)] uppercase">Rubros</p></div>
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-[var(--bad)]">{stats.seg}</p><p className="text-[10px] text-[var(--muted)] uppercase">Seguidos</p></div>
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-[var(--ok)]">{stats.wa}</p><p className="text-[10px] text-[var(--muted)] uppercase">Contactos</p></div>
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-[var(--place)]">{stats.sh}</p><p className="text-[10px] text-[var(--muted)] uppercase">Compartidos</p></div>
          <div className="rounded-xl bg-[var(--ov-05)] p-3"><p className="text-xl font-black text-[var(--warn)]">{stats.res}</p><p className="text-[10px] text-[var(--muted)] uppercase">Reseñas</p></div>
          <Link href="/invitar" className="rounded-xl bg-[var(--ov-05)] p-3 hover:bg-[var(--ov-10)] transition"><p className="text-xl font-black text-purple-400">{stats.ref}</p><p className="text-[10px] text-[var(--muted)] uppercase">Referidos</p></Link>
        </div>

        {isAdmin ? (
          <>
            <h2 id="misiones" className="mt-10 mb-4 scroll-mt-24 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Accesos rápidos</h2>
            <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
              {[
                { href: "/admin", icon: Shield, txt: "Overview" },
                { href: "/admin?tab=negocios", icon: Store, txt: "Negocios" },
                { href: "/admin?tab=reportes", icon: Flag, txt: "Reportes" },
                { href: "/admin?tab=ciudades", icon: MapPin, txt: "Ciudades" },
              ].map((a) => (
                <Link key={a.href} href={a.href}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-yellow-400/25 bg-yellow-500/5 p-4 text-center hover:border-yellow-400/50 hover:bg-yellow-500/10 transition">
                  <a.icon className="h-5 w-5 text-[var(--warn)]" />
                  <p className="text-xs font-bold">{a.txt}</p>
                </Link>
              ))}
            </div>
          </>
        ) : (
        <>
        <h2 id="misiones" className="mt-10 mb-4 scroll-mt-24 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Misiones de hoy</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { icon: "👁", txt: "Visitá 3 negocios distintos", act: misiones?.vis || 0, meta: 3 },
            { icon: "💬", txt: "Contactá 1 negocio por WhatsApp", act: misiones?.wa || 0, meta: 1 },
            { icon: "📤", txt: "Compartí 1 oferta", act: misiones?.sh || 0, meta: 1 },
          ].map((m, i) => {
            const done = m.act >= m.meta;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${done ? "border-green-400/50 bg-green-500/10" : "border-[var(--line)] bg-[var(--ov-05)]"}`}>
                <p className="text-sm font-bold">{m.icon} {m.txt}</p>
                <p className={`mt-2 text-xs font-black ${done ? "text-[var(--ok)]" : "text-[var(--muted)]"}`}>
                  {done ? "✅ ¡Misión cumplida!" : `${Math.min(m.act, m.meta)}/${m.meta} · en progreso`}
                </p>
              </div>
            );
          })}
        </div>


        <h2 className="mt-10 mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Misiones de la semana</h2>
        <div className="grid gap-2 md:grid-cols-3">
          {[
            { icon: "👁", txt: "Visitá 10 negocios distintos", act: extra?.visWeek || 0, meta: 10 },
            { icon: "💬", txt: "Contactá 3 negocios", act: extra?.waWeek || 0, meta: 3 },
            { icon: "⭐", txt: "Dejá 1 reseña", act: extra?.resWeek || 0, meta: 1 },
          ].map((m, i) => {
            const done = m.act >= m.meta;
            return (
              <div key={i} className={`rounded-2xl border p-4 ${done ? "border-green-400/50 bg-green-500/10" : "border-[var(--line)] bg-[var(--ov-05)]"}`}>
                <p className="text-sm font-bold">{m.icon} {m.txt}</p>
                <p className={`mt-2 text-xs font-black ${done ? "text-[var(--ok)]" : "text-[var(--muted)]"}`}>
                  {done ? "✅ ¡Hecha!" : `${m.act}/${m.meta} · en progreso`}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-xs text-[var(--muted)]">
          🎁 Premios reales: racha de 7 días = <strong className="text-[var(--warn)]">+50 pts</strong> · completar las 3 semanales = <strong className="text-[var(--warn)]">+40 pts</strong>
        </div>

        <h2 className="mt-10 mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Rangos — ¿hasta dónde llegás?</h2>
        <div className="grid gap-2">
          {RANGOS.map((n) => {
            const minReal = Math.round(n.min / ESCALA_PUNTOS_USUARIO);
            const esActual = n.nombre === nivel.rango;
            const alcanzado = puntos >= minReal;
            return (
              <div key={n.nombre} className={`rounded-2xl border p-4 ${esActual ? "border-orange-400/60 bg-orange-500/10" : alcanzado ? "border-green-400/40 bg-green-500/10" : "border-[var(--line)] bg-[var(--ov-05)]"}`}>
                <div className="flex items-center justify-between">
                  <p className="font-black" style={{ color: alcanzado || esActual ? n.accent : undefined }}>
                    {n.nombre} <span className="text-xs text-[var(--muted)]">· {minReal} pts</span>
                  </p>
                  <p className="text-xs font-bold">{esActual ? "📍 Tu rango" : alcanzado ? "✅" : ""}</p>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-[var(--muted)]">
                  {(PREMIOS_RANGO[n.nombre] || []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        </>
        )}

        <h2 className="mt-10 mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Tus medallas</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {medallas.map((m, i) => (
            <div key={i} className={`rounded-2xl border p-4 text-center ${m.ganada ? "border-yellow-400/50 bg-yellow-500/10" : "border-[var(--line)] bg-[var(--ov-05)] opacity-40"}`}>
              <p className="text-3xl">{m.ganada ? m.icon : "🔒"}</p>
              <p className="mt-1 text-sm font-black">{m.nombre}</p>
              <p className="text-[10px] text-[var(--muted)]">{m.desc}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-10 mb-4 text-2xl font-bold" style={{ fontFamily: "var(--font-space)" }}>Negocios que seguís</h2>
        <div className="grid gap-2">
          {seguidos.map((f: any) => (
            <Link key={f.business_id} href={"/negocio/" + (f.businesses?.slug || "")} className="rounded-xl border border-[var(--line)] bg-[var(--ov-05)] px-4 py-3 font-bold hover:border-orange-400/60">
              {f.businesses?.name || "Negocio"}
            </Link>
          ))}
          {seguidos.length === 0 && (
            <p className="text-sm text-[var(--muted)]">Todavía no seguís ningún negocio. Tocá ⭐ Seguir en cualquier miniweb para empezar.</p>
          )}
        </div>
        <div className="mt-10 text-center">
          <Link href="/vecinos" className="text-sm font-black text-orange-400 hover:text-orange-300">👥 Ver ranking de vecinos →</Link>
        </div>
      </div>
    </main>
  );
}
