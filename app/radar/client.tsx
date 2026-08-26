"use client";
import { useEffect, useMemo, useState } from "react";
import { Flame, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { hoyArgentina } from "@/lib/fecha-ar";
import OfferCard from "@/components/ui/offer-card";
import Badge from "@/components/ui/badge";
import VotoDelDia from "@/components/home/voto-del-dia";

function useCountdown(targetDate: Date) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, targetDate.getTime() - now);
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[60px] rounded-xl border border-red-400/30 bg-black/60 px-3 py-2 text-center shadow-2xl shadow-black/50">
        <p className="font-display text-2xl tabular-nums text-white md:text-3xl">{String(value).padStart(2, "0")}</p>
      </div>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">{label}</p>
    </div>
  );
}

export default function RadarPage({ initial = [] }: { initial?: any[] }) {
  const [ofertas, setOfertas] = useState<any[]>(initial || []);
  const [loading, setLoading] = useState(true);
  // useMemo: la fecha debe ser ESTABLE entre renders (si no, loop infinito)
  const finDia = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);
  const { h, m, s } = useCountdown(finDia);

  useEffect(() => {
    (async () => {
      const hoy = hoyArgentina();
      const { data } = await supabase().from("offers_with_business")
        .select("*").eq("active", true).eq("valid_until", hoy)
        .order("created_at", { ascending: false });

      const ahora = Date.now();
      const reales = (data || []).map((o: any) => ({
        id: o.id, negocio: o.business_name, slug: o.business_slug,
        producto: o.title, cat: o.business_category || "",
        vence: o.valid_until, descuento: o.discount_percent,
        antes: o.old_price ? Number(o.old_price) : undefined,
        ahora: o.offer_price ? Number(o.offer_price) : undefined,
        portada_url: o.business_portada,
        rating: o.business_rating ? Number(o.business_rating) : undefined,
        verificado: o.business_status === "verificado",
        impulsada: !!(o.impulsada_hasta && new Date(o.impulsada_hasta).getTime() > ahora),
      }))
        // Impulsadas primero -- lo que el negocio pagó por destacar hoy.
        .sort((a: any, b: any) => (b.impulsada ? 1 : 0) - (a.impulsada ? 1 : 0));

      setOfertas(reales);
      setLoading(false);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg)] pb-24 text-[var(--text)]">
      {/* Hero del Radar */}
      <section className="relative overflow-hidden border-b border-red-400/20 bg-gradient-to-br from-red-900/30 via-[#0c0a0b] to-[#861642]/30 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(239,68,68,0.15),_transparent_50%)]" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.35em] text-[var(--accent)]" style={{ fontFamily: "var(--font-display)" }}>
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--accent)]" /> Radar en vivo
          </p>
          <Badge variant="danger" size="md" pulse>
            <Zap className="h-3 w-3" /> Terminan HOY
          </Badge>
          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight text-white md:text-6xl">
            Radar de{" "}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent magenta-glow">
              ofertas urgentes
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
            Solo ofertas que vencen hoy. Después de la medianoche desaparecen.
          </p>

          {/* Countdown */}
          <div className="mt-8 flex justify-center gap-3 md:gap-6">
            <CountdownBlock value={h} label="Horas" />
            <span className="text-3xl font-black text-white/40 self-start mt-3">:</span>
            <CountdownBlock value={m} label="Minutos" />
            <span className="text-3xl font-black text-white/40 self-start mt-3">:</span>
            <CountdownBlock value={s} label="Segundos" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl border border-[var(--line)] bg-[var(--surface)]" />
            ))}
          </div>
        ) : ofertas.length === 0 ? (
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-12 text-center shadow-2xl shadow-black/50">
            <Flame className="mx-auto mb-3 h-12 w-12 text-[var(--muted2)]" />
            <p className="font-display text-2xl uppercase tracking-tight">No hay ofertas que terminen hoy</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Volvé mañana o mirá todas las ofertas activas.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-3xl uppercase tracking-tight">
                <Flame className="mr-2 inline h-5 w-5 text-[var(--accent)]" />
                {ofertas.length} oferta{ofertas.length !== 1 ? "s" : ""} que vence{ofertas.length !== 1 ? "n" : ""}{" "}
                <span className="text-[var(--accent)]">hoy</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ofertas.map((o) => <OfferCard key={o.id} o={o} />)}
            </div>
          </>
        )}
      </div>
      <VotoDelDia />
    </main>
  );
}
