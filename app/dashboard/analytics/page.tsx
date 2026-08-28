"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import Link from "next/link";
import { TrendingUp, Eye, MessageCircle, MapPin, Heart, Ticket, Users, Lock, ShoppingBasket, CircleCheck, Flame } from "lucide-react";
import InfoTip from "@/components/ui/info-tip";
import { planDe } from "@/lib/plans";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState<any[]>([]);
  const [selectedBiz, setSelectedBiz] = useState<string>("");
  const [stats, setStats] = useState<any>({
    views: 0, offerViews: 0, interest: 0, whatsapp: 0, map: 0, favorites: 0, coupons: 0,
    couponsRedeemed: 0, follows: 0, shares: 0, checkout: 0, payments: 0
  });
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posicion, setPosicion] = useState<{ puesto: number; total: number; percentil: number } | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: biz } = await supabase().from("businesses")
        .select("id, name, plan, category").eq("owner_id", user.id);
      if (biz && biz.length) {
        setNegocios(biz);
        setSelectedBiz(biz[0].id);
      }
      setLoading(false);
    })();
  }, [user]);

  // Comparación real contra el resto de negocios de la misma categoría
  // (business_leagues ya calcula puntos reales por negocio -- no se
  // inventa nada, se ordena y se ve dónde queda éste).
  useEffect(() => {
    if (!selectedBiz) { setPosicion(null); return; }
    (async () => {
      const negocio = negocios.find((n) => n.id === selectedBiz);
      if (!negocio?.category) { setPosicion(null); return; }
      const { data: liga } = await supabase().from("business_leagues")
        .select("id, puntos").eq("category", negocio.category).order("puntos", { ascending: false });
      if (!liga || liga.length < 2) { setPosicion(null); return; }
      const puesto = liga.findIndex((l) => l.id === selectedBiz) + 1;
      if (puesto === 0) { setPosicion(null); return; }
      const percentil = Math.max(1, Math.round((puesto / liga.length) * 100));
      setPosicion({ puesto, total: liga.length, percentil });
    })();
  }, [selectedBiz, negocios]);

  useEffect(() => {
    if (!selectedBiz) return;
    (async () => {
      const desde = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: events } = await supabase().from("analytics_events")
        .select("*").eq("business_id", selectedBiz).gte("created_at", desde)
        .order("created_at", { ascending: false });

      const counts: Record<string, number> = {
        view_business: 0, view_offer: 0, interest_offer: 0, click_whatsapp: 0, click_map: 0,
        favorite: 0, coupon_generated: 0, coupon_redeemed: 0, follow: 0, share_business: 0,
        share_offer: 0, checkout_started: 0, payment_confirmed: 0
      };

      (events || []).forEach(e => {
        if (counts[e.event_type] !== undefined) {
          counts[e.event_type]++;
        }
      });

      setStats({
        views: counts.view_business,
        offerViews: counts.view_offer,
        interest: counts.interest_offer,
        whatsapp: counts.click_whatsapp,
        map: counts.click_map,
        favorites: counts.favorite,
        coupons: counts.coupon_generated,
        couponsRedeemed: counts.coupon_redeemed,
        follows: counts.follow,
        shares: counts.share_business + counts.share_offer,
        checkout: counts.checkout_started,
        payments: counts.payment_confirmed,
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
    return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;
  }

  const negocioSel = negocios.find(b => b.id === selectedBiz);
  const planActual = planDe(negocioSel);

  const cards = [
    { icon: Eye, label: "Visitas", value: stats.views, color: "text-[var(--place)]", info: "Cuántas veces entraron a la ficha de tu negocio en los últimos 30 días." },
    { icon: Eye, label: "Ofertas vistas", value: stats.offerViews, color: "text-[var(--accent-ink)]", info: "Cuántas veces abrieron una oferta asociada a tu negocio." },
    { icon: Flame, label: "Interés", value: stats.interest, color: "text-[var(--accent-ink)]", info: "Cuántas personas tocaron \"Me interesa\" en una oferta tuya -- una señal de intención, previa al contacto." },
    { icon: MessageCircle, label: "WhatsApp", value: stats.whatsapp, color: "text-[var(--ok)]", info: "Cuántas personas tocaron el botón de WhatsApp para escribirte." },
    { icon: MapPin, label: "Cómo llegar", value: stats.map, color: "text-[var(--accent-ink)]", info: "Cuántas personas tocaron \"Cómo llegar\" para ver tu ubicación en el mapa." },
    { icon: Heart, label: "Favoritos", value: stats.favorites, color: "text-[var(--bad)]", info: "Cuántas personas guardaron tu negocio en sus favoritos." },
    { icon: Users, label: "Seguidores", value: stats.follows, color: "text-purple-400", info: "Cuántas personas te siguen para enterarse de tus novedades y ofertas." },
    { icon: Ticket, label: "Cupones", value: stats.coupons, color: "text-[var(--ok)]", info: "Cuántos cupones de tus ofertas generaron los clientes para usar en el local." },
    { icon: CircleCheck, label: "Ventas confirmadas", value: stats.couponsRedeemed, color: "text-[var(--ok)]", info: "Cupones que de verdad canjearon en tu local -- la parte del embudo que prueba una venta real." },
    { icon: TrendingUp, label: "Compartidos", value: stats.shares, color: "text-[var(--place)]", info: "Compartidos rastreados de tu negocio y sus ofertas." },
    { icon: ShoppingBasket, label: "Intenciones", value: stats.checkout, color: "text-purple-400", info: "Personas que iniciaron un pedido desde el changuito." },
    { icon: CircleCheck, label: "Pagos", value: stats.payments, color: "text-[var(--ok)]", info: "Pagos confirmados por el webhook verificado de Mercado Pago." },
  ];

  // Embudo de conversión real: cada etapa es un evento de analytics_events
  // ya existente, sin inventar ningún número. No es un funnel estricto por
  // usuario (no encadena el mismo visitante etapa a etapa), es un conteo
  // agregado de 30 días -- igual que el resto de este dashboard -- pero
  // ordenado en la secuencia real de decisión del cliente.
  const funnel = [
    { label: "Personas alcanzadas", sub: "Vieron tu negocio", value: stats.views, icon: Eye },
    { label: "Vieron oferta", sub: "Abrieron una oferta", value: stats.offerViews, icon: Eye },
    { label: "Mostraron interés", sub: "Tocaron \"Me interesa\"", value: stats.interest, icon: Flame },
    { label: "Contactaron", sub: "Escribieron por WhatsApp", value: stats.whatsapp, icon: MessageCircle },
    { label: "Usaron cupón", sub: "Generaron un cupón", value: stats.coupons, icon: Ticket },
    { label: "Ventas confirmadas", sub: "Canjearon el cupón en el local", value: stats.couponsRedeemed, icon: CircleCheck },
  ];
  const funnelTope = funnel[0].value;

  const maxViews = Math.max(...timeline.map(d => d.views), 1);

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <DashboardNav />
        
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-8 w-8 text-[var(--accent-ink)]" />
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: "var(--font-space)" }}>Analytics</h1>
            <p className="text-[var(--muted)]">Estadísticas de los últimos 30 días</p>
          </div>
        </div>

        {negocios.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="font-bold">Todavía no tenés un negocio creado.</p>
              <p className="mt-1 text-sm text-[var(--muted)]">Cuando crees tu negocio, acá vas a ver visitas, contactos por WhatsApp y más.</p>
              <Link href="/dashboard/nuevo" className="mt-4 inline-block rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-black hover:opacity-90">Crear mi negocio</Link>
            </div>
          </div>
        ) : (
        <>
        {negocios.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {negocios.map(b => (
              <button key={b.id} onClick={() => setSelectedBiz(b.id)}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  selectedBiz === b.id ? "bg-[var(--accent)]" : "border border-[var(--line-strong)] bg-[var(--ov-05)]"
                }`}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        {!planActual.stats ? (
          <div className="rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[.08] to-[var(--accent2)]/[.04] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-8 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <Lock className="mx-auto mb-3 h-8 w-8 text-[var(--accent-ink)]" />
              <p className="font-black">Las estadísticas completas son de Plan PRO</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
                Con el plan Gratis ves solo tus visitas totales. Con PRO Comerciante desbloqueás el detalle día a día,
                contactos por WhatsApp, favoritos, cupones y tasa de conversión.
              </p>
              <p className="mt-4 text-3xl font-black text-[var(--accent-ink)] tabular-nums">{stats.views} <span className="text-sm font-bold text-[var(--muted)]">visitas (30 días)</span></p>
              <Link href="/dashboard/planes" className="mt-5 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-black hover:opacity-90">Mejorar a PRO →</Link>
            </div>
          </div>
        ) : (
        <>
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-8">
          {cards.map(c => (
            <div key={c.label} className="rounded-[1.5rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
              <div className="rounded-[1.1rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-5 text-center shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
                <c.icon className={`mx-auto h-6 w-6 ${c.color}`} />
                <p className="mt-2 text-3xl font-black tabular-nums">{c.value}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">{c.label} <InfoTip label={`Qué significa ${c.label}`}>{c.info}</InfoTip></p>
              </div>
            </div>
          ))}
        </div>

        {posicion && (
          <div className="mb-8 rounded-[1.75rem] border border-[var(--place)]/25 bg-gradient-to-br from-[var(--place)]/[.08] to-[var(--place)]/[.02] p-1.5">
            <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
              <p className="flex items-center gap-1.5 font-black">
                📊 Tu lugar en la categoría
                <InfoTip label="Cómo se calcula">Se compara con los demás negocios de tu mismo rubro usando los mismos puntos reales del ranking (seguidores, reseñas, ofertas, cupones canjeados) -- sin mostrar datos privados de nadie.</InfoTip>
              </p>
              <p className="mt-2 text-sm text-[var(--text)]/70">
                Estás en el <strong className="text-[var(--place)]">puesto {posicion.puesto} de {posicion.total}</strong> -- eso te ubica en el{" "}
                <strong className="text-[var(--place)]">top {posicion.percentil}%</strong> de tu rubro.
              </p>
            </div>
          </div>
        )}

        {/* Timeline gráfico simple */}
        <div className="mb-6 rounded-[1.75rem] border border-[var(--ov-06)] bg-[var(--ov-02)] p-1.5">
        <div className="rounded-[1.375rem] border border-[var(--ov-05)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
          <h2 className="text-lg font-black mb-4">Actividad últimos 7 días</h2>
          <div className="space-y-3">
            {timeline.map(day => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="w-20 text-xs text-[var(--muted)]">
                  {new Date(day.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric" })}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-[var(--ov-05)] rounded overflow-hidden">
                    <div className="h-full bg-[var(--accent)] transition-all"
                      style={{ width: `${(day.views / maxViews) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold w-12 text-right tabular-nums">{day.views}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--muted2)]">Barras = visitas al negocio</p>
        </div>
        </div>

        {/* Embudo de conversión */}
        <div className="rounded-[1.75rem] border border-[var(--accent)]/25 bg-gradient-to-br from-[var(--accent)]/[.08] to-[var(--accent2)]/[.04] p-1.5">
          <div className="rounded-[1.375rem] border border-[var(--ov-06)] bg-[var(--card-inner)] p-6 shadow-[inset_0_1px_1px_var(--card-inner-highlight)]">
            <h2 className="text-lg font-black mb-1 flex items-center gap-1.5">
              Embudo de conversión
              <InfoTip label="Cómo se arma este embudo">Cada etapa es un evento real que ya registramos en los últimos 30 días -- nadie inventa ni proyecta números. No sigue al mismo visitante paso a paso, es el volumen de cada etapa en el período, ordenado en la secuencia real de decisión de un cliente.</InfoTip>
            </h2>
            <p className="mb-5 text-sm text-[var(--muted)]">De cuánta gente te vio, a cuántas ventas se confirmaron.</p>

            {funnelTope === 0 ? (
              <p className="text-sm text-[var(--muted)]">Todavía no hay suficientes visitas en los últimos 30 días para armar el embudo.</p>
            ) : (
              <div className="space-y-3">
                {funnel.map((etapa, i) => {
                  const pctTope = funnelTope > 0 ? (etapa.value / funnelTope) * 100 : 0;
                  const anterior = i > 0 ? funnel[i - 1].value : null;
                  const pctPaso = anterior && anterior > 0 ? (etapa.value / anterior) * 100 : null;
                  return (
                    <div key={etapa.label} className="flex items-center gap-3">
                      <etapa.icon className="h-4 w-4 shrink-0 text-[var(--accent-ink)]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold">{etapa.label}</span>
                          <span className="shrink-0 text-sm font-black tabular-nums">{etapa.value}</span>
                        </div>
                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[var(--ov-05)]">
                          <div
                            className="h-full rounded-full bg-[var(--accent)] transition-all"
                            style={{ width: `${Math.max(pctTope, etapa.value > 0 ? 2 : 0)}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[11px] text-[var(--muted2)]">
                          {etapa.sub}
                          {pctPaso !== null && <> -- {pctPaso.toFixed(1)}% de la etapa anterior</>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
