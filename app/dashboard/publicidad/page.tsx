"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Megaphone, Plus, Eye, MousePointerClick } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/auth-provider";
import DashboardNav from "@/components/dashboard/dashboard-nav";
import { AD_PLACEMENTS } from "@/lib/ads-plans";

const ESTADOS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-white/10 text-[var(--muted)]" },
  pending_payment: { label: "Falta pagar", cls: "bg-amber-500/15 text-amber-400" },
  pending_review: { label: "En revisión", cls: "bg-blue-500/15 text-blue-400" },
  rejected: { label: "Rechazada", cls: "bg-red-500/15 text-[var(--bad)]" },
  scheduled: { label: "Programada", cls: "bg-blue-500/15 text-blue-400" },
  active: { label: "Activa", cls: "bg-green-500/15 text-[var(--ok)]" },
  paused: { label: "Pausada", cls: "bg-white/10 text-[var(--muted)]" },
  completed: { label: "Finalizada", cls: "bg-white/10 text-[var(--muted2)]" },
};

const PAGO_MSG: Record<string, { text: string; cls: string }> = {
  exito: { text: "✅ Pago registrado. Tu campaña queda pendiente de revisión -- te avisamos apenas la aprobemos.", cls: "border-green-500/30 bg-green-500/10 text-[var(--ok)]" },
  pendiente: { text: "⏳ Tu pago está pendiente de confirmación. Actualizá esta página en unos minutos.", cls: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  error: { text: "❌ El pago no se completó. Podés intentar de nuevo desde la campaña.", cls: "border-red-500/30 bg-red-500/10 text-[var(--bad)]" },
};

export default function PublicidadPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pago = searchParams.get("pago");
  const [campanas, setCampanas] = useState<any[]>([]);
  const [eventos, setEventos] = useState<Record<string, { impresiones: number; clicks: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const sb = supabase();
      const { data: negocios } = await sb.from("businesses").select("id").eq("owner_id", user.id);
      const ids = (negocios || []).map((b) => b.id);
      if (ids.length === 0) { setLoading(false); return; }

      const { data: camps } = await sb.from("ad_campaigns")
        .select("id, name, placement, status, budget_cents, starts_at, ends_at, creative_url, admin_notes, created_at, businesses(name)")
        .in("business_id", ids).order("created_at", { ascending: false });
      setCampanas(camps || []);

      const campIds = (camps || []).map((c) => c.id);
      if (campIds.length) {
        const [imps, clks] = await Promise.all([
          sb.from("ad_impressions").select("campaign_id").in("campaign_id", campIds),
          sb.from("ad_clicks").select("campaign_id").in("campaign_id", campIds),
        ]);
        const mapa: Record<string, { impresiones: number; clicks: number }> = {};
        (imps.data || []).forEach((r: any) => { mapa[r.campaign_id] = mapa[r.campaign_id] || { impresiones: 0, clicks: 0 }; mapa[r.campaign_id].impresiones++; });
        (clks.data || []).forEach((r: any) => { mapa[r.campaign_id] = mapa[r.campaign_id] || { impresiones: 0, clicks: 0 }; mapa[r.campaign_id].clicks++; });
        setEventos(mapa);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <main className="min-h-screen bg-[var(--bg)] flex items-center justify-center text-[var(--text)]">Cargando...</main>;

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-24">
      <div className="mx-auto max-w-3xl px-4 pb-8 pt-10 sm:px-6 sm:pt-14">
        <DashboardNav />
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-start gap-3">
            <Megaphone className="mt-1 h-8 w-8 shrink-0 text-[var(--accent-ink)]" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.4em] text-[var(--accent-ink)]">La Gran Barata Ads</p>
              <h1 className="mt-2 text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-space)" }}>Publicidad</h1>
              <p className="mt-3 text-[var(--muted)]">Avisos pagos con analytics reales -- impresiones y clicks de verdad.</p>
            </div>
          </div>
          <Link href="/dashboard/publicidad/nueva" className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-black uppercase tracking-wider text-white transition hover:opacity-90">
            <Plus className="h-4 w-4" /> Nueva campaña
          </Link>
        </div>

        {pago && PAGO_MSG[pago] && (
          <div className={`mb-6 rounded-xl border p-4 text-sm font-bold ${PAGO_MSG[pago].cls}`}>{PAGO_MSG[pago].text}</div>
        )}

        {campanas.length === 0 ? (
          <div className="rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] p-10 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-[var(--muted2)]" />
            <p className="mt-3 font-bold text-[var(--text)]/70">Todavía no creaste ninguna campaña</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Mostrá tu negocio en el feed de Mercado Vivo con un aviso patrocinado.</p>
            <Link href="/dashboard/publicidad/nueva" className="mt-5 inline-block rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-black uppercase tracking-wider text-white">
              Crear mi primera campaña
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {campanas.map((c) => {
              const est = ESTADOS[c.status] || ESTADOS.draft;
              const ev = eventos[c.id] || { impresiones: 0, clicks: 0 };
              const ctr = ev.impresiones > 0 ? ((ev.clicks / ev.impresiones) * 100).toFixed(1) + "%" : "—";
              return (
                <div key={c.id} className="flex flex-col gap-4 rounded-2xl border border-[var(--ov-08)] bg-[var(--ov-03)] p-4 sm:flex-row sm:items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.creative_url} alt={c.name} className="h-20 w-32 shrink-0 rounded-lg border border-[var(--line)] object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{c.name}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${est.cls}`}>{est.label}</span>
                      {c.businesses?.name && <span className="text-xs text-[var(--muted2)]">· {c.businesses.name}</span>}
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted2)]">
                      {AD_PLACEMENTS[c.placement]?.label || c.placement} · ${(c.budget_cents / 100).toLocaleString("es-AR")} ·{" "}
                      {new Date(c.starts_at).toLocaleDateString("es-AR")} → {c.ends_at ? new Date(c.ends_at).toLocaleDateString("es-AR") : "sin fin"}
                    </p>
                    {c.status === "rejected" && c.admin_notes && (
                      <p className="mt-1 text-xs font-bold text-[var(--bad)]">Motivo: {c.admin_notes}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-4 text-center sm:gap-6">
                    <div>
                      <p className="flex items-center justify-center gap-1 text-lg font-black num"><Eye className="h-3.5 w-3.5 text-[var(--muted2)]" />{ev.impresiones}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">Vistas</p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-1 text-lg font-black num"><MousePointerClick className="h-3.5 w-3.5 text-[var(--muted2)]" />{ev.clicks}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">Clicks</p>
                    </div>
                    <div>
                      <p className="text-lg font-black num">{ctr}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--muted2)]">CTR</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
