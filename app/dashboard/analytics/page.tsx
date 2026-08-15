"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import Link from "next/link";
import { TrendingUp, Eye, MessageCircle, MapPin, Heart, Ticket, Users, Lock } from "lucide-react";
import InfoTip from "@/components/ui/info-tip";
import { planDe } from "@/lib/plans";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [stats, setStats] = useState<any>({
    views: 0, whatsapp: 0, map: 0, favorites: 0, coupons: 0, follows: 0
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("id, name, plan").eq("owner_id", user.id);
      if (biz && biz.length) {
        setNegocios(biz);
        setSelectedBiz(biz[0].id);
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!selectedBiz) return;
    (async () => {
      const desde = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: events } = await supabase().from("analytics_events")
        .select("*").eq("business_id", selectedBiz).gte("created_at", desde)
        .order("created_at", { ascending: false });

      const counts: Record<string, number> = {
        view_business: 0, click_whatsapp: 0, click_map: 0,
        favorite: 0, coupon_generated: 0, follow: 0
      };

      (events || []).forEach(e => {
        if (counts[e.event_type] !== undefined) {
          counts[e.event_type]++;
        }
      });

      setStats({
        views: counts.view_business,
        whatsapp: counts.click_whatsapp,
        map: counts.click_map,
        favorites: counts.favorite,
        coupons: counts.coupon_generated,
        follows: counts.follow,
      });

      // Timeline últimos 7 días
      const days: Record<string, Record<string, number>> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        days[key] = { views: 0, whatsapp: 0, coupons: 0 };
      }

      (events || []).forEach(e => {
        const key = e.created_at.slice(0, 10);
        if (days[key]) {
          if (e.event_type === "view_business") days[key].views++;
          if (e.event_type === "click_whatsapp") days[key].whatsapp++;
          if (e.event_type === "coupon_generated") days[key].coupons++;
        }
      });

      setTimeline(Object.entries(days).map(([date, data]) => ({ date, ...data })));
    })();
  }, [selectedBiz]);

  if (loading) {
    return <main className="min-h-screen bg-[#120d09] flex items-center justify-center text-white">Cargando...</main>;
  }

  const negocioSel = negocios.find(b => b.id === selectedBiz);
  const planActual = planDe(negocioSel);

  const cards = [
    { icon: Eye, label: "Visitas", value: stats.views, color: "text-sky-400", info: "Cuántas veces entraron a la ficha de tu negocio en los últimos 30 días." },
    { icon: MessageCircle, label: "WhatsApp", value: stats.whatsapp, color: "text-green-400", info: "Cuántas personas tocaron el botón de WhatsApp para escribirte." },
    { icon: MapPin, label: "Cómo llegar", value: stats.map, color: "text-orange-400", info: "Cuántas personas tocaron \"Cómo llegar\" para ver tu ubicación en el mapa." },
    { icon: Heart, label: "Favoritos", value: stats.favorites, color: "text-red-400", info: "Cuántas personas guardaron tu negocio en sus favoritos." },
    { icon: Users, label: "Seguidores", value: stats.follows, color: "text-purple-400", info: "Cuántas personas te siguen para enterarse de tus novedades y ofertas." },
    { icon: Ticket, label: "Cupones", value: stats.coupons, color: "text-emerald-400", info: "Cuántos cupones de tus ofertas generaron los clientes para usar en el local." },
  ];

  const maxViews = Math.max(...timeline.map(d => d.views), 1);

  return (
    <main className="min-h-screen bg-[#120d09] text-white pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <DashboardNav />
        
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-8 w-8 text-orange-400" />
          <div>
            <h1 className="text-3xl font-black">Analytics</h1>
            <p className="text-white/60">Estadísticas de los últimos 30 días</p>
          </div>
        </div>

        {negocios.length === 0 ? (
          <div className="sld-card rounded-2xl p-8 text-center">
            <p className="font-bold">Todavía no tenés un negocio creado.</p>
            <p className="mt-1 text-sm text-white/50">Cuando crees tu negocio, acá vas a ver visitas, contactos por WhatsApp y más.</p>
            <Link href="/dashboard/nuevo" className="mt-4 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-2.5 text-sm font-black">Crear mi negocio</Link>
          </div>
        ) : (
        <>
        {negocios.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {negocios.map(b => (
              <button key={b.id} onClick={() => setSelectedBiz(b.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  selectedBiz === b.id ? "bg-gradient-to-r from-orange-500 to-pink-500" : "border border-white/15 bg-white/5"
                }`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {!planActual.stats ? (
          <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-8 text-center">
            <Lock className="mx-auto mb-3 h-8 w-8 text-orange-400" />
            <p className="font-black">Las estadísticas completas son de Plan PRO</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-white/60">
              Con el plan Gratis ves solo tus visitas totales. Con PRO Comerciante desbloqueás el detalle día a día,
              contactos por WhatsApp, favoritos, cupones y tasa de conversión.
            </p>
            <p className="mt-4 text-3xl font-black text-orange-400">{stats.views} <span className="text-sm font-bold text-white/50">visitas (30 días)</span></p>
            <Link href="/dashboard/planes" className="mt-5 inline-block rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-2.5 text-sm font-black">Mejorar a PRO →</Link>
          </div>
        ) : (
        <>
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          {cards.map(c => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <c.icon className={`mx-auto h-6 w-6 ${c.color}`} />
              <p className="mt-2 text-3xl font-black">{c.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{c.label} <InfoTip label={`Qué significa ${c.label}`}>{c.info}</InfoTip></p>
            </div>
          ))}
        </div>

        {/* Timeline gráfico simple */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <h2 className="text-lg font-black mb-4">Actividad últimos 7 días</h2>
          <div className="space-y-3">
            {timeline.map(day => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-20 text-xs text-white/50">
                  {new Date(day.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-white/5 rounded overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                      style={{ width: `${(day.views / maxViews) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-12 text-right">{day.views}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-white/40">Barras = visitas al negocio</p>
        </div>

        {/* Conversión */}
        <div className="rounded-2xl border border-orange-400/30 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-6">
          <h2 className="text-lg font-black mb-3 flex items-center gap-1.5">
            Tasa de conversión
            <InfoTip label="Qué es la tasa de conversión">De cada 100 personas que ven tu negocio, cuántas terminan haciendo algo concreto (escribirte o generar un cupón). Un número más alto significa que tu ficha convence.</InfoTip>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/60">Visitas → WhatsApp</p>
              <p className="text-2xl font-black text-green-400">
                {stats.views > 0 ? ((stats.whatsapp / stats.views) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-white/60">Visitas → Cupones</p>
              <p className="text-2xl font-black text-emerald-400">
                {stats.views > 0 ? ((stats.coupons / stats.views) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
        </>
        )}
        </>
        )}
      </div>
    </main>
  );
}
